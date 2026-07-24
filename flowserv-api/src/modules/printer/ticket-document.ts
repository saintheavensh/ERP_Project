import { db } from '../../db/connection';
import { serviceTickets, customers, customerAssets, branches, tenants } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
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
  blocks.push({ type: 'text', value: truncate(bundle.customerName, width), align: 'left', bold: true });
  blocks.push({ type: 'text', value: truncate(bundle.assetDescription, width), align: 'left' });
  blocks.push({ type: 'text', value: truncate(`Kerusakan: ${bundle.reportedComplaint || '-'}`, width), align: 'left' });
  blocks.push({ type: 'text', value: `Masuk: ${formatDateShort(bundle.intakeDate)}`, align: 'left' });
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
