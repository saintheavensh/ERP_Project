import { z } from 'zod';

// A 'part' line references real inventory and drives FIFO stock deduction.
export const partLineSchema = z.object({
  sourceType: z.literal('part'),
  inventoryItemId: z.string().uuid(),
  partBrandId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
});

// 'labor' and 'fee' lines carry their own description and never touch stock —
// there is no inventory item behind a service charge.
export const laborFeeLineSchema = z.object({
  sourceType: z.enum(['labor', 'fee']),
  description: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.coerce.number().positive(),
});

export const posCheckoutLineSchema = z.discriminatedUnion('sourceType', [
  partLineSchema,
  laborFeeLineSchema,
]);

export const posCheckoutSchema = z.object({
  branchId: z.string().uuid(),
  customerName: z.string().optional(),
  serviceTicketId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'qris', 'split', 'tempo']),
  discountAmount: z.coerce.number().min(0).default(0),
  items: z.array(posCheckoutLineSchema).min(1, 'Keranjang tidak boleh kosong'),
});

export type PosCheckoutInput = z.infer<typeof posCheckoutSchema>;
export type PosCheckoutLine = z.infer<typeof posCheckoutLineSchema>;
