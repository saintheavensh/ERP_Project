import { pgEnum } from 'drizzle-orm/pg-core';

export const paymentStatusEnum   = pgEnum('payment_status',   ['unpaid', 'partial', 'paid']);
// 'discount' is reserved for per-line discounts (SAL-006) — not implemented yet,
// see H6-labor-billing.md "Watch out". Only 'part', 'labor', 'fee' are ever written today.
export const lineSourceEnum      = pgEnum('line_source',      ['part', 'labor', 'fee', 'discount']);
export const invoiceStatusEnum   = pgEnum('invoice_status',   ['active', 'voided']);
export const poStatusEnum        = pgEnum('po_status',        ['draft', 'ordered', 'partial', 'received', 'completed']);
export const movementTypeEnum    = pgEnum('movement_type',    ['in', 'out', 'reserve', 'release', 'adjust', 'write_off']);
export const ticketStatusEnum    = pgEnum('ticket_status',    ['open', 'closed', 'cancelled']);
// Tahap A (plan/A-service-flow-templates.md) — 'ditunggu' (customer waits on-site) vs
// 'disimpan' (unit left behind). Changeable mid-flow, not a fixed intake choice: see
// the schema comment on service_tickets.serviceMode for why this isn't a second flow
// template.
export const serviceModeEnum     = pgEnum('service_mode',     ['ditunggu', 'disimpan']);
// Ticket charge lifecycle (H7): estimated → approved (customer accepts quote) →
// consumed (part physically taken from stock, set in H9). 'cancelled' = job abandoned
// or part not needed. Only 'estimated' charges are editable.
export const chargeStatusEnum    = pgEnum('charge_status',    ['estimated', 'approved', 'consumed', 'cancelled']);
export const paymentMethodEnum   = pgEnum('payment_method',   ['cash', 'transfer', 'qris', 'split', 'tempo']);

// H2 assumed this vocabulary was Indonesian ('tunai'/'transfer'/'tempo'), based on a
// stale schema comment. The actual write sites (purchasing/invoices.ts, modules/finance/types.ts)
// and every frontend form already send English values identical to paymentMethodEnum's —
// 'tunai' never appears as a stored value anywhere, only as a UI label for 'cash'. Encoded
// as English to match real behavior; a separate enum (not a reuse of paymentMethodEnum) because
// supplier invoices/payments never see 'qris' or 'split'.
export const supplierPayMethodEnum = pgEnum('supplier_payment_method', ['cash', 'transfer', 'tempo']);

// Derive the TS unions from the same declaration — never hand-write them twice.
export type PaymentStatus        = (typeof paymentStatusEnum.enumValues)[number];
export type LineSource           = (typeof lineSourceEnum.enumValues)[number];
export type InvoiceStatus        = (typeof invoiceStatusEnum.enumValues)[number];
export type PoStatus             = (typeof poStatusEnum.enumValues)[number];
export type MovementType         = (typeof movementTypeEnum.enumValues)[number];
export type TicketStatus         = (typeof ticketStatusEnum.enumValues)[number];
export type ServiceMode          = (typeof serviceModeEnum.enumValues)[number];
export type ChargeStatus         = (typeof chargeStatusEnum.enumValues)[number];
export type PaymentMethod        = (typeof paymentMethodEnum.enumValues)[number];
export type SupplierPaymentMethod = (typeof supplierPayMethodEnum.enumValues)[number];
