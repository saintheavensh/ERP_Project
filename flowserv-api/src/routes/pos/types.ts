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
  // H8 — you cannot extend credit to a free-text string. 'tempo' requires a
  // real customer link; walk-in cash sales may leave this null.
  customerId: z.string().uuid().optional(),
  serviceTicketId: z.string().uuid().optional(),
  // Tahap A — 'ewallet' added for Dana/OVO/GoPay. The FE sends the selected
  // method's `type` (not its id), so the tempo->unpaid logic below and the
  // paymentStatus derivation still key off this finite category unchanged.
  paymentMethod: z.enum(['cash', 'transfer', 'qris', 'ewallet', 'split', 'tempo']),
  discountAmount: z.coerce.number().min(0).default(0),
  // Tahap B — uang tunai yang diserahkan pelanggan, dipakai kasir untuk
  // menghitung kembalian dan dicetak di struk. Opsional: hanya bermakna untuk
  // paymentMethod 'cash'; diabaikan (tidak disimpan) untuk metode lain.
  // Kecukupannya divalidasi di handler, bukan di sini — grandTotal baru
  // diketahui setelah item dijumlahkan server-side.
  amountTendered: z.coerce.number().min(0).optional(),
  items: z.array(posCheckoutLineSchema).min(1, 'Keranjang tidak boleh kosong'),
}).refine((data) => data.paymentMethod !== 'tempo' || !!data.customerId, {
  message: 'Pelanggan wajib dipilih untuk pembayaran tempo',
  path: ['customerId'],
});

export type PosCheckoutInput = z.infer<typeof posCheckoutSchema>;
export type PosCheckoutLine = z.infer<typeof posCheckoutLineSchema>;
