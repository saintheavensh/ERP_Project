import { Hono } from 'hono';
import { db } from '../../db/connection';
import { purchaseOrders, purchaseOrderLines, stockBatches, stockMovements, stockLevels, inventoryItems, itemBrandPricing, supplierInvoices, suppliers } from '../../db/schema/index';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono();

// DELETE /v1/purchasing/orders/:id
router.delete('/orders/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');
  
  try {
    await db.transaction(async (tx) => {
      // 1. Get the order to check status
      const order = await tx.query.purchaseOrders.findFirst({
        where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId))
      });
      
      if (!order) throw new Error('Order not found');
      
      // TODO: In Production, prevent deletion if status is 'received' or 'completed'
      // if (order.status === 'received' || order.status === 'completed') {
      //   throw new Error('Cannot delete a PO that has already been received. Please use purchase returns.');
      // }
      
      // 2. Find lines
      const lines = await tx.query.purchaseOrderLines.findMany({
        where: eq(purchaseOrderLines.purchaseOrderId, orderId)
      });
      
      const lineIds = lines.map(l => l.id);
      
      if (lineIds.length > 0) {
        // Find stock batches related to these lines
        const batches = await tx.query.stockBatches.findMany({
          // Note: we can't easily query whereIn array in drizzle without inArray, so we loop or build query.
          // Let's just fetch all batches for this tenant and filter, or use raw sql.
        });
      }
      
      // Simple dev rollback (ignoring strict consistency for now since it's requested by user for dev)
      if (lineIds.length > 0) {
        // Rollback stock levels manually by looking up batches
        // This is complex, but required for the "undo" effect.
        for (const line of lines) {
           const relatedBatches = await tx.query.stockBatches.findMany({
             where: eq(stockBatches.purchaseOrderLineId, line.id)
           });
           
           for (const batch of relatedBatches) {
             // delete movements
             await tx.delete(stockMovements).where(eq(stockMovements.stockBatchId, batch.id));
             
             // decrement stock level
             await tx.execute(sql`
               UPDATE stock_levels 
               SET quantity_available = quantity_available - ${batch.quantityReceived}
               WHERE inventory_item_id = ${batch.inventoryItemId} AND branch_id = ${batch.branchId}
             `);
           }
           
           // delete batches
           await tx.delete(stockBatches).where(eq(stockBatches.purchaseOrderLineId, line.id));
        }
      }
      
      // Delete lines
      await tx.delete(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, orderId));
      
      // Delete order
      await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, orderId));
    });
    
    return successResponse(c, null);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete order', [err.message]);
  }
});


export { router as ordersRouter };
