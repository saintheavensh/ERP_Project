import { z } from 'zod';

export const recordPaymentInput = z.object({
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(['cash', 'transfer']),
  // Maps to supplier_payments.reference_number — e.g. a bank transfer reference.
  referenceNumber: z.string().optional(),
  // Maps to supplier_payments.payment_date — lets bookkeeping backdate a payment
  // that happened before it was entered. Defaults to now() at the DB level.
  paidAt: z.string().datetime().optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentInput>;

// H14 — the customer-side mirror. A settlement method, not a billing term:
// 'tempo' describes how the sale was billed (deferred), never how a single
// instalment was actually paid, and 'split' describes a checkout with
// several methods in one transaction, not a single payment row here.
export const recordCustomerPaymentInput = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(['cash', 'transfer', 'qris']),
  // Maps to customer_payments.reference_number — e.g. a bank transfer reference.
  referenceNumber: z.string().optional(),
  // Maps to customer_payments.paid_at — lets bookkeeping backdate a payment
  // that happened before it was entered. Defaults to now() at the DB level.
  paidAt: z.string().datetime().optional(),
});
export type RecordCustomerPaymentInput = z.infer<typeof recordCustomerPaymentInput>;
