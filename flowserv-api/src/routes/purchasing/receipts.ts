import { Hono } from 'hono';
import { db } from '../../db/connection';
import { purchaseOrders, purchaseOrderLines, stockBatches, stockMovements, stockLevels, inventoryItems, itemBrandPricing, supplierInvoices, suppliers } from '../../db/schema/index';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { computeOrderStatus, type PurchaseOrderStatus } from './order-status';
import { BusinessError } from '../../lib/errors';

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
      
      if (!order) throw new BusinessError('NOT_FOUND', 'Order not found', 404);
      // 'partial' must stay receivable — that is the entire point of this fix.
      // Only a fully received or already-costed order is closed to further receipts.
      if (order.status === 'received' || order.status === 'completed') {
        throw new BusinessError('ORDER_ALREADY_RECEIVED', 'Order is already received', 409);
      }

      for (const lineInput of lines) {
        // Calculate total received for this line
        let lineTotalReceived = 0;
        if (lineInput.splits && lineInput.splits.length > 0) {
          lineTotalReceived = lineInput.splits.reduce((sum, s) => sum + s.receivedQuantity, 0);
        } else if (lineInput.receivedQuantity !== undefined) {
          lineTotalReceived = lineInput.receivedQuantity;
        }

        if (lineTotalReceived === 0) {
          continue;
        }

        // Fetch the line scoped to THIS order — a lineId alone is not enough,
        // it could belong to a different order (or a different tenant's order).
        // Locked FOR UPDATE: two concurrent receipts against the same line must
        // not both read the same receivedQuantity and both "add" onto it, losing
        // one of the two deliveries.
        const [existingLine] = await tx.select()
          .from(purchaseOrderLines)
          .where(and(
            eq(purchaseOrderLines.id, lineInput.lineId),
            eq(purchaseOrderLines.purchaseOrderId, orderId)
          ))
          .for('update');

        if (!existingLine) {
          throw new BusinessError(
            'LINE_NOT_FOUND',
            `Line ${lineInput.lineId} does not belong to order ${orderId}`,
            404
          );
        }

        // Accumulate onto whatever has already been received in a prior delivery,
        // never overwrite it — otherwise a second partial receipt erases the first.
        const newReceivedTotal = existingLine.receivedQuantity + lineTotalReceived;

        if (newReceivedTotal > existingLine.quantity) {
          throw new BusinessError(
            'OVER_RECEIPT',
            `Cannot receive ${newReceivedTotal} of ${existingLine.quantity} ordered for line ${existingLine.id}`,
            422
          );
        }

        const [line] = await tx.update(purchaseOrderLines)
          .set({ receivedQuantity: newReceivedTotal })
          .where(eq(purchaseOrderLines.id, existingLine.id))
          .returning();

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
        
        // Upsert Stock Level (aggregating total). Locked FOR UPDATE for the same
        // reason as the line above — concurrent receipts must not lose an update.
        const existingLevels = await tx.select().from(stockLevels).where(
          and(
            eq(stockLevels.inventoryItemId, line.inventoryItemId),
            eq(stockLevels.branchId, order.branchId)
          )
        ).for('update');
        
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
      
      // Re-read all lines so the status reflects the true accumulated total,
      // not just what arrived in this delivery.
      const allLines = await tx.select()
        .from(purchaseOrderLines)
        .where(eq(purchaseOrderLines.purchaseOrderId, orderId));

      const newStatus = computeOrderStatus(allLines, order.status as PurchaseOrderStatus);

      const [updatedOrder] = await tx.update(purchaseOrders)
        .set({ status: newStatus })
        .where(eq(purchaseOrders.id, orderId))
        .returning();

      return updatedOrder;
    });
    
    return successResponse(c, result);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to receive purchase order:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to receive purchase order', undefined, 500);
  }
});

export { router as receiptsRouter };
