import { Hono } from 'hono';
import { db } from '../../db/connection';
import { posInvoices, posInvoiceLines, stockBatches, stockMovements, stockLevels, inventoryItems, posDrafts, invoiceSequences, customers, customerPayments } from '../../db/schema/index';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { successResponse, errorResponse, getRequestId, buildSuccessEnvelope } from '../../lib/response';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { cursorCondition, decodeCursor, parseLimit, buildPage, orderByCursor } from '../../lib/pagination';
import { BusinessError } from '../../lib/errors';
import { roundMoney, toMoneyString } from '../../lib/money';
import { evaluateTempoEligibility } from '../../lib/tempo';
import { findIdempotentResponse, recordIdempotentResponse, isIdempotencyKeyConflict, replayIdempotentResponse } from '../../lib/idempotency';
import { posCheckoutSchema } from './types';
import { consumeStock } from '../../modules/inventory/service';
import { allocateInvoiceNumber } from '../../lib/invoice-number';
import { emitEvent, AppEvent } from '../../services/event-bus';
import type { SaleLineForLedger } from '../../modules/finance/ledger';
import { recordCustomerPaymentInput } from '../../modules/finance/types';
import { recordCustomerPayment } from '../../modules/finance/service';

const router = new Hono();

// GET /v1/pos/invoices - Get sales history
router.get('/invoices', async (c) => {
  const { tenantId } = getAuthContext(c);

  const branchId = c.req.query('branchId');

  const filters = [eq(posInvoices.tenantId, tenantId)];
  if (branchId) {
    filters.push(eq(posInvoices.branchId, branchId));
  }

  // H13 — cursor pagination. Previously a hardcoded limit: 100 with no way
  // to see or fetch anything past it.
  const limit = parseLimit(c.req.query('limit'));
  const cursorParam = c.req.query('cursor');
  if (cursorParam) {
    const cursor = decodeCursor(cursorParam);
    if (!cursor) return errorResponse(c, 'INVALID_CURSOR', 'Malformed cursor', undefined, 400);
    filters.push(cursorCondition(posInvoices.createdAt, posInvoices.id, cursor));
  }

  const rows = await db.query.posInvoices.findMany({
    where: and(...filters),
    orderBy: orderByCursor(posInvoices.createdAt, posInvoices.id),
    with: {
      creator: {
        columns: { name: true }
      }
    },
    limit: limit + 1,
  });

  const { page, hasMore, nextCursor } = buildPage(rows, limit);

  return successResponse(c, page, { has_more: hasMore, next_cursor: nextCursor });
});

// GET /v1/pos/invoices/:id - Get specific invoice
router.get('/invoices/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');

  const invoice = await db.query.posInvoices.findFirst({
    where: and(eq(posInvoices.tenantId, tenantId), eq(posInvoices.id, id)),
    with: {
      creator: { columns: { name: true } },
      lines: {
        with: {
          inventoryItem: { columns: { name: true, sku: true } }
        }
      },
      // H14 — payment history, newest first, mirroring getPayableDetail.
      payments: { orderBy: [desc(customerPayments.paidAt)] },
    }
  });

  if (!invoice) {
    return errorResponse(c, 'NOT_FOUND', 'Invoice not found', undefined, 404);
  }

  return successResponse(c, invoice);
});

// POST /v1/pos/invoices - Checkout
const CHECKOUT_ENDPOINT = 'POST /v1/pos/invoices';

router.post('/invoices', requirePermission('pos.process_payment'), zValidator('json', posCheckoutSchema), auditMiddleware({ action: 'pos_invoice.create', entityType: 'pos_invoice', bodyFields: ['branchId', 'paymentMethod', 'discountAmount', 'customerId'] }), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const data = c.req.valid('json');

  // H13 — idempotency. A retried checkout (dropped LAN connection, double
  // tap) must produce exactly one invoice, not two. Checked before any
  // business logic runs — an exact repeat skips straight to replaying the
  // stored response.
  const idempotencyKey = c.req.header('Idempotency-Key');
  if (idempotencyKey) {
    const replay = await findIdempotentResponse(tenantId, CHECKOUT_ENDPOINT, idempotencyKey);
    if (replay) return replayIdempotentResponse(c, replay);
  }

  // Business rule (tempo requires a real customer link) is enforced by
  // posCheckoutSchema's .refine() and, as a second guard, the
  // `tempo_requires_customer` CHECK constraint in Postgres.

  // Resolve the customer snapshot: customerId is the link, customerName is
  // what the invoice says at the time — it must survive a rename/delete later.
  let resolvedCustomerName = data.customerName || 'Pelanggan Umum';
  let customerAllowTempo = false;
  if (data.customerId) {
    const [customer] = await db
      .select({ name: customers.name, allowTempo: customers.allowTempo })
      .from(customers)
      .where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)));
    if (!customer) {
      return errorResponse(c, 'CUSTOMER_NOT_FOUND', 'Customer not found', undefined, 404);
    }
    resolvedCustomerName = customer.name;
    customerAllowTempo = customer.allowTempo;
  }

  // D1 — only a customer explicitly allowed by owner/manager can buy on tempo.
  // 422 (business-rule violation), not 400: the request is well-formed, the
  // customer just isn't eligible for credit.
  const tempoCheck = evaluateTempoEligibility({ paymentMethod: data.paymentMethod, customerAllowTempo });
  if (!tempoCheck.allowed) {
    return errorResponse(c, tempoCheck.code!, tempoCheck.message!, undefined, 422);
  }

  // Hitung total
  let subtotal = 0;
  for (const item of data.items) {
    subtotal = roundMoney(subtotal + item.unitPrice * item.quantity);
  }

  const grandTotal = roundMoney(subtotal - data.discountAmount);
  const paymentStatus = data.paymentMethod === 'tempo' ? 'unpaid' : 'paid';

  // Populated inside the transaction below, read after it commits — the
  // ledger event (H11) must fire post-commit, never from inside the
  // transaction, so a ledger failure can't roll back a completed sale.
  const linesForLedger: SaleLineForLedger[] = [];

  try {
    // Jalankan seluruh proses checkout dalam satu database transaction
    const result = await db.transaction(async (tx) => {

      // 1. Allocate the next sequence number for this tenant and day. Shared
      // with the service-invoice-from-ticket path (H17) via allocateInvoiceNumber,
      // so there is one numbering implementation, not two that drift. Atomic
      // (INSERT ... ON CONFLICT ... RETURNING), so concurrent checkouts never
      // collide without extra locking.
      const invoiceNumber = await allocateInvoiceNumber(tx, tenantId);

      // 2. Buat Invoice Header
      const [newInvoice] = await tx.insert(posInvoices).values({
        tenantId,
        branchId: data.branchId,
        invoiceNumber,
        customerName: resolvedCustomerName,
        customerId: data.customerId,
        serviceTicketId: data.serviceTicketId,
        subtotal: toMoneyString(subtotal),
        discountAmount: toMoneyString(data.discountAmount),
        taxAmount: '0',
        grandTotal: toMoneyString(grandTotal),
        paymentStatus,
        // H14 — paid immediately (cash/transfer/qris/split) means the full
        // amount is collected at checkout; tempo starts at zero and is
        // advanced later via POST /invoices/:id/payments.
        amountPaid: paymentStatus === 'paid' ? toMoneyString(grandTotal) : '0',
        paymentMethod: data.paymentMethod,
        createdBy: userId,
      }).returning();

      // 3. Look up descriptions for part lines up front. Server-derived, never
      // client-supplied — a part's description is what the item was actually
      // called at sale time, not whatever text a request happens to send.
      const partItemIds = data.items
        .filter((item) => item.sourceType === 'part')
        .map((item) => item.inventoryItemId);

      const itemNameById = new Map<string, string>();
      if (partItemIds.length > 0) {
        const rows = await tx.select({ id: inventoryItems.id, name: inventoryItems.name })
          .from(inventoryItems)
          .where(and(eq(inventoryItems.tenantId, tenantId), inArray(inventoryItems.id, partItemIds)));
        for (const row of rows) itemNameById.set(row.id, row.name);
      }

      // 4. Proses tiap item di keranjang. Only 'part' lines touch stock —
      // 'labor'/'fee' lines are pure billing, no inventory behind them.
      for (const item of data.items) {
        const lineSubtotal = roundMoney(item.unitPrice * item.quantity);

        if (item.sourceType !== 'part') {
          // Labor / fee: bill it, skip FIFO entirely.
          await tx.insert(posInvoiceLines).values({
            tenantId,
            posInvoiceId: newInvoice.id,
            sourceType: item.sourceType,
            description: item.description,
            inventoryItemId: null,
            partBrandId: null,
            quantity: item.quantity,
            unitPrice: toMoneyString(item.unitPrice),
            subtotal: toMoneyString(lineSubtotal),
            unitCost: null,
          });
          linesForLedger.push({ sourceType: item.sourceType, quantity: item.quantity, unitCost: null });
          continue;
        }

        // FIFO Stock Deduction — shared with ticket part consumption (H9) via
        // consumeStock(), so there is one FIFO deduction path and one set of tests.
        const consumed = await consumeStock(tx, {
          tenantId,
          branchId: data.branchId,
          inventoryItemId: item.inventoryItemId,
          partBrandId: item.partBrandId || null,
          quantity: item.quantity,
          referenceType: 'pos_sale',
          referenceId: newInvoice.id,
        });

        // Buat Invoice Line — unitCost captured now, at sale time, a historical
        // fact about which batches this specific sale drew from (H6).
        await tx.insert(posInvoiceLines).values({
          tenantId,
          posInvoiceId: newInvoice.id,
          sourceType: 'part',
          description: itemNameById.get(item.inventoryItemId) ?? 'Item tidak ditemukan',
          inventoryItemId: item.inventoryItemId,
          partBrandId: item.partBrandId || null,
          quantity: item.quantity,
          unitPrice: toMoneyString(item.unitPrice),
          subtotal: toMoneyString(lineSubtotal),
          unitCost: toMoneyString(Number(consumed.unitCost)),
        });
        linesForLedger.push({ sourceType: 'part', quantity: item.quantity, unitCost: consumed.unitCost });
      }

      // H13 — record the response as the LAST write, inside this same
      // transaction: if anything above throws, this insert rolls back too,
      // so a failed checkout never burns the client's idempotency key.
      const responseEnvelope = buildSuccessEnvelope(newInvoice, undefined, getRequestId(c));
      await recordIdempotentResponse(
        tx,
        tenantId,
        idempotencyKey ? { key: idempotencyKey, endpoint: CHECKOUT_ENDPOINT } : undefined,
        201,
        responseEnvelope
      );

      return { newInvoice, responseEnvelope };
    });

    // H11 — post-commit, best-effort. Ledger posting failures are caught and
    // logged inside the handler itself; they must never surface as a 500 on
    // an otherwise-successful checkout.
    emitEvent(AppEvent.POS_SALE_COMPLETED, {
      invoice: { id: result.newInvoice.id, tenantId, branchId: data.branchId, grandTotal },
      lines: linesForLedger,
    });

    return c.json(result.responseEnvelope, 201);
  } catch (error) {
    // H13 — two concurrent requests racing on the same idempotency key: the
    // loser's insert above hits the (tenant_id, key) unique constraint,
    // which aborts its whole transaction (rolling back its business writes
    // too) and lands here. Replay the winner's now-committed response
    // instead of surfacing a 500.
    if (idempotencyKey && isIdempotencyKeyConflict(error)) {
      const replay = await findIdempotentResponse(tenantId, CHECKOUT_ENDPOINT, idempotencyKey);
      if (replay) return replayIdempotentResponse(c, replay);
    }
    if (error instanceof BusinessError) {
      return errorResponse(c, error.code, error.message, error.details, error.statusCode);
    }
    console.error('POS checkout failed:', error);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan saat memproses POS', undefined, 500);
  }
});

// POST /v1/pos/invoices/:id/payments — record a full or partial payment
// against a tempo (unpaid/partial) invoice. H14: named explicitly in
// coding-guidelines §3.4 as a critical mutation requiring Idempotency-Key
// (as the modern equivalent of the doc's `pos-transactions/:id/payments`).
const RECORD_CUSTOMER_PAYMENT_ENDPOINT = 'POST /v1/pos/invoices/:id/payments';

router.post('/invoices/:id/payments', requirePermission('pos.process_payment'), zValidator('json', recordCustomerPaymentInput), auditMiddleware({ action: 'pos_invoice.record_payment', entityType: 'pos_invoice', entityIdParam: 'id', bodyFields: ['amount', 'method', 'referenceNumber'] }), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const id = c.req.param('id');
  const input = c.req.valid('json');

  const idempotencyKey = c.req.header('Idempotency-Key');
  if (idempotencyKey) {
    const replay = await findIdempotentResponse(tenantId, RECORD_CUSTOMER_PAYMENT_ENDPOINT, idempotencyKey);
    if (replay) return replayIdempotentResponse(c, replay);
  }

  try {
    const result = await recordCustomerPayment(
      tenantId,
      id,
      input,
      userId,
      idempotencyKey ? { key: idempotencyKey, endpoint: RECORD_CUSTOMER_PAYMENT_ENDPOINT } : undefined,
      getRequestId(c)
    );
    return successResponse(c, result, undefined, 201);
  } catch (err) {
    if (idempotencyKey && isIdempotencyKeyConflict(err)) {
      const replay = await findIdempotentResponse(tenantId, RECORD_CUSTOMER_PAYMENT_ENDPOINT, idempotencyKey);
      if (replay) return replayIdempotentResponse(c, replay);
    }
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to record customer payment:', err);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Gagal mencatat pembayaran', undefined, 500);
  }
});

// DELETE /v1/pos/invoices/:id (Void)
router.delete('/invoices/:id', requirePermission('pos.void_transaction'), auditMiddleware({ action: 'pos_invoice.void', entityType: 'pos_invoice', entityIdParam: 'id' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');

  try {
    await db.transaction(async (tx) => {
      // 1. Fetch invoice and verify it is not already voided. Locked FOR UPDATE
      // so two simultaneous void requests for the same invoice can't both pass
      // this check before either has written 'voided' back.
      const [invoice] = await tx.select().from(posInvoices)
        .where(and(eq(posInvoices.id, id), eq(posInvoices.tenantId, tenantId)))
        .for('update');

      if (!invoice) throw new BusinessError('NOT_FOUND', 'Invoice not found', 404);
      if (invoice.status === 'voided') {
        throw new BusinessError('ALREADY_VOIDED', 'Invoice is already voided', 409);
      }

      // Second, independent guard: a 'void_pos' movement already existing for
      // this invoice means it was voided before, even if status somehow
      // disagrees — the movement ledger is append-only and the source of truth.
      const existingVoidMovements = await tx.select({ id: stockMovements.id })
        .from(stockMovements)
        .where(and(
          eq(stockMovements.referenceType, 'void_pos'),
          eq(stockMovements.referenceId, id)
        ));

      if (existingVoidMovements.length > 0) {
        throw new BusinessError('ALREADY_VOIDED', 'Invoice is already voided', 409);
      }

      // H14 — block voiding an invoice that has any recorded instalment.
      // Refunding money already collected is SBL-005 (out of scope here);
      // blocking is the safe default so a void can never silently strand a
      // customer's payment with no corresponding cash movement. A cash sale
      // that was simply paid in full at checkout never has a customer_payments
      // row (paymentStatus was set to 'paid' directly at insert), so ordinary
      // POS voids are unaffected — this only blocks a tempo sale that has
      // since collected at least one instalment via POST .../payments.
      const existingPayments = await tx.select({ id: customerPayments.id })
        .from(customerPayments)
        .where(eq(customerPayments.posInvoiceId, id));

      if (existingPayments.length > 0) {
        throw new BusinessError(
          'VOID_BLOCKED_HAS_PAYMENTS',
          'Cannot void an invoice that has recorded payments; refund is out of scope for void',
          409
        );
      }

      // 2. Reverse Stock Movements
      const movements = await tx.query.stockMovements.findMany({
        where: and(
          eq(stockMovements.tenantId, tenantId),
          eq(stockMovements.referenceType, 'pos_sale'),
          eq(stockMovements.referenceId, id)
        )
      });

      // Group movements by item to update master levels safely
      const itemRestores: Record<string, number> = {};

      for (const mov of movements) {
        // Return stock to batch. Locked FOR UPDATE — the same batch could be
        // concurrently consumed by another sale between this read and write.
        const [batch] = await tx.select().from(stockBatches)
          .where(eq(stockBatches.id, mov.stockBatchId!))
          .for('update');

        if (batch) {
          const restoredQuantity = batch.quantityRemaining + Math.abs(mov.quantity);

          // A batch can never hold more than it originally received. Exceeding
          // that means something else already changed this batch in a way that
          // makes this void inconsistent — fail loudly rather than invent stock.
          if (restoredQuantity > batch.quantityReceived) {
            throw new BusinessError(
              'VOID_CONFLICT',
              `Cannot void: batch ${batch.id} would exceed its received quantity`,
              409
            );
          }

          await tx.update(stockBatches)
            .set({ quantityRemaining: restoredQuantity })
            .where(eq(stockBatches.id, batch.id));
        }

        // Aggregate for master stock level update
        itemRestores[mov.inventoryItemId] = (itemRestores[mov.inventoryItemId] || 0) + Math.abs(mov.quantity);

        // Record a void movement
        await tx.insert(stockMovements).values({
          tenantId,
          branchId: mov.branchId,
          inventoryItemId: mov.inventoryItemId,
          stockBatchId: mov.stockBatchId,
          movementType: 'in', // returning stock
          quantity: Math.abs(mov.quantity),
          referenceType: 'void_pos',
          referenceId: id
        });
      }

      // 3. Update Master Stock Levels — locked FOR UPDATE for the same lost-update
      // reason as everywhere else in this file.
      for (const itemId of Object.keys(itemRestores)) {
        const qtyToRestore = itemRestores[itemId];
        const [stockLevel] = await tx.select().from(stockLevels)
          .where(and(
            eq(stockLevels.tenantId, tenantId),
            eq(stockLevels.inventoryItemId, itemId),
            eq(stockLevels.branchId, invoice.branchId)
          ))
          .for('update');

        if (stockLevel) {
          await tx.update(stockLevels)
            .set({ quantityAvailable: stockLevel.quantityAvailable + qtyToRestore })
            .where(eq(stockLevels.id, stockLevel.id));
        }
      }

      // 4. Update Invoice Status to voided — document lifecycle only; paymentStatus
      // (was this invoice paid before it was voided?) is left untouched.
      await tx.update(posInvoices)
        .set({ status: 'voided' })
        .where(eq(posInvoices.id, invoice.id));
    });

    // H11 — post-commit. Lines are immutable once written, so re-reading them
    // here (rather than threading them out of the transaction) is safe and
    // keeps the transaction body unchanged.
    const [voidedInvoice] = await db.select().from(posInvoices)
      .where(and(eq(posInvoices.id, id), eq(posInvoices.tenantId, tenantId)));
    const voidedLines = await db.select({
      sourceType: posInvoiceLines.sourceType,
      quantity: posInvoiceLines.quantity,
      unitCost: posInvoiceLines.unitCost,
    }).from(posInvoiceLines).where(eq(posInvoiceLines.posInvoiceId, id));

    if (voidedInvoice) {
      emitEvent(AppEvent.POS_SALE_VOIDED, {
        invoice: { id: voidedInvoice.id, tenantId, branchId: voidedInvoice.branchId, grandTotal: voidedInvoice.grandTotal },
        lines: voidedLines,
      });
    }

    return successResponse(c, { voided: true });
  } catch (error) {
    if (error instanceof BusinessError) {
      return errorResponse(c, error.code, error.message, error.details, error.statusCode);
    }
    console.error('Failed to void invoice:', error);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Gagal melakukan void transaksi', undefined, 500);
  }
});

export { router as invoicesRouter };
