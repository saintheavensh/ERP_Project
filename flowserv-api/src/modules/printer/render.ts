import type { DocumentType, LayoutConfig, DocumentData, ThermalBlock } from './types';

/**
 * Raw data a receipt/invoice is built from — paper-agnostic, one shape
 * regardless of documentType (both 'receipt' and 'invoice_a4' are sourced
 * from a pos_invoice in this phase's MVP scope, per plan Q2). The caller
 * (6A.4's route) is responsible for fetching this from the DB; everything in
 * this file is pure and receives it as a plain argument.
 */
export interface InvoiceBundle {
  invoiceNumber: string;
  createdAt: string; // ISO — formatting is a display concern the caller/FE owns
  storeName: string; // tenant name
  branch: { name: string; address?: string; phone?: string };
  customerName?: string;
  cashierName?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  lines: Array<{ description: string; quantity: number; unitPrice: number; subtotal: number }>;
  technicianName?: string;
}

/**
 * The single "which fields to show" decision, shared by every paper
 * mechanism (spec: "Template: Separate from Data" + "Render template code
 * ... must be identical"). Thermal formatting (renderThermalBlocks below)
 * and the A4 Svelte component both consume this — neither re-reads
 * layoutConfig on its own.
 */
export function buildDocumentData(
  documentType: DocumentType,
  layoutConfig: LayoutConfig,
  bundle: InvoiceBundle
): DocumentData {
  return {
    documentType,
    header: {
      storeName: layoutConfig.header.showStoreName ? bundle.storeName : '',
      address: layoutConfig.header.showAddress ? bundle.branch.address : undefined,
      phone: layoutConfig.header.showPhone ? bundle.branch.phone : undefined,
    },
    items: bundle.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      subtotal: l.subtotal,
    })),
    totals: {
      subtotal: bundle.subtotal,
      discountAmount: bundle.discountAmount,
      taxAmount: bundle.taxAmount,
      grandTotal: bundle.grandTotal,
    },
    extra: {
      cashierName: layoutConfig.extra.showCashierName ? bundle.cashierName : undefined,
      customerName: bundle.customerName,
      invoiceNumber: bundle.invoiceNumber,
      createdAt: bundle.createdAt,
      technicianName: layoutConfig.extra.showTicketInfo ? bundle.technicianName : undefined,
    },
    footer: {
      note: layoutConfig.footer.note ?? undefined,
      warrantyPolicy: layoutConfig.footer.warrantyPolicy ?? undefined,
    },
    display: {
      showLineSubtotal: layoutConfig.items.showLineSubtotal,
      showLogo: layoutConfig.header.showLogo,
      showSignature: layoutConfig.extra.showSignature,
    },
  };
}

export const THERMAL_CHAR_WIDTH: Record<'58mm' | '80mm', number> = {
  '58mm': 32,
  '80mm': 48,
};

/** Hard-truncates to at most maxLen characters, marking the cut with ".."
 * when room allows — the classic thermal-printer convention. */
export function truncate(text: string, maxLen: number): string {
  if (maxLen <= 0) return '';
  if (text.length <= maxLen) return text;
  if (maxLen <= 2) return text.slice(0, maxLen);
  return text.slice(0, maxLen - 2) + '..';
}

/** Pads left+right onto exactly `width` characters, right-aligned right
 * text, truncating left first if the two would overlap. This is the ONE
 * place column alignment happens — every row block below calls it, and
 * nothing downstream (preview, Python agent) recomputes it. */
export function padRow(left: string, right: string, width: number): string {
  const r = right.length > width ? right.slice(0, width) : right;
  const maxLeft = Math.max(0, width - r.length - 1); // reserve >=1 space between columns
  const l = truncate(left, maxLeft);
  const gap = Math.max(1, width - l.length - r.length);
  return l + ' '.repeat(gap) + r;
}

/** Indonesian-style thousands separator ("350000" -> "350.000"). Manual
 * regex rather than toLocaleString('id-ID') to keep this deterministic and
 * free of any ICU/locale-data dependency in tests. */
export function formatMoney(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Turns already-shaped DocumentData into a flat block list for 58mm/80mm
 * thermal paper. This — not the Python agent — is where every alignment,
 * truncation, and "does this line even appear" decision is made; the agent's
 * only job is translating each block to the matching python-escpos call.
 */
export function renderThermalBlocks(paperSize: '58mm' | '80mm', doc: DocumentData): ThermalBlock[] {
  const width = THERMAL_CHAR_WIDTH[paperSize];
  const blocks: ThermalBlock[] = [];

  if (doc.header.storeName) {
    blocks.push({ type: 'text', value: doc.header.storeName, align: 'center', bold: true });
  }
  if (doc.header.address) blocks.push({ type: 'text', value: truncate(doc.header.address, width), align: 'center' });
  if (doc.header.phone) blocks.push({ type: 'text', value: doc.header.phone, align: 'center' });
  blocks.push({ type: 'line' });

  if (doc.extra.invoiceNumber) blocks.push({ type: 'text', value: doc.extra.invoiceNumber, align: 'left' });
  if (doc.extra.createdAt) blocks.push({ type: 'text', value: doc.extra.createdAt, align: 'left' });
  if (doc.extra.customerName) blocks.push({ type: 'text', value: truncate(`Plg: ${doc.extra.customerName}`, width), align: 'left' });
  if (doc.extra.cashierName) blocks.push({ type: 'text', value: truncate(`Kasir: ${doc.extra.cashierName}`, width), align: 'left' });
  blocks.push({ type: 'line' });

  for (const item of doc.items) {
    blocks.push({ type: 'text', value: truncate(item.description, width), align: 'left' });
    const qtyPrice = `${item.quantity}x ${formatMoney(item.unitPrice)}`;
    if (doc.display.showLineSubtotal) {
      blocks.push({ type: 'row', value: padRow(qtyPrice, formatMoney(item.subtotal), width) });
    } else {
      blocks.push({ type: 'text', value: truncate(qtyPrice, width), align: 'left' });
    }
  }
  blocks.push({ type: 'line' });

  if (doc.totals.discountAmount > 0) {
    blocks.push({ type: 'row', value: padRow('Diskon', `-${formatMoney(doc.totals.discountAmount)}`, width) });
  }
  if (doc.totals.taxAmount > 0) {
    blocks.push({ type: 'row', value: padRow('Pajak', formatMoney(doc.totals.taxAmount), width) });
  }
  blocks.push({ type: 'total', value: padRow('TOTAL', formatMoney(doc.totals.grandTotal), width) });

  if (doc.footer.note) {
    blocks.push({ type: 'line' });
    blocks.push({ type: 'text', value: truncate(doc.footer.note, width), align: 'center' });
  }

  blocks.push({ type: 'cut' });
  return blocks;
}

/**
 * Tahap A (plan/A-service-flow-templates.md) — raw data behind 'label' and
 * 'tanda_terima', sourced directly from a service_ticket (there is no invoice yet
 * at "diagnosis + price given", the moment both print). Deliberately a separate
 * shape from InvoiceBundle: a ticket at this point has no line items/subtotal in
 * the invoice sense, just a complaint, an optional unlock code, and (once quoted)
 * a cumulative approved amount.
 */
export interface ServiceTicketBundle {
  createdAt: string; // ISO — when the unit was taken in (intake), not "now"
  storeName: string;
  branch: { name: string; address?: string; phone?: string };
  customerName: string;
  assetLabel: string; // "Smartphone Samsung Galaxy A54" — already joined by the caller
  reportedComplaint: string;
  unlockCode?: string;
  serviceMode: 'ditunggu' | 'disimpan';
  quotedAmount?: number; // service_tickets.approvedTotal — undefined if not quoted yet
}

/**
 * 'label': nama, kerusakan, tanggal masuk ONLY — no price (that's what tanda_terima
 * is for; a label is an identification tag stuck on the unit itself, per the owner's
 * own spec, not a financial document). Printed in BOTH service paths.
 *
 * 'tanda_terima': the same identification info PLUS the agreed price and unlock
 * code, since it doubles as proof the unit was left behind with the shop (only the
 * 'disimpan' path prints this).
 */
export function renderTicketThermalBlocks(
  documentType: 'label' | 'tanda_terima',
  paperSize: '58mm' | '80mm',
  bundle: ServiceTicketBundle
): ThermalBlock[] {
  const width = THERMAL_CHAR_WIDTH[paperSize];
  const blocks: ThermalBlock[] = [];

  blocks.push({ type: 'text', value: bundle.storeName, align: 'center', bold: true });
  blocks.push({
    type: 'text',
    value: documentType === 'label' ? 'LABEL UNIT SERVIS' : 'TANDA TERIMA UNIT',
    align: 'center',
    bold: true,
  });
  blocks.push({ type: 'line' });

  blocks.push({ type: 'text', value: truncate(`Plg: ${bundle.customerName}`, width), align: 'left' });
  blocks.push({ type: 'text', value: truncate(bundle.assetLabel, width), align: 'left' });
  blocks.push({ type: 'text', value: `Masuk: ${bundle.createdAt}`, align: 'left' });
  blocks.push({ type: 'line' });

  blocks.push({ type: 'text', value: 'Keluhan/Kerusakan:', align: 'left', bold: true });
  blocks.push({ type: 'text', value: truncate(bundle.reportedComplaint, width), align: 'left' });

  if (documentType === 'tanda_terima') {
    blocks.push({ type: 'line' });
    if (bundle.unlockCode) {
      blocks.push({ type: 'text', value: truncate(`Sandi/Pola: ${bundle.unlockCode}`, width), align: 'left' });
    }
    if (bundle.quotedAmount !== undefined) {
      blocks.push({ type: 'total', value: padRow('Harga Disepakati', formatMoney(bundle.quotedAmount), width) });
    } else {
      blocks.push({ type: 'text', value: 'Harga: menunggu diagnosa', align: 'left' });
    }
    blocks.push({ type: 'line' });
    blocks.push({ type: 'text', value: 'Simpan tanda terima ini untuk', align: 'center' });
    blocks.push({ type: 'text', value: 'pengambilan unit.', align: 'center' });
  }

  blocks.push({ type: 'cut' });
  return blocks;
}
