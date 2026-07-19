import { Hono } from 'hono';
import { db } from '../../db/connection';
import { inventoryItems, stockLevels, stockBatches, stockMovements, partBrands, deviceBrands, productCompatibility, deviceModels, purchaseOrderLines, itemBrandPricing } from '../../db/schema/index';
import { eq, desc, and, gt } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono();

// PUT /v1/inventory/:id/compatibility (Update resolved/unresolved compatibility)
const updateCompatibilitySchema = z.object({
  resolvedModelIds: z.array(z.string().uuid()),
  unresolvedCompatibility: z.array(z.string())
});

router.put('/:id/compatibility', zValidator('json', updateCompatibilitySchema), async (c) => {
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

export { router as compatibilityRouter };
