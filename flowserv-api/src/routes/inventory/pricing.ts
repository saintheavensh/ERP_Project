import { Hono } from 'hono';
import { db } from '../../db/connection';
import { inventoryItems, stockLevels, stockBatches, stockMovements, partBrands, deviceBrands, productCompatibility, deviceModels, purchaseOrderLines, itemBrandPricing } from '../../db/schema/index';
import { eq, desc, and, gt } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { successResponse, errorResponse } from '../../lib/response';
import { assertPriceAllowed } from '../../modules/inventory/service';
import { BusinessError } from '../../lib/errors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono();

// PUT /v1/inventory/:id/brands/:brandId (Update Selling Price for a Brand)
// P1 (4C.2) — a brand price is still priced against the ITEM's margin config and
// WAC (brand doesn't change the physical cost), same as the base sellingPrice on
// PATCH /v1/inventory/:id.
const updateBrandPriceSchema = z.object({
  sellingPrice: z.number().min(0),
  allowBelowCost: z.boolean().optional().default(false),
});

router.put('/:id/brands/:brandId', requirePermission('inventory.manage_items'), zValidator('json', updateBrandPriceSchema), auditMiddleware({ action: 'inventory_item.update_brand_price', entityType: 'inventory_item', entityIdParam: 'id', bodyFields: ['sellingPrice', 'allowBelowCost'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const itemId = c.req.param('id');
  const brandId = c.req.param('brandId');
  const data = c.req.valid('json');

  try {
    const item = await db.query.inventoryItems.findFirst({
      where: and(eq(inventoryItems.id, itemId), eq(inventoryItems.tenantId, tenantId)),
    });
    if (!item) return errorResponse(c, 'NOT_FOUND', 'Item not found', [], 404);

    const marginEvaluation = await assertPriceAllowed(
      db,
      tenantId,
      item,
      data.sellingPrice,
      parseFloat(item.unitCostAvg),
      data.allowBelowCost
    );

    await db.transaction(async (tx) => {
      // Check if it exists
      const existing = await tx.select().from(itemBrandPricing).where(
        and(
          eq(itemBrandPricing.inventoryItemId, itemId),
          eq(itemBrandPricing.partBrandId, brandId),
          eq(itemBrandPricing.tenantId, tenantId)
        )
      );

      if (existing.length > 0) {
        await tx.update(itemBrandPricing)
          .set({ sellingPrice: data.sellingPrice.toString(), updatedAt: new Date() })
          .where(eq(itemBrandPricing.id, existing[0].id));
      } else {
        await tx.insert(itemBrandPricing).values({
          tenantId,
          inventoryItemId: itemId,
          partBrandId: brandId,
          sellingPrice: data.sellingPrice.toString()
        });
      }
    });

    const marginWarning = marginEvaluation.status !== 'ok' && marginEvaluation.status !== 'unknown_cost'
      ? marginEvaluation
      : undefined;

    return successResponse(c, { message: 'Brand price updated', marginWarning });
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update brand price', undefined, 500);
  }
});

export { router as pricingRouter };
