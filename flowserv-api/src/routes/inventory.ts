import { Hono } from 'hono';
import { db } from '../db/connection';
import { inventoryItems, stockLevels, stockBatches, stockMovements, partBrands, deviceBrands, productCompatibility, deviceModels, purchaseOrderLines } from '../db/schema';
import { eq, desc, and, gt } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const inventoryRouter = new Hono();
inventoryRouter.use('*', requireAuth);

// GET /v1/inventory (List all SKUs)
inventoryRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  const uninitialized = c.req.query('uninitialized');
  
  try {
    const filters = [eq(inventoryItems.tenantId, tenantId)];
    if (uninitialized === 'true') {
      filters.push(eq(inventoryItems.isStockInitialized, false));
    }
    
    const items = await db.query.inventoryItems.findMany({
      where: and(...filters),
      with: {
        category: true,
        stockLevels: true,
        stockBatches: true,
        compatibility: { columns: { deviceModelId: true } },
        brandPricing: {
          with: {
            partBrand: true
          }
        },
        partBrand: true
      },
      orderBy: [desc(inventoryItems.sku)]
    });
    
    // Transform output to calculate total stock
    const result = items.map(item => {
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
      
      return {
        ...item,
        totalAvailable,
        totalReserved,
        brandStock
      };
    });
      
    return successResponse(c, result);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch inventory', [err.message]);
  }
});

// POST /v1/inventory (Create New SKU)
const createItemSchema = z.object({
  sku: z.string().min(1),
  universalCode: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().uuid().optional(),
  unitOfMeasure: z.string().default('pcs'),
  sellingPrice: z.number().min(0).default(0),
  reorderPoint: z.number().default(0)
});

inventoryRouter.post('/', zValidator('json', createItemSchema), async (c) => {
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

      // 2. Parse compatibility
      const allBrands = await tx.query.deviceBrands.findMany({
        where: eq(deviceBrands.tenantId, tenantId)
      });
      
      const { parseCompatibilityStrings } = await import('../utils/compatibilityParser');
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
inventoryRouter.get('/:id', async (c) => {
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
        }
      }
    });

    if (!item) return errorResponse(c, 'NOT_FOUND', 'Item not found', [], 404);
    return successResponse(c, item);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch item', [err.message]);
  }
});

// PUT /v1/inventory/:id/compatibility (Update resolved/unresolved compatibility)
const updateCompatibilitySchema = z.object({
  resolvedModelIds: z.array(z.string().uuid()),
  unresolvedCompatibility: z.array(z.string())
});

inventoryRouter.put('/:id/compatibility', zValidator('json', updateCompatibilitySchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const itemId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    await db.transaction(async (tx) => {
      // Clear existing compatibility
      await tx.delete(productCompatibility).where(eq(productCompatibility.inventoryItemId, itemId));
      
      // Insert new compatibility
      if (data.resolvedModelIds.length > 0) {
        const uniqueIds = [...new Set(data.resolvedModelIds)];
        for (const modelId of uniqueIds) {
          await tx.insert(productCompatibility).values({
            inventoryItemId: itemId,
            deviceModelId: modelId
          });
        }
      }

      // Update unresolved
      await tx.update(inventoryItems)
        .set({ unresolvedCompatibility: data.unresolvedCompatibility })
        .where(and(
          eq(inventoryItems.id, itemId),
          eq(inventoryItems.tenantId, tenantId)
        ));
    });

    return successResponse(c, { message: 'Compatibility updated' });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update compatibility', [err.message]);
  }
});
// POST /v1/inventory/:id/receive (Goods Receipt)
const receiveStockSchema = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative')
});

inventoryRouter.post('/:id/receive', zValidator('json', receiveStockSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const inventoryItemId = c.req.param('id');
  const data = c.req.valid('json');
  
  try {
    // DB Transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // 1. Create Stock Batch (FIFO Tracking)
      const [batch] = await tx.insert(stockBatches).values({
        tenantId,
        branchId: data.branchId,
        inventoryItemId,
        supplierId: data.supplierId,
        unitCost: data.unitCost.toString(),
        quantityReceived: data.quantity,
        quantityRemaining: data.quantity
      }).returning();
      
      // 2. Create Stock Movement (Ledger/Audit)
      await tx.insert(stockMovements).values({
        tenantId,
        branchId: data.branchId,
        inventoryItemId,
        stockBatchId: batch.id,
        movementType: 'in', // Goods Receipt
        quantity: data.quantity,
        referenceType: 'manual_receipt'
      });
      
      // 3. Upsert Stock Level (Current Total)
      const existingLevels = await tx.select().from(stockLevels).where(
        and(
          eq(stockLevels.inventoryItemId, inventoryItemId),
          eq(stockLevels.branchId, data.branchId)
        )
      );
      
      if (existingLevels.length > 0) {
        // Update existing
        await tx.update(stockLevels)
          .set({ quantityAvailable: existingLevels[0].quantityAvailable + data.quantity })
          .where(eq(stockLevels.id, existingLevels[0].id));
      } else {
        // Insert new
        await tx.insert(stockLevels).values({
          inventoryItemId,
          branchId: data.branchId,
          quantityAvailable: data.quantity,
          quantityReserved: 0
        });
      }
      
      // Note: Ideally we also recalculate the `unitCostAvg` in `inventoryItems` here.
      // Weighted Average Cost formula = (Current Qty * Current Avg + New Qty * New Cost) / (Current Qty + New Qty)
      // We will skip that complex math for MVP or just update it naively.
      
      return batch;
    });
    
    return successResponse(c, result, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to receive stock', [err.message]);
  }
});

// DELETE /v1/inventory/:id
inventoryRouter.delete('/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const inventoryItemId = c.req.param('id');
  
  try {
    await db.transaction(async (tx) => {
      // 1. Check if item is used in any Purchase Orders
      const poLines = await tx.query.purchaseOrderLines.findFirst({
        where: eq(purchaseOrderLines.inventoryItemId, inventoryItemId)
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
      await tx.delete(stockLevels).where(eq(stockLevels.inventoryItemId, inventoryItemId));
      
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

export { inventoryRouter };
