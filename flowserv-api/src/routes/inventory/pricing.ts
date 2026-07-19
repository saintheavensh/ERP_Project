import { Hono } from 'hono';
import { db } from '../../db/connection';
import { inventoryItems, stockLevels, stockBatches, stockMovements, partBrands, deviceBrands, productCompatibility, deviceModels, purchaseOrderLines, itemBrandPricing } from '../../db/schema/index';
import { eq, desc, and, gt } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono();

// PUT /v1/inventory/:id/brands/:brandId (Update Selling Price for a Brand)
const updateBrandPriceSchema = z.object({
  sellingPrice: z.number().min(0)
});

router.put('/:id/brands/:brandId', zValidator('json', updateBrandPriceSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const itemId = c.req.param('id');
  const brandId = c.req.param('brandId');
  const data = c.req.valid('json');

  try {
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

    return successResponse(c, { message: 'Brand price updated' });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update brand price', [err.message]);
  }
});

export { router as pricingRouter };
