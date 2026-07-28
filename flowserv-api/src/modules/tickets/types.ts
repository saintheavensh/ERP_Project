import { z } from 'zod';

// A 'part' charge references real inventory. unitPrice defaults from the item's selling
// price (looked up in the service) but stays editable — technicians negotiate — so it is
// optional here. Stock is NOT touched at estimate time; that is H9.
export const partChargeSchema = z.object({
  sourceType: z.literal('part'),
  inventoryItemId: z.string().uuid(),
  partBrandId: z.string().uuid().optional(),
  description: z.string().min(1).optional(), // defaults to inventory_items.name if omitted
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().min(0).optional(),
});

// 'labor' and 'fee' charges carry their own description and price — there is no inventory
// item behind a service charge, so both are required.
export const laborFeeChargeSchema = z.object({
  sourceType: z.enum(['labor', 'fee']),
  description: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().min(0),
});

export const createChargeInput = z.discriminatedUnion('sourceType', [
  partChargeSchema,
  laborFeeChargeSchema,
]);

// Editing is allowed only while a charge is 'estimated' (enforced in the service).
// sourceType and the linked item are fixed once created — only price/qty/description move.
export const updateChargeInput = z.object({
  description: z.string().min(1).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  unitPrice: z.coerce.number().min(0).optional(),
});

export type CreateChargeInput = z.infer<typeof createChargeInput>;
export type UpdateChargeInput = z.infer<typeof updateChargeInput>;

// H8 — manual technician assignment. technicianId is a users.id; there is no
// separate technicians table (see plan/H8-technician-and-customer.md "Watch out").
export const assignTechnicianInput = z.object({
  technicianId: z.string().uuid(),
});

export type AssignTechnicianInput = z.infer<typeof assignTechnicianInput>;

// H17 — generate a service invoice from a ticket's billable charges. The customer
// is the ticket's own customer (not passed here), so 'tempo' always has a customer
// link. 'split' is intentionally omitted — a service invoice is paid in full or
// settled later via the H14 payment endpoint. See plan/H17-service-invoice-from-ticket.md.
export const generateTicketInvoiceInput = z.object({
  paymentMethod: z.enum(['cash', 'transfer', 'qris', 'tempo']),
  discountAmount: z.coerce.number().min(0).default(0),
  // Tahap B — uang tunai diterima, sama seperti checkout POS. Kecukupannya
  // divalidasi di service (grandTotal baru diketahui setelah charge dijumlahkan).
  amountTendered: z.coerce.number().min(0).optional(),
});

export type GenerateTicketInvoiceInput = z.infer<typeof generateTicketInvoiceInput>;

// F3 — SVC-013: cancel a ticket. A reason is mandatory (surfaced on the
// ticket_stage_history note) so an abandoned job is never silent.
export const cancelTicketInput = z.object({
  reason: z.string().min(1, 'Alasan pembatalan wajib diisi'),
});

export type CancelTicketInput = z.infer<typeof cancelTicketInput>;

// Tahap A — go-live gap Tier-1 #2/#3. Both fields are captured at intake but
// editable afterward (correcting a typo, clearing sandi/pola once handed
// back at QC Akhir). `null` clears a field; an omitted key is a no-op, not a
// clear — so a caller updating just one field never touches the other.
export const updateIntakeDetailsInput = z.object({
  devicePasscode: z.string().nullable().optional(),
  reportedComplaint: z.string().nullable().optional(),
  // Tahap B — hasil diagnosis teknisi + lama pengerjaan yang dijanjikan ke
  // pelanggan. Ikut endpoint yang sama, bukan endpoint baru: pola "field kecil
  // di service_ticket yang bisa diperbaiki kapan saja" persis sama dengan dua
  // field di atas (lihat catatan endpoint di routes/tickets.ts).
  diagnosis: z.string().nullable().optional(),
  estimatedDurationMinutes: z.coerce.number().int().positive().nullable().optional(),
});

export type UpdateIntakeDetailsInput = z.infer<typeof updateIntakeDetailsInput>;

// Daftar periksa tahap (QC). Seluruh jawaban satu tahap dikirim sekaligus —
// teknisi mencentang beberapa baris lalu menekan Simpan sekali, dan menyimpan
// per-centang akan menghasilkan puluhan request untuk satu tindakan.
export const saveChecklistInput = z.object({
  nodeId: z.string().uuid(),
  answers: z.array(z.object({
    itemId: z.string().uuid(),
    checked: z.boolean(),
    note: z.string().max(500).nullable().optional(),
  })).min(1, 'Tidak ada jawaban untuk disimpan'),
});

export type SaveChecklistInputSchema = z.infer<typeof saveChecklistInput>;
