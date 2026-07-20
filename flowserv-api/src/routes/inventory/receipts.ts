import { Hono } from 'hono';
import { db } from '../../db/connection';
import { inventoryItems, stockLevels, stockBatches, stockMovements, partBrands, deviceBrands, productCompatibility, deviceModels, purchaseOrderLines, itemBrandPricing } from '../../db/schema/index';
import { eq, desc, and, gt } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { calculateWac } from '../../lib/wac';

const router = new Hono();

// POST /v1/inventory/:id/receive (Goods Receipt)
const receiveStockSchema = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative')
});

router.post('/:id/receive', zValidator('json', receiveStockSchema), async (c) => {
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
      
      // 3. Upsert Stock Level (Current Total). Locked FOR UPDATE so two
      // concurrent manual receipts for the same item/branch don't lose one
      // of the two increments — same pattern as the PO receive path.
      const existingLevels = await tx.select().from(stockLevels).where(
        and(
          eq(stockLevels.inventoryItemId, inventoryItemId),
          eq(stockLevels.branchId, data.branchId)
        )
      ).for('update');

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

      // 4. Recalculate WAC — this manual path previously skipped this step
      // entirely, so an item costed differently depending on whether it
      // arrived via a PO or was entered here directly (RECOVERY-PLAN BUG-09).
      const activeBatches = await tx.select().from(stockBatches)
        .where(and(
          eq(stockBatches.inventoryItemId, inventoryItemId),
          eq(stockBatches.tenantId, tenantId)
        ));

      const wac = calculateWac(activeBatches);

      await tx.update(inventoryItems)
        .set({ unitCostAvg: wac })
        .where(eq(inventoryItems.id, inventoryItemId));

      return batch;
    });
    
    return successResponse(c, result, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to receive stock', [err.message]);
  }
});

export { router as receiptsRouter };
