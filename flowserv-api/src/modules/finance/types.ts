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
