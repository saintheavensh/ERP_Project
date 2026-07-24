import { z } from 'zod';

// Matches the varchar-with-comment convention already used in db/schema/printer.ts
// (no pg enum type on these columns) — validated here at the Zod layer instead,
// same as every other module's types.ts.
export const DOCUMENT_TYPES = ['receipt', 'invoice_a4', 'label'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const PAPER_SIZES = ['58mm', '80mm', 'A4'] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

// 'win32' -- print via the Windows spooler by printer name (python-escpos's
// Win32Raw), letting the agent (6C) list installed printers for the user to
// pick from instead of typing a USB vendor/product ID or IP by hand. See
// printer-agent/connection.py's scan_windows_printers().
export const CONNECTION_TYPES = ['usb', 'network', 'serial', 'os_printer', 'win32'] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];

/**
 * Display configuration ONLY — never a transaction value (spec's "Template:
 * Separate from Data"). Every field is a flag or a static label; the actual
 * customer name / price / etc. is always fetched fresh at render time.
 *
 * Shape follows the spec's "Detail Increases with Paper Size" table directly:
 * header gains address/phone/logo, items gain a subtotal column and then a
 * full description, extra gains cashier name then ticket info + signature,
 * footer goes from nothing to a short note to the full warranty policy text.
 */
export const layoutConfigSchema = z.object({
  header: z.object({
    showStoreName: z.boolean().default(true),
    showAddress: z.boolean().default(false),
    showPhone: z.boolean().default(false),
    showLogo: z.boolean().default(false), // A4 only — rendering it is a Phase 7 concern
  }),
  items: z.object({
    showLineSubtotal: z.boolean().default(false),
    showDescription: z.boolean().default(false), // A4's fuller per-item text
  }),
  extra: z.object({
    showCashierName: z.boolean().default(false),
    showTicketInfo: z.boolean().default(false), // complaint/diagnosis/technician — A4 only
    showSignature: z.boolean().default(false), // A4 signature column
  }),
  footer: z.object({
    note: z.string().max(200).nullish(), // short line, e.g. "Garansi servis 7 hari"
    warrantyPolicy: z.string().max(2000).nullish(), // full text, A4 only
  }),
});
export type LayoutConfig = z.infer<typeof layoutConfigSchema>;

// ---- Config CRUD (6A.3) ----

export const createDeviceSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(1),
  connectionType: z.enum(CONNECTION_TYPES),
  connectionAddress: z.string().min(1).nullish(),
  paperSize: z.enum(PAPER_SIZES),
});
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;

export const updateDeviceSchema = z.object({
  name: z.string().min(1).optional(),
  connectionType: z.enum(CONNECTION_TYPES).optional(),
  connectionAddress: z.string().min(1).nullish(),
  paperSize: z.enum(PAPER_SIZES).optional(),
});
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  documentType: z.enum(DOCUMENT_TYPES),
  paperSize: z.enum(PAPER_SIZES),
  layoutConfig: layoutConfigSchema,
  isDefault: z.boolean().optional().default(false),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  layoutConfig: layoutConfigSchema.optional(),
  isDefault: z.boolean().optional(),
});
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// Upsert semantics on purpose: (branchId, documentType) is unique, and the
// natural UI action is "set what Receipt prints to for this branch", not
// separately create-then-update.
export const upsertAssignmentSchema = z.object({
  branchId: z.string().uuid(),
  documentType: z.enum(DOCUMENT_TYPES),
  printerDeviceId: z.string().uuid(),
  printerTemplateId: z.string().uuid(),
});
export type UpsertAssignmentInput = z.infer<typeof upsertAssignmentSchema>;

// ---- Render (6A.2 / 6A.4) ----

/** Paper-agnostic, already-shaped-by-layoutConfig document data. The single
 * assembly step shared by both paper mechanisms: renderThermalBlocks() reads
 * it for 58/80mm, and the A4 Svelte component reads it directly (spec rule 2
 * — A4 never goes through blocks or the Python agent). */
export interface DocumentData {
  documentType: DocumentType;
  header: {
    storeName: string;
    address?: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
  };
  extra: {
    cashierName?: string;
    customerName?: string;
    invoiceNumber?: string;
    createdAt?: string;
    // "Ticket info" per the spec's paper-size table is scoped to what the
    // schema actually has today: service_tickets carries no complaint/
    // diagnosis free-text column (a real, already-known gap — SVC-001/006 —
    // not something to invent here, same restraint as F6/P9). Only the
    // assigned technician's name is real data.
    technicianName?: string;
  };
  footer: {
    note?: string;
    warrantyPolicy?: string;
  };
  // Boolean rendering flags resolved once from layoutConfig by
  // buildDocumentData() — both the thermal block builder and the (future) A4
  // component read these instead of re-reading layoutConfig themselves, so
  // "which fields to show" is decided in exactly one place.
  display: {
    showLineSubtotal: boolean;
    showLogo: boolean; // A4 header only
    showSignature: boolean; // A4 signature column only
  };
}

export type BlockAlign = 'left' | 'center' | 'right';

// 'row'/'total' carry an ALREADY width-padded single string (via padRow() in
// render.ts) — never separate left/right pieces. That is what makes the
// Python agent's job purely mechanical (print `value` verbatim) instead of
// re-implementing column alignment, per the spec's "one shared render
// module" rule.
export type ThermalBlock =
  | { type: 'text'; value: string; align: BlockAlign; bold?: boolean }
  | { type: 'line' }
  | { type: 'row'; value: string; bold?: boolean }
  | { type: 'total'; value: string }
  | { type: 'cut' };
