import { Hono } from 'hono';
import { db } from '../../db/connection';
import { purchaseOrders, purchaseOrderLines, stockBatches, stockMovements, stockLevels, inventoryItems, itemBrandPricing, supplierInvoices, suppliers } from '../../db/schema/index';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono();

// GET /v1/purchasing/orders
router.get('/orders', async (c) => {
  const { tenantId } = getAuthContext(c);
  const status = c.req.query('status');
  
  try {
    const filters = [eq(purchaseOrders.tenantId, tenantId)];
    if (status) {
      filters.push(eq(purchaseOrders.status, status));
    }
    
    const orders = await db.query.purchaseOrders.findMany({
      where: and(...filters),
      orderBy: [desc(purchaseOrders.createdAt)],
      with: {
        supplier: true,
        supplierInvoices: true
      }
    });
    return successResponse(c, orders);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch purchase orders', [err.message]);
  }
});

// GET /v1/purchasing/orders/:id
router.get('/orders/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');
  
  try {
    const order = await db.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId)),
      with: {
        supplier: true,
        supplierInvoices: true,
        purchaseOrderLines: {
          with: {
            inventoryItem: {
              with: {
                category: true
              }
            },
            stockBatches: {
              with: {
                partBrand: true
              }
            }
          }
        }
      }
    });
    if (!order) return errorResponse(c, 'NOT_FOUND', 'Order not found', [], 404);
    return successResponse(c, order);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch order', [err.message]);
  }
});

// POST /v1/purchasing/orders
const createOrderSchema = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  expectedDeliveryDate: z.string().optional(),
  lines: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0).optional().default(0) // Estimated, now optional
  })).min(1)
});

router.post('/orders', zValidator('json', createOrderSchema), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const data = c.req.valid('json');
  
  try {
    const result = await db.transaction(async (tx) => {
      // Calculate estimated total
      const estimatedTotal = data.lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
      
      const [order] = await tx.insert(purchaseOrders).values({
        tenantId,
        branchId: data.branchId,
        supplierId: data.supplierId,
        poNumber: `PO-${Date.now().toString().slice(-6)}`, // simple generator
        status: 'draft',
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        estimatedTotal: estimatedTotal.toString(),
        createdBy: userId // User UUID
      }).returning();
      
      const lineValues = data.lines.map(line => ({
        purchaseOrderId: order.id,
        inventoryItemId: line.inventoryItemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toString()
      }));
      
      await tx.insert(purchaseOrderLines).values(lineValues);
      
      return order;
    });
    
    return successResponse(c, result, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create purchase order', [err.message]);
  }
});

// PUT /v1/purchasing/orders/:id/status
const updateStatusSchema = z.object({
  status: z.enum(['draft', 'ordered', 'received', 'completed'])
});

router.put('/orders/:id/status', zValidator('json', updateStatusSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');
  const { status } = c.req.valid('json');
  
  try {
    const [updated] = await db.update(purchaseOrders)
      .set({ status })
      .where(and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId)))
      .returning();
      
    if (!updated) return errorResponse(c, 'NOT_FOUND', 'Order not found', [], 404);
    
    return successResponse(c, updated);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update status', [err.message]);
  }
});

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
