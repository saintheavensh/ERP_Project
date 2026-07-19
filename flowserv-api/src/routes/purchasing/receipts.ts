import { Hono } from 'hono';
import { db } from '../../db/connection';
import { purchaseOrders, purchaseOrderLines, stockBatches, stockMovements, stockLevels, inventoryItems, itemBrandPricing, supplierInvoices, suppliers } from '../../db/schema/index';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono();

// POST /v1/purchasing/orders/:id/receive (Phase 2 - Warehouse)
const receiveSchema = z.object({
  lines: z.array(z.object({
    lineId: z.string().uuid(),
    splits: z.array(z.object({
      partBrandId: z.string().uuid().nullable().optional(),
      receivedQuantity: z.number().min(1)
    })).optional(),
    receivedQuantity: z.number().min(0).optional() // fallback if no splits
  }))
});

router.post('/orders/:id/receive', zValidator('json', receiveSchema), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const orderId = c.req.param('id');
  const { lines } = c.req.valid('json');
  
  try {
    const result = await db.transaction(async (tx) => {
      const order = await tx.query.purchaseOrders.findFirst({
        where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId))
      });
      
      if (!order) throw new Error('Order not found');
      if (order.status === 'received' || order.status === 'completed') throw new Error('Order is already received');
      
      let allReceived = true;
      
      for (const lineInput of lines) {
        // Calculate total received for this line
        let lineTotalReceived = 0;
        if (lineInput.splits && lineInput.splits.length > 0) {
          lineTotalReceived = lineInput.splits.reduce((sum, s) => sum + s.receivedQuantity, 0);
        } else if (lineInput.receivedQuantity !== undefined) {
          lineTotalReceived = lineInput.receivedQuantity;
        }

        if (lineTotalReceived === 0) {
          allReceived = false;
          continue; 
        }
        
        // Update line received qty
        const [line] = await tx.update(purchaseOrderLines)
          .set({ receivedQuantity: lineTotalReceived })
          .where(eq(purchaseOrderLines.id, lineInput.lineId))
          .returning();
          
        if (line.receivedQuantity < line.quantity) allReceived = false;
        
        // If splits are provided, insert multiple batches
        if (lineInput.splits && lineInput.splits.length > 0) {
          for (const split of lineInput.splits) {
            const [batch] = await tx.insert(stockBatches).values({
              tenantId,
              branchId: order.branchId,
              inventoryItemId: line.inventoryItemId,
              supplierId: order.supplierId,
              partBrandId: split.partBrandId || null,
              purchaseOrderLineId: line.id,
              unitCost: line.unitPrice.toString(), 
              quantityReceived: split.receivedQuantity,
              quantityRemaining: split.receivedQuantity
            }).returning();
            
            await tx.insert(stockMovements).values({
              tenantId,
              branchId: order.branchId,
              inventoryItemId: line.inventoryItemId,
              stockBatchId: batch.id,
              movementType: 'in',
              quantity: split.receivedQuantity,
              referenceType: 'purchase_order',
              referenceId: order.id
            });
          }
        } else {
           // Fallback: no brand specific splitting, just insert one batch
           const [batch] = await tx.insert(stockBatches).values({
              tenantId,
              branchId: order.branchId,
              inventoryItemId: line.inventoryItemId,
              supplierId: order.supplierId,
              purchaseOrderLineId: line.id,
              unitCost: line.unitPrice.toString(), 
              quantityReceived: lineTotalReceived,
              quantityRemaining: lineTotalReceived
            }).returning();
            
            await tx.insert(stockMovements).values({
              tenantId,
              branchId: order.branchId,
              inventoryItemId: line.inventoryItemId,
              stockBatchId: batch.id,
              movementType: 'in',
              quantity: lineTotalReceived,
              referenceType: 'purchase_order',
              referenceId: order.id
            });
        }
        
        // Upsert Stock Level (aggregating total)
        const existingLevels = await tx.select().from(stockLevels).where(
          and(
            eq(stockLevels.inventoryItemId, line.inventoryItemId),
            eq(stockLevels.branchId, order.branchId)
          )
        );
        
        if (existingLevels.length > 0) {
          await tx.update(stockLevels)
            .set({ quantityAvailable: existingLevels[0].quantityAvailable + lineTotalReceived })
            .where(eq(stockLevels.id, existingLevels[0].id));
        } else {
          await tx.insert(stockLevels).values({
            inventoryItemId: line.inventoryItemId,
            branchId: order.branchId,
            quantityAvailable: lineTotalReceived,
            quantityReserved: 0
          });
        }
      }
      
      // Update PO Status
      const [updatedOrder] = await tx.update(purchaseOrders)
        .set({ status: 'received' })
        .where(eq(purchaseOrders.id, orderId))
        .returning();
        
      return updatedOrder;
    });
    
    return successResponse(c, result);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to receive purchase order', [err.message]);
  }
});

export { router as receiptsRouter };
