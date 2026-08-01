import { Hono } from 'hono';
import { db } from '../../db/connection';
import { purchaseOrders, purchaseOrderLines, stockBatches, stockMovements, stockLevels, inventoryItems, itemBrandPricing, supplierInvoices, suppliers } from '../../db/schema/index';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { successResponse, errorResponse } from '../../lib/response';
import { zValidator } from '../../lib/validator';
import { z } from 'zod';
import { calculateWac } from '../../lib/wac';
import { emitEvent, AppEvent } from '../../services/event-bus';
import { assertPriceAllowed } from '../../modules/inventory/service';
import { BusinessError } from '../../lib/errors';

const router = new Hono();

// POST /v1/purchasing/orders/:id/invoice (Phase 3 - Costing/Manager)
// P1 (4C.2) — a batch's sellingPrice is judged against the item's margin config
// and its freshly-recalculated WAC (post this batch's actualUnitCost), not the
// stale pre-receipt cost — a goods receipt is exactly when the cost most likely
// just changed. allowBelowCost applies to the whole submission (one deliberate
// clearance decision per invoice, not per line).
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string(),
  invoiceDueDate: z.string().optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'tempo']).default('cash'),
  allowBelowCost: z.boolean().optional().default(false),
  batches: z.array(z.object({
    batchId: z.string().uuid(),
    actualUnitCost: z.number().min(0),
    sellingPrice: z.number().min(0)
  }))
});

router.post('/orders/:id/invoice', requirePermission('purchasing.manage_invoices'), zValidator('json', invoiceSchema), auditMiddleware({ action: 'purchase_order.invoice', entityType: 'purchase_order', entityIdParam: 'id', bodyFields: ['invoiceNumber', 'invoiceDate', 'paymentMethod'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');
  const data = c.req.valid('json');
  
  try {
    const result = await db.transaction(async (tx) => {
      const order = await tx.query.purchaseOrders.findFirst({
        where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId))
      });
      if (!order) throw new Error('Order not found');
      
      let actualTotal = 0;
      const marginWarnings: Array<{ batchId: string } & Awaited<ReturnType<typeof assertPriceAllowed>>> = [];

      for (const batchInput of data.batches) {
        // Fetch current batch
        const [batch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, batchInput.batchId));
        if (!batch) continue;

        actualTotal += (batchInput.actualUnitCost * batch.quantityReceived);

        // Update batch actual unit cost
        await tx.update(stockBatches)
          .set({ unitCost: batchInput.actualUnitCost.toString() })
          .where(eq(stockBatches.id, batch.id));

        // Re-calculate Moving Average Cost (WAC) for the inventory item globally —
        // moved ahead of the price write so P1 (4C.2) judges the price against the
        // freshly-updated cost, not the stale pre-receipt one.
        const activeBatches = await tx.select().from(stockBatches)
          .where(and(
            eq(stockBatches.inventoryItemId, batch.inventoryItemId),
            sql`${stockBatches.quantityRemaining} > 0`
          ));

        const wac = calculateWac(activeBatches);

        await tx.update(inventoryItems)
          .set({ unitCostAvg: wac })
          .where(eq(inventoryItems.id, batch.inventoryItemId));

        // P1 (4C.2) — judge this batch's price against the item's margin config and
        // the WAC just written above. Throws 422 PRICE_BELOW_COST (aborting the
        // whole transaction — no partial invoice) unless allowBelowCost was set.
        const itemRow = await tx.query.inventoryItems.findFirst({
          where: and(eq(inventoryItems.id, batch.inventoryItemId), eq(inventoryItems.tenantId, tenantId)),
        });
        const evaluation = await assertPriceAllowed(
          tx,
          tenantId,
          itemRow ?? {},
          batchInput.sellingPrice,
          parseFloat(wac),
          data.allowBelowCost
        );
        if (evaluation.status !== 'ok' && evaluation.status !== 'unknown_cost') {
          marginWarnings.push({ batchId: batch.id, ...evaluation });
        }

        // Upsert Selling Price
        if (batch.partBrandId) {
          // Check if exists
          const existingPricing = await tx.select().from(itemBrandPricing).where(
            and(
              eq(itemBrandPricing.inventoryItemId, batch.inventoryItemId),
              eq(itemBrandPricing.partBrandId, batch.partBrandId)
            )
          );

          if (existingPricing.length > 0) {
            await tx.update(itemBrandPricing)
              .set({ sellingPrice: batchInput.sellingPrice.toString(), updatedAt: new Date() })
              .where(eq(itemBrandPricing.id, existingPricing[0].id));
          } else {
            await tx.insert(itemBrandPricing).values({
              tenantId,
              inventoryItemId: batch.inventoryItemId,
              partBrandId: batch.partBrandId,
              sellingPrice: batchInput.sellingPrice.toString()
            });
          }
        } else {
          // Base item selling price
          await tx.update(inventoryItems)
            .set({ sellingPrice: batchInput.sellingPrice.toString() })
            .where(eq(inventoryItems.id, batch.inventoryItemId));
        }
      }
      
      // Complete the order
      const [updatedOrder] = await tx.update(purchaseOrders)
        .set({ 
          status: 'completed',
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          invoiceDueDate: data.invoiceDueDate ? new Date(data.invoiceDueDate) : null,
          actualTotal: actualTotal.toString()
        })
        .where(eq(purchaseOrders.id, orderId))
        .returning();
        
      // Create Accounts Payable (Supplier Invoice) record if payment is tempo
      let supplierInvoice;
      if (data.paymentMethod === 'tempo') {
        const [supplier] = await tx.select().from(suppliers).where(eq(suppliers.id, order.supplierId));

        let dueDate = data.invoiceDueDate ? new Date(data.invoiceDueDate) : null;
        if (!dueDate && supplier && supplier.paymentTermDays) {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + supplier.paymentTermDays);
        }

        [supplierInvoice] = await tx.insert(supplierInvoices).values({
          tenantId,
          branchId: order.branchId,
          supplierId: order.supplierId,
          purchaseOrderId: order.id,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          dueDate: dueDate,
          totalAmount: actualTotal.toString(),
          amountPaid: '0',
          status: 'unpaid',
          paymentMethod: data.paymentMethod
        }).returning();
      } else {
        // If cash/transfer, create invoice but mark as paid
        [supplierInvoice] = await tx.insert(supplierInvoices).values({
          tenantId,
          branchId: order.branchId,
          supplierId: order.supplierId,
          purchaseOrderId: order.id,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          dueDate: data.invoiceDueDate ? new Date(data.invoiceDueDate) : null,
          totalAmount: actualTotal.toString(),
          amountPaid: actualTotal.toString(),
          status: 'paid',
          paymentMethod: data.paymentMethod
        }).returning();
      }

      return { updatedOrder, supplierInvoice, marginWarnings };
    });

    // H11 — post-commit, best-effort. A cash/transfer invoice is created
    // already 'paid' — it still increases-then-immediately-settles AP in the
    // ledger, which is correct: the shop DID owe the supplier for a moment.
    emitEvent(AppEvent.SUPPLIER_INVOICE_CREATED, {
      tenantId,
      branchId: result.supplierInvoice.branchId,
      invoiceId: result.supplierInvoice.id,
      totalAmount: result.supplierInvoice.totalAmount,
    });
    if (result.supplierInvoice.status === 'paid') {
      emitEvent(AppEvent.SUPPLIER_PAYMENT_RECORDED, {
        tenantId,
        branchId: result.supplierInvoice.branchId,
        invoiceId: result.supplierInvoice.id,
        amount: result.supplierInvoice.totalAmount,
      });
    }

    return successResponse(c, { ...result.updatedOrder, marginWarnings: result.marginWarnings });
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to process invoice', undefined, 500);
  }
});

export { router as invoicesRouter };
