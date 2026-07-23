import { Hono } from 'hono';
import { db } from '../../db/connection';
import { inventoryItems, stockLevels, stockBatches, stockMovements, partBrands, deviceBrands, productCompatibility, deviceModels, purchaseOrderLines, itemBrandPricing, branches } from '../../db/schema/index';
import { eq, desc, and, gt } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { successResponse, errorResponse } from '../../lib/response';
import { cursorCondition, decodeCursor, parseLimit, buildPage, orderByCursor } from '../../lib/pagination';
import { validateTargetMargin, DEFAULT_MARGIN_STRATEGY, MARGIN_STRATEGIES, resolveMarginConfig, evaluatePriceAgainstMargin, type MarginStrategy } from '../../lib/margin';
import { assertPriceAllowed } from '../../modules/inventory/service';
import { BusinessError } from '../../lib/errors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono();

// GET /v1/inventory (List all SKUs)
router.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  const uninitialized = c.req.query('uninitialized');
  
  try {
    const filters = [eq(inventoryItems.tenantId, tenantId)];
    if (uninitialized === 'true') {
      filters.push(eq(inventoryItems.isStockInitialized, false));
    }

    // H13 — cursor pagination. Previously an unbounded, un-paginated list.
    const limit = parseLimit(c.req.query('limit'));
    const cursorParam = c.req.query('cursor');
    if (cursorParam) {
      const cursor = decodeCursor(cursorParam);
      if (!cursor) return errorResponse(c, 'INVALID_CURSOR', 'Malformed cursor', undefined, 400);
      filters.push(cursorCondition(inventoryItems.createdAt, inventoryItems.id, cursor));
    }

    const items = await db.query.inventoryItems.findMany({
      where: and(...filters),
      with: {
        category: true,
        stockLevels: { where: eq(stockLevels.tenantId, tenantId) },
        stockBatches: true,
        compatibility: { columns: { deviceModelId: true } },
        brandPricing: {
          with: {
            partBrand: true
          }
        },
        partBrand: true
      },
      orderBy: orderByCursor(inventoryItems.createdAt, inventoryItems.id),
      limit: limit + 1,
    });

    const { page, hasMore, nextCursor } = buildPage(items, limit);

    // Transform output to calculate total stock
    const result = page.map(item => {
      const totalAvailable = item.stockLevels.reduce((sum, level) => sum + level.quantityAvailable, 0);
      const totalReserved = item.stockLevels.reduce((sum, level) => sum + level.quantityReserved, 0);
      
      // Calculate stock per brand per branch
      const brandStock: Record<string, Record<string, number>> = {};
      if (item.stockBatches) {
        for (const batch of item.stockBatches) {
          if (batch.quantityRemaining > 0) {
            const bId = batch.partBrandId || 'generic';
            const branchId = batch.branchId;
            if (!brandStock[branchId]) brandStock[branchId] = {};
            brandStock[branchId][bId] = (brandStock[branchId][bId] || 0) + batch.quantityRemaining;
          }
        }
      }
      
      // P1 (4C.2) — "new stock arrives" half: computed on read, not persisted, so a
      // batch that quietly erodes margin on an unchanged price shows up here
      // without any write-path/schema change. See lib/margin.ts's own module doc.
      const marginConfig = resolveMarginConfig(item, item.category);
      const marginStatus = evaluatePriceAgainstMargin(
        parseFloat(item.sellingPrice),
        parseFloat(item.unitCostAvg),
        marginConfig
      ).status;

      return {
        ...item,
        totalAvailable,
        totalReserved,
        brandStock,
        marginStatus
      };
    });

    return successResponse(c, result, { has_more: hasMore, next_cursor: nextCursor });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch inventory', [err.message]);
  }
});

// POST /v1/inventory (Create New SKU)
// P1 (4C.2) — no margin check here: a brand-new item has unitCostAvg = 0 (no
// stock received yet), which evaluatePriceAgainstMargin always treats as
// 'unknown_cost' (margin cannot be judged against a cost that doesn't exist yet).
// The check becomes meaningful once the item actually has a cost — PATCH,
// goods receipt, and opname.
const createItemSchema = z.object({
  sku: z.string().min(1),
  universalCode: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().uuid().optional(),
  unitOfMeasure: z.string().default('pcs'),
  sellingPrice: z.number().min(0).default(0),
  reorderPoint: z.number().default(0)
});

router.post('/', requirePermission('inventory.manage_items'), zValidator('json', createItemSchema), auditMiddleware({ action: 'inventory_item.create', entityType: 'inventory_item', bodyFields: ['sku', 'universalCode', 'name', 'categoryId', 'sellingPrice'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');
  
  try {
    let unresolved: string[] = [];
    
    const [newItem] = await db.transaction(async (tx) => {
      // 1. Create the inventory item first
      const [item] = await tx.insert(inventoryItems)
        .values({
          tenantId,
          sku: data.sku,
          universalCode: data.universalCode,
          name: data.name,
          categoryId: data.categoryId,
          unitOfMeasure: data.unitOfMeasure,
          sellingPrice: data.sellingPrice.toString(),
          reorderPoint: data.reorderPoint,
          unresolvedCompatibility: []
        })
        .returning();

      // A stock_levels row is the only thing POS checkout trusts for
      // "is there stock" — create it for every branch up front (at 0) so a
      // brand-new item is never sellable-but-missing-its-cache-row (H4 Part 3).
      const tenantBranches = await tx.query.branches.findMany({
        where: eq(branches.tenantId, tenantId)
      });
      if (tenantBranches.length > 0) {
        await tx.insert(stockLevels).values(
          tenantBranches.map(branch => ({
            tenantId,
            inventoryItemId: item.id,
            branchId: branch.id,
            quantityAvailable: 0,
            quantityReserved: 0
          }))
        );
      }

      // 2. Parse compatibility
      const allBrands = await tx.query.deviceBrands.findMany({
        where: eq(deviceBrands.tenantId, tenantId)
      });
      
      const { parseCompatibilityStrings } = await import('../../utils/compatibilityParser');
      const parsedModels = parseCompatibilityStrings(data.name, allBrands);
      
      const resolvedModelIds: string[] = [];
      const unresolvedNames: string[] = [];

      // 3. Look up device models
      for (const modelStr of parsedModels) {
        // We do a simple ILIKE search or full text search.
        // For exact or partial match, we search deviceModels.
        // Usually, modelStr looks like "Oppo A5s" or just "A5s".
        // Let's find a model where the model name ILIKE the string or string includes model name.
        const foundModels = await tx.query.deviceModels.findMany({
          with: { deviceBrand: true }
        });
        
        // Find best match in memory to handle complex matching like "Oppo A5s" matching model "A5s" of brand "Oppo"
        let matched = false;
        for (const fm of foundModels) {
          const fullName = `${fm.deviceBrand.name} ${fm.name}`.toLowerCase();
          if (modelStr.toLowerCase() === fullName || modelStr.toLowerCase().includes(fm.name.toLowerCase()) || fullName.includes(modelStr.toLowerCase())) {
            resolvedModelIds.push(fm.id);
            matched = true;
            break; // take first match
          }
        }
        
        if (!matched) {
          unresolvedNames.push(modelStr);
        }
      }

      // 4. Insert resolved compatibilities
      if (resolvedModelIds.length > 0) {
        // deduplicate
        const uniqueIds = [...new Set(resolvedModelIds)];
        for (const modelId of uniqueIds) {
          await tx.insert(productCompatibility).values({
            inventoryItemId: item.id,
            deviceModelId: modelId
          });
        }
      }

      // 5. Update unresolved back to the item
      if (unresolvedNames.length > 0) {
        await tx.update(inventoryItems)
          .set({ unresolvedCompatibility: unresolvedNames })
          .where(eq(inventoryItems.id, item.id));
        
        item.unresolvedCompatibility = unresolvedNames;
      }

      return [item];
    });
      
    return successResponse(c, newItem, undefined, 201);
  } catch (err: any) {
    if (err.code === '23505') { // Unique constraint violation (SKU)
      return errorResponse(c, 'CONFLICT', 'SKU already exists', [], 409);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create inventory item', [err.message]);
  }
});

// GET /v1/inventory/:id (Get single item with details)
router.get('/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const itemId = c.req.param('id');
  
  try {
    const item = await db.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.id, itemId),
        eq(inventoryItems.tenantId, tenantId)
      ),
      with: {
        category: true,
        stockBatches: {
          with: { supplier: true, partBrand: true },
          where: gt(stockBatches.quantityRemaining, 0)
        },
        compatibility: {
          with: {
            deviceModel: {
              with: { deviceBrand: true }
            }
          }
        },
        brandPricing: {
          with: {
            partBrand: true
          }
        }
      }
    });

    if (!item) return errorResponse(c, 'NOT_FOUND', 'Item not found', [], 404);

    // P1 (4C.2) — same computed-on-read marginStatus as the list endpoint.
    const marginStatus = evaluatePriceAgainstMargin(
      parseFloat(item.sellingPrice),
      parseFloat(item.unitCostAvg),
      resolveMarginConfig(item, item.category)
    ).status;

    return successResponse(c, { ...item, marginStatus });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch item', [err.message]);
  }
});

// PATCH /v1/inventory/:id — update margin config (4C.1), base selling price, and
// light master fields (F4). Item-level margin config overrides its category's.
// F4 — `sku` is deliberately NOT editable here: it is used as a stable key
// elsewhere (batches/movements reference the item by id, but the SKU itself is
// the human-facing stable identifier printed on receipts/labels). If it ever
// needs to be editable, it must respect the (tenant_id, sku) unique constraint
// the same way create's 23505 handling does.
const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().uuid().nullish(),
  universalCode: z.string().min(1).nullish(),
  unitOfMeasure: z.string().min(1).optional(),
  sellingPrice: z.number().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  marginStrategy: z.enum(MARGIN_STRATEGIES as unknown as [MarginStrategy, ...MarginStrategy[]]).nullish(),
  targetMargin: z.number().nullish(),
  // P1 (4C.2) — the one deliberate override for a genuine clearance price.
  allowBelowCost: z.boolean().optional().default(false),
});

router.patch('/:id', requirePermission('inventory.manage_items'), zValidator('json', updateItemSchema), auditMiddleware({ action: 'inventory_item.update', entityType: 'inventory_item', entityIdParam: 'id', bodyFields: ['name', 'categoryId', 'universalCode', 'unitOfMeasure', 'sellingPrice', 'reorderPoint', 'marginStrategy', 'targetMargin', 'allowBelowCost'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const existing = await db.query.inventoryItems.findFirst({
      where: and(eq(inventoryItems.id, id), eq(inventoryItems.tenantId, tenantId)),
    });
    if (!existing) return errorResponse(c, 'NOT_FOUND', 'Item not found', [], 404);

    // Validate targetMargin against the item's effective strategy after the update.
    const effectiveStrategy = (data.marginStrategy ?? existing.marginStrategy ?? DEFAULT_MARGIN_STRATEGY) as MarginStrategy;
    const effectiveTarget = data.targetMargin !== undefined
      ? data.targetMargin
      : (existing.targetMargin == null ? null : parseFloat(existing.targetMargin));
    const marginErr = effectiveTarget == null ? null : validateTargetMargin(effectiveStrategy, effectiveTarget);
    if (marginErr) return errorResponse(c, 'VALIDATION_ERROR', marginErr, [], 400);

    // P1 (4C.2) — if the price is being changed, judge it against the item's real
    // effective margin config (item override -> category -> default) and its WAC.
    // Uses the *post-patch* categoryId/marginStrategy/targetMargin, so changing the
    // category or the margin config in the same request is judged consistently.
    let marginEvaluation: Awaited<ReturnType<typeof assertPriceAllowed>> | undefined;
    if (data.sellingPrice !== undefined) {
      const patchedItemForMargin = {
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        marginStrategy: data.marginStrategy !== undefined ? data.marginStrategy : existing.marginStrategy,
        targetMargin: data.targetMargin !== undefined
          ? (data.targetMargin == null ? null : data.targetMargin.toString())
          : existing.targetMargin,
      };
      marginEvaluation = await assertPriceAllowed(
        db,
        tenantId,
        patchedItemForMargin,
        data.sellingPrice,
        parseFloat(existing.unitCostAvg),
        data.allowBelowCost
      );
    }

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.categoryId !== undefined) patch.categoryId = data.categoryId;
    if (data.universalCode !== undefined) patch.universalCode = data.universalCode;
    if (data.unitOfMeasure !== undefined) patch.unitOfMeasure = data.unitOfMeasure;
    if (data.sellingPrice !== undefined) patch.sellingPrice = data.sellingPrice.toString();
    if (data.reorderPoint !== undefined) patch.reorderPoint = data.reorderPoint;
    if (data.marginStrategy !== undefined) patch.marginStrategy = data.marginStrategy;
    if (data.targetMargin !== undefined) patch.targetMargin = data.targetMargin == null ? null : data.targetMargin.toString();

    if (Object.keys(patch).length === 0) return successResponse(c, existing);

    const [updated] = await db.update(inventoryItems)
      .set(patch)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.tenantId, tenantId)))
      .returning();

    // Only surface a warning when there's something to warn about — 'ok' and
    // 'unknown_cost' (no stock received yet, margin can't be judged) are silent.
    const marginWarning = marginEvaluation && marginEvaluation.status !== 'ok' && marginEvaluation.status !== 'unknown_cost'
      ? marginEvaluation
      : undefined;

    return successResponse(c, { ...updated, marginWarning });
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update item', undefined, 500);
  }
});

// DELETE /v1/inventory/:id
router.delete('/:id', requirePermission('inventory.manage_items'), auditMiddleware({ action: 'inventory_item.delete', entityType: 'inventory_item', entityIdParam: 'id' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const inventoryItemId = c.req.param('id');
  
  try {
    await db.transaction(async (tx) => {
      // 1. Check if item is used in any Purchase Orders
      const poLines = await tx.query.purchaseOrderLines.findFirst({
        where: and(
          eq(purchaseOrderLines.inventoryItemId, inventoryItemId),
          eq(purchaseOrderLines.tenantId, tenantId)
        )
      });
      if (poLines) {
        throw new Error('Cannot delete item because it is referenced in a Purchase Order. Delete the PO first.');
      }
      
      // 2. Check if item is used in any Service Tickets (if we had the schema imported here, but we can just let FK fail if so)
      
      // Dev-mode cascade delete (since this is early development, we allow deleting products that only have stock levels/compat)
      // 3. Delete product compatibility
      await tx.delete(productCompatibility).where(eq(productCompatibility.inventoryItemId, inventoryItemId));
      
      // 4. Delete stock movements
      await tx.delete(stockMovements).where(eq(stockMovements.inventoryItemId, inventoryItemId));
      
      // 5. Delete stock batches
      await tx.delete(stockBatches).where(eq(stockBatches.inventoryItemId, inventoryItemId));
      
      // 6. Delete stock levels (even if quantity is 0, the row exists)
      await tx.delete(stockLevels).where(and(
        eq(stockLevels.inventoryItemId, inventoryItemId),
        eq(stockLevels.tenantId, tenantId)
      ));
      
      // 7. Delete the item itself
      await tx.delete(inventoryItems).where(
        and(
          eq(inventoryItems.id, inventoryItemId),
          eq(inventoryItems.tenantId, tenantId)
        )
      );
    });
    
    return successResponse(c, { deleted: true });
  } catch (err: any) {
    if (err.code === '23503') { // Foreign key constraint violation
      return errorResponse(c, 'CONFLICT', 'Cannot delete item because it is referenced in transactions (Service Tickets, etc).', [], 409);
    }
    return errorResponse(c, 'INTERNAL_ERROR', err.message || 'Failed to delete item', [err.message]);
  }
});


export { router as itemsRouter };
