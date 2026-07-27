import { db } from '../../db/connection';
import { serviceTickets, customers, customerAssets, branches, tenants } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import { passcodePrintLabel } from '../../lib/passcode';
import { buildDocumentData, truncate } from './render';
import { resolveTemplateAndAssignment, type RenderedDocument } from './document';
import type { DocumentType, PaperSize, LayoutConfig, ThermalBlock } from './types';

/**
 * Tahap A (go-live gap Tier-1 #3) — 'label' and 'tanda_terima' are printed
 * from a service_ticket, before any invoice exists (at diagnosis, not at
 * payment). Deliberately NOT run through buildDocumentData()/
 * renderThermalBlocks() (render.ts) — those assume a monetary receipt shape
 * (line items + totals); forcing a label or a proof-of-storage-receipt
 * through that pipeline would print an empty items section or an awkward
 * "TOTAL Rp0" line. Both documents are simple, fixed-shape and get their own
 * minimal block builders below, reusing only the shared truncate() helper so
 * they still respect each paper size's character width.
 */
const TICKET_DOCUMENT_TYPES: readonly DocumentType[] = ['label', 'tanda_terima'];

export interface TicketDocumentBundle {
  storeName: string;
  branch: { name: string; address?: string };
  customerName: string;
  customerPhone?: string;
  assetDescription: string; // e.g. "Smartphone Samsung Galaxy A10"
  reportedComplaint?: string;
  intakeDate: string; // ISO
  passcode?: string; // sandi/pola HP — HANYA untuk label stoker (QC), bukan nota
  // Tahap B — nomor antrian harian, dicetak besar di label supaya pelanggan
  // bisa dipanggil ("pelanggan dipersilakan menunggu panggilan").
  queueNumber?: number;
  // Tahap B — lama pengerjaan yang dijanjikan teknisi, mis. "2 jam".
  estimatedDurationText?: string;
}

/** Tahap B — "150" -> "2 jam 30 menit". Kembali undefined bila belum diestimasi. */
export function formatDuration(totalMinutes: number | null | undefined): string | undefined {
  if (!totalMinutes || totalMinutes <= 0) return undefined;
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} hari`);
  if (hours) parts.push(`${hours} jam`);
  if (minutes) parts.push(`${minutes} menit`);
  return parts.join(' ');
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** A small sticker: who it belongs to, what's wrong, when it came in. */
export function buildLabelBlocks(layoutConfig: LayoutConfig, bundle: TicketDocumentBundle, width: number): ThermalBlock[] {
  const blocks: ThermalBlock[] = [];
  if (layoutConfig.header.showStoreName) {
    blocks.push({ type: 'text', value: bundle.storeName, align: 'center', bold: true });
    blocks.push({ type: 'line' });
  }
  // Nomor antrian paling atas & bold — ini yang dibaca dari jauh saat memanggil.
  if (bundle.queueNumber !== undefined) {
    blocks.push({ type: 'text', value: `NO. ANTRIAN ${bundle.queueNumber}`, align: 'center', bold: true });
    blocks.push({ type: 'line' });
  }
  blocks.push({ type: 'text', value: truncate(bundle.customerName, width), align: 'left', bold: true });
  blocks.push({ type: 'text', value: truncate(bundle.assetDescription, width), align: 'left' });
  blocks.push({ type: 'text', value: truncate(`Kerusakan: ${bundle.reportedComplaint || '-'}`, width), align: 'left' });
  blocks.push({ type: 'text', value: `Masuk: ${formatDateShort(bundle.intakeDate)}`, align: 'left' });
  // Sandi/pola dicetak di label stoker (nempel di unit) supaya teknisi QC bisa
  // membuka HP — sengaja TIDAK ada di nota/receipt pelanggan.
  if (bundle.passcode) {
    blocks.push({ type: 'text', value: truncate(passcodePrintLabel(bundle.passcode), width), align: 'left', bold: true });
  }
  if (layoutConfig.footer.note) {
    blocks.push({ type: 'line' });
    blocks.push({ type: 'text', value: truncate(layoutConfig.footer.note, width), align: 'center' });
  }
  blocks.push({ type: 'cut' });
  return blocks;
}

/** A proof-of-receipt for a unit left in storage (alur Disimpan) — not a
 * monetary transaction, so no items/totals; just what was received and when. */
export function buildTandaTerimaBlocks(layoutConfig: LayoutConfig, bundle: TicketDocumentBundle, width: number): ThermalBlock[] {
  const blocks: ThermalBlock[] = [];
  if (layoutConfig.header.showStoreName) blocks.push({ type: 'text', value: bundle.storeName, align: 'center', bold: true });
  if (layoutConfig.header.showAddress && bundle.branch.address) {
    blocks.push({ type: 'text', value: truncate(bundle.branch.address, width), align: 'center' });
  }
  blocks.push({ type: 'text', value: 'TANDA TERIMA UNIT SERVIS', align: 'center', bold: true });
  blocks.push({ type: 'line' });
  blocks.push({ type: 'text', value: `Tgl: ${formatDateShort(bundle.intakeDate)}`, align: 'left' });
  blocks.push({ type: 'text', value: truncate(`Plg: ${bundle.customerName}`, width), align: 'left' });
  if (bundle.customerPhone) blocks.push({ type: 'text', value: truncate(`Telp: ${bundle.customerPhone}`, width), align: 'left' });
  blocks.push({ type: 'line' });
  blocks.push({ type: 'text', value: truncate(bundle.assetDescription, width), align: 'left' });
  blocks.push({ type: 'text', value: truncate(`Keluhan: ${bundle.reportedComplaint || '-'}`, width), align: 'left' });
  // Tahap B — estimasi lama pengerjaan yang dijanjikan teknisi. Tanda terima
  // dicetak SETELAH diagnosis (saat unit diputuskan ditinggal), jadi nilainya
  // sudah ada di titik ini — beda dengan label yang tercetak di intake.
  if (bundle.estimatedDurationText) {
    blocks.push({ type: 'text', value: truncate(`Estimasi: ${bundle.estimatedDurationText}`, width), align: 'left' });
  }
  blocks.push({ type: 'line' });
  blocks.push({ type: 'text', value: 'Barang diambil dengan menunjukkan', align: 'center' });
  blocks.push({ type: 'text', value: 'bukti tanda terima ini.', align: 'center' });
  if (layoutConfig.footer.note) blocks.push({ type: 'text', value: truncate(layoutConfig.footer.note, width), align: 'center' });
  blocks.push({ type: 'cut' });
  return blocks;
}

const THERMAL_CHAR_WIDTH: Record<'58mm' | '80mm', number> = { '58mm': 32, '80mm': 48 };

export async function renderTicketDocument(
  tenantId: string,
  documentType: DocumentType,
  ticketId: string,
  requestedPaperSize?: PaperSize
): Promise<RenderedDocument> {
  if (!TICKET_DOCUMENT_TYPES.includes(documentType)) {
    throw new BusinessError('DOCUMENT_TYPE_NOT_SUPPORTED', `'${documentType}' is not a ticket-sourced document`, 400);
  }

  const [row] = await db
    .select({
      ticket: serviceTickets,
      customer: customers,
      asset: customerAssets,
      branch: branches,
      tenant: tenants,
    })
    .from(serviceTickets)
    .innerJoin(customers, eq(serviceTickets.customerId, customers.id))
    .innerJoin(customerAssets, eq(serviceTickets.customerAssetId, customerAssets.id))
    .innerJoin(branches, eq(serviceTickets.branchId, branches.id))
    .innerJoin(tenants, eq(serviceTickets.tenantId, tenants.id))
    .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
  if (!row) throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);

  const { template: resolvedTemplate, assignment: resolvedAssignment } =
    await resolveTemplateAndAssignment(tenantId, documentType, row.ticket.branchId, requestedPaperSize);

  const paperSize = resolvedTemplate.paperSize as PaperSize;
  if (paperSize === 'A4') {
    // Neither document type has an A4 template seeded (MVP scope, plan Q2-
    // style restraint) — guard rather than silently mis-rendering if one is
    // ever added without a matching A4 branch below.
    throw new BusinessError('NO_TEMPLATE', `'${documentType}' has no A4 rendering path yet`, 400);
  }

  const layoutConfig = resolvedTemplate.layoutConfig as LayoutConfig;
  const assetDescription = [row.asset.assetType, row.asset.brand, row.asset.model].filter(Boolean).join(' ');

  const bundle: TicketDocumentBundle = {
    storeName: row.tenant.name,
    branch: { name: row.branch.name, address: row.branch.address ?? undefined },
    customerName: row.customer.name,
    customerPhone: row.customer.phone ?? undefined,
    assetDescription: assetDescription || row.asset.assetType,
    reportedComplaint: row.ticket.reportedComplaint ?? undefined,
    intakeDate: row.ticket.createdAt.toISOString(),
    passcode: row.ticket.devicePasscode ?? undefined,
    queueNumber: row.ticket.queueNumber ?? undefined,
    estimatedDurationText: formatDuration(row.ticket.estimatedDurationMinutes),
  };

  const width = THERMAL_CHAR_WIDTH[paperSize];
  const blocks = documentType === 'label'
    ? buildLabelBlocks(layoutConfig, bundle, width)
    : buildTandaTerimaBlocks(layoutConfig, bundle, width);

  // RenderedDocument.data is typed as the invoice-shaped DocumentData for the
  // A4 path's benefit — neither ticket document type has one (guarded
  // above), so this is only ever a structural placeholder never rendered by
  // A4Invoice.svelte. buildDocumentData() is reused purely as a convenient,
  // already-correct constructor (empty items, zero totals), not because this
  // is actually invoice data.
  const data = buildDocumentData(documentType, layoutConfig, {
    invoiceNumber: '',
    createdAt: bundle.intakeDate,
    storeName: bundle.storeName,
    branch: bundle.branch,
    customerName: bundle.customerName,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    lines: [],
  });

  return {
    documentType,
    paperSize,
    template: { id: resolvedTemplate.id, name: resolvedTemplate.name },
    assignment: resolvedAssignment,
    data,
    blocks,
  };
}
