import { db } from '../../db/connection';
import { supplierInvoices, supplierPayments } from '../../db/schema';
import type { PaymentStatus } from '../../db/schema/enums';
import { eq, and, desc } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import { emitEvent, AppEvent } from '../../services/event-bus';
import { buildSuccessEnvelope } from '../../lib/response';
import { recordIdempotentResponse, type IdempotencyRef } from '../../lib/idempotency';
import type { RecordPaymentInput } from './types';

export type PaymentDecision =
  | { ok: true; newAmountPaid: number; newStatus: 'partial' | 'paid' }
  | { ok: false; code: string; reason: string };

/**
 * Pure — no database. Decides whether a payment is valid and what the
 * invoice's new state should be. This is what the tests exercise.
 */
export function applyPayment(
  invoice: { totalAmount: number; amountPaid: number; status: PaymentStatus },
  paymentAmount: number
): PaymentDecision {
  if (invoice.status === 'paid') {
    return { ok: false, code: 'ALREADY_PAID', reason: 'This invoice is already fully paid.' };
  }
  if (paymentAmount <= 0) {
    return { ok: false, code: 'INVALID_AMOUNT', reason: 'Payment must be greater than zero.' };
  }

  const newAmountPaid = invoice.amountPaid + paymentAmount;

  // Overpaying a supplier invoice is almost always a data-entry mistake.
  if (newAmountPaid > invoice.totalAmount) {
    return {
      ok: false,
      code: 'OVERPAYMENT',
      reason: `Payment exceeds outstanding balance of ${invoice.totalAmount - invoice.amountPaid}.`,
    };
  }

  return {
    ok: true,
    newAmountPaid,
    newStatus: newAmountPaid >= invoice.totalAmount ? 'paid' : 'partial',
  };
}

/**
 * Fetches the invoice (tenant-scoped, locked FOR UPDATE so two simultaneous
 * payments against the same invoice can't both read the same amountPaid and
 * both "add" onto it), applies the decision, and — if valid — records the
 * payment and updates the invoice in one transaction.
 */
export async function recordPayment(
  tenantId: string,
  invoiceId: string,
  input: RecordPaymentInput,
  userId: string,
  idempotency?: IdempotencyRef,
  requestId?: string
) {
  const result = await db.transaction(async (tx) => {
    const [invoice] = await tx.select().from(supplierInvoices)
      .where(and(eq(supplierInvoices.id, invoiceId), eq(supplierInvoices.tenantId, tenantId)))
      .for('update');

    if (!invoice) {
      throw new BusinessError('NOT_FOUND', 'Supplier invoice not found', 404);
    }

    // Postgres decimal columns come back as strings — parse explicitly, never
    // compare the raw strings ("100" > "99" is false in JS string comparison).
    const decision = applyPayment(
      {
        totalAmount: parseFloat(invoice.totalAmount),
        amountPaid: parseFloat(invoice.amountPaid),
        status: invoice.status,
      },
      input.amount
    );

    if (!decision.ok) {
      const statusCode = decision.code === 'ALREADY_PAID' ? 409 : 422;
      throw new BusinessError(decision.code, decision.reason, statusCode);
    }

    const [payment] = await tx.insert(supplierPayments).values({
      tenantId,
      supplierInvoiceId: invoiceId,
      amount: input.amount.toString(),
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber || null,
      paymentDate: input.paidAt ? new Date(input.paidAt) : new Date(),
      createdBy: userId,
    }).returning();

    const [updatedInvoice] = await tx.update(supplierInvoices)
      .set({
        amountPaid: decision.newAmountPaid.toString(),
        status: decision.newStatus,
      })
      .where(eq(supplierInvoices.id, invoiceId))
      .returning();

    const responseBody = { payment, invoice: updatedInvoice };

    // H13 — recorded as the last write inside this same transaction, so a
    // rollback anywhere above (including the OVERPAYMENT/ALREADY_PAID throws
    // earlier in this function) discards the key too.
    await recordIdempotentResponse(tx, tenantId, idempotency, 201, buildSuccessEnvelope(responseBody, undefined, requestId));

    return responseBody;
  });

  // H11 — post-commit, best-effort. See ledger.ts subscribeLedger for why a
  // posting failure here can never surface back to the caller.
  emitEvent(AppEvent.SUPPLIER_PAYMENT_RECORDED, {
    tenantId,
    branchId: result.invoice.branchId,
    invoiceId: result.invoice.id,
    amount: result.payment.amount,
  });

  return result;
}

/** Invoice detail with its supplier, PO, and full payment history. */
export async function getPayableDetail(tenantId: string, invoiceId: string) {
  const invoice = await db.query.supplierInvoices.findFirst({
    where: and(eq(supplierInvoices.id, invoiceId), eq(supplierInvoices.tenantId, tenantId)),
    with: {
      supplier: true,
      purchaseOrder: true,
      payments: { orderBy: [desc(supplierPayments.paymentDate)] },
    },
  });

  if (!invoice) {
    throw new BusinessError('NOT_FOUND', 'Supplier invoice not found', 404);
  }

  return invoice;
}
