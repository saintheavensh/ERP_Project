import { Hono } from 'hono';
import { db } from '../../db/connection';
import { purchaseOrders, purchaseOrderLines, inventoryItems, itemBrandPricing, supplierInvoices, suppliers } from '../../db/schema/index';
import { poStatusEnum, type PoStatus } from '../../db/schema/enums';

function isPoStatus(value: string): value is PoStatus {
  return (poStatusEnum.enumValues as readonly string[]).includes(value);
}
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { BusinessError } from '../../lib/errors';
import { canDeletePurchaseOrder } from './order-status';

const router = new Hono();

// GET /v1/purchasing/orders
router.get('/orders', async (c) => {
  const { tenantId } = getAuthContext(c);
  const status = c.req.query('status');
  
  try {
    const filters = [eq(purchaseOrders.tenantId, tenantId)];
    if (status && isPoStatus(status)) {
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
          where: eq(purchaseOrderLines.tenantId, tenantId),
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

router.post('/orders', requirePermission('purchasing.manage_orders'), zValidator('json', createOrderSchema), auditMiddleware({ action: 'purchase_order.create', entityType: 'purchase_order', bodyFields: ['branchId', 'supplierId', 'lines'] }), async (c) => {
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
        tenantId,
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

router.put('/orders/:id/status', requirePermission('purchasing.manage_orders'), zValidator('json', updateStatusSchema), auditMiddleware({ action: 'purchase_order.update_status', entityType: 'purchase_order', entityIdParam: 'id', bodyFields: ['status'] }), async (c) => {
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
// F5 — only a 'draft' PO (nothing received against it, so no batches/movements
// exist to unwind — see canDeletePurchaseOrder) can be deleted. Anything past
// draft must go through the purchase-returns flow (future work), not a delete.
router.delete('/orders/:id', requirePermission('purchasing.manage_orders'), auditMiddleware({ action: 'purchase_order.delete', entityType: 'purchase_order', entityIdParam: 'id' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');

  try {
    await db.transaction(async (tx) => {
      const order = await tx.query.purchaseOrders.findFirst({
        where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId))
      });
      if (!order) throw new BusinessError('NOT_FOUND', 'Order not found', 404);

      if (!canDeletePurchaseOrder(order.status)) {
        throw new BusinessError(
          'PO_NOT_DELETABLE',
          `Cannot delete a purchase order with status '${order.status}' — only a draft PO can be deleted. ` +
          (order.status === 'ordered'
            ? 'This one has already been sent to the supplier; cancel it with the supplier instead.'
            : 'Goods have already been received against it — use the purchase-returns flow instead.'),
          409
        );
      }

      // A draft PO has never been received, so it has no stock_batches or
      // stock_movements to unwind — just delete the lines and the order.
      await tx.delete(purchaseOrderLines).where(and(eq(purchaseOrderLines.purchaseOrderId, orderId), eq(purchaseOrderLines.tenantId, tenantId)));
      await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, orderId));
    });

    return successResponse(c, null);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to delete order:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete order', undefined, 500);
  }
});


export { router as ordersRouter };
