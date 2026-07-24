import { db } from '../../db/connection';
import { posInvoices, printerAssignments, printerTemplates } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import { buildDocumentData, renderThermalBlocks, type InvoiceBundle } from './render';
import type { DocumentType, PaperSize, LayoutConfig, DocumentData, ThermalBlock, ConnectionType, InvoiceDisplayMode } from './types';
import { INVOICE_DISPLAY_MODES } from './types';

export interface RenderedDocument {
  documentType: DocumentType;
  paperSize: PaperSize;
  template: { id: string; name: string };
  // The branch's actual configured printer for this documentType — null when
  // the caller asked for a paperSize different from what's assigned (a
  // preview), or when nothing is assigned yet at all.
  assignment: { deviceId: string; deviceName: string; connectionType: ConnectionType } | null;
  data: DocumentData;
  // Only for thermal paper — A4 never touches blocks (spec rule 2), the FE
  // renders `data` directly with HTML/CSS for window.print().
  blocks?: ThermalBlock[];
}

/**
 * Document types sourced from a pos_invoice. 'label'/'tanda_terima' are
 * ticket-sourced instead — see modules/printer/ticket-document.ts.
 */
const SUPPORTED_DOCUMENT_TYPES: readonly DocumentType[] = ['receipt', 'invoice_a4'];

// Drizzle leaves layout_config as `unknown` (jsonb with no .$type<>() —
// matches every other jsonb column in this schema) and paperSize as the
// column's plain `string`, not the PaperSize literal union — both are cast
// at the point of use, same as connectionType below.
export interface ResolvedTemplateRef { id: string; name: string; paperSize: string; layoutConfig: unknown }

// A documentType is "unambiguous" when exactly one paperSize makes sense for
// it at all (so a missing branch assignment can still fall back to the
// tenant default instead of asking the caller to disambiguate). 'receipt' is
// deliberately absent — 58mm vs 80mm genuinely can't be guessed.
const UNAMBIGUOUS_PAPER_SIZE: Partial<Record<DocumentType, PaperSize>> = {
  invoice_a4: 'A4',
  label: '58mm',
  tanda_terima: '80mm',
};

/**
 * Resolves which template (and, if one exists, which physical device
 * assignment) a given branch+documentType should print through. Shared by
 * both the pos_invoice path (renderPosInvoiceDocument) and the ticket path
 * (ticket-document.ts's renderTicketDocument) — extracted here rather than
 * duplicated, since renderTicketDocument became the second real caller of
 * this exact resolution logic.
 */
export async function resolveTemplateAndAssignment(
  tenantId: string,
  documentType: DocumentType,
  branchId: string,
  requestedPaperSize?: PaperSize
): Promise<{ template: ResolvedTemplateRef; assignment: RenderedDocument['assignment'] }> {
  const branchAssignment = await db.query.printerAssignments.findFirst({
    where: and(
      eq(printerAssignments.tenantId, tenantId),
      eq(printerAssignments.branchId, branchId),
      eq(printerAssignments.documentType, documentType)
    ),
    with: { device: true, template: true },
  });

  const toAssignment = (a: NonNullable<typeof branchAssignment>): RenderedDocument['assignment'] => ({
    deviceId: a.device.id,
    deviceName: a.device.name,
    connectionType: a.device.connectionType as ConnectionType,
  });

  if (requestedPaperSize) {
    if (branchAssignment && branchAssignment.template.paperSize === requestedPaperSize) {
      return { template: branchAssignment.template, assignment: toAssignment(branchAssignment) };
    }
    const fallback = await db.query.printerTemplates.findFirst({
      where: and(
        eq(printerTemplates.tenantId, tenantId),
        eq(printerTemplates.documentType, documentType),
        eq(printerTemplates.paperSize, requestedPaperSize),
        eq(printerTemplates.isDefault, true)
      ),
    });
    if (!fallback) throw new BusinessError('NO_TEMPLATE', `No ${documentType} template for paper size ${requestedPaperSize}`, 404);
    return { template: fallback, assignment: null };
  }

  if (branchAssignment) {
    return { template: branchAssignment.template, assignment: toAssignment(branchAssignment) };
  }

  const unambiguousSize = UNAMBIGUOUS_PAPER_SIZE[documentType];
  if (unambiguousSize) {
    const fallback = await db.query.printerTemplates.findFirst({
      where: and(
        eq(printerTemplates.tenantId, tenantId),
        eq(printerTemplates.documentType, documentType),
        eq(printerTemplates.paperSize, unambiguousSize),
        eq(printerTemplates.isDefault, true)
      ),
    });
    if (!fallback) throw new BusinessError('NO_TEMPLATE', `No ${documentType} template configured for this tenant`, 404);
    return { template: fallback, assignment: null };
  }

  throw new BusinessError('PAPER_SIZE_REQUIRED', `No printer is assigned to this branch for ${documentType}; specify a paperSize`, 400);
}

export async function renderPosInvoiceDocument(
  tenantId: string,
  documentType: DocumentType,
  invoiceId: string,
  requestedPaperSize?: PaperSize
): Promise<RenderedDocument> {
  if (!SUPPORTED_DOCUMENT_TYPES.includes(documentType)) {
    throw new BusinessError('DOCUMENT_TYPE_NOT_SUPPORTED', `'${documentType}' printing is not wired to a document source yet`, 400);
  }

  const invoice = await db.query.posInvoices.findFirst({
    where: and(eq(posInvoices.id, invoiceId), eq(posInvoices.tenantId, tenantId)),
    with: {
      tenant: true,
      branch: true,
      customer: true,
      creator: true,
      lines: true,
      serviceTicket: { with: { assignedTechnician: true } },
    },
  });
  if (!invoice) throw new BusinessError('NOT_FOUND', 'Invoice not found', 404);

  const { template: resolvedTemplate, assignment: resolvedAssignment } =
    await resolveTemplateAndAssignment(tenantId, documentType, invoice.branchId, requestedPaperSize);

  const paperSize = resolvedTemplate.paperSize as PaperSize;

  const bundle: InvoiceBundle = {
    invoiceNumber: invoice.invoiceNumber,
    createdAt: invoice.createdAt.toISOString(),
    storeName: invoice.tenant.name,
    branch: { name: invoice.branch.name, address: invoice.branch.address ?? undefined },
    customerName: invoice.customerName ?? invoice.customer?.name,
    cashierName: invoice.creator?.name,
    subtotal: Number(invoice.subtotal),
    discountAmount: Number(invoice.discountAmount),
    taxAmount: Number(invoice.taxAmount),
    grandTotal: Number(invoice.grandTotal),
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      subtotal: Number(l.subtotal),
    })),
    technicianName: invoice.serviceTicket?.assignedTechnician?.name,
  };

  const data = buildDocumentData(documentType, resolvedTemplate.layoutConfig as LayoutConfig, bundle);

  // Tahap A — invoice display mode, resolved from the tenant's settings (this
  // is the one caller that already fetches `invoice.tenant`). Only meaningful
  // here — ticket-document.ts's label/tanda_terima have no line items.
  const tenantSettings = (invoice.tenant.settings ?? {}) as Record<string, unknown>;
  const rawMode = tenantSettings.invoiceDisplayMode;
  const displayMode: InvoiceDisplayMode = (INVOICE_DISPLAY_MODES as readonly string[]).includes(rawMode as string)
    ? (rawMode as InvoiceDisplayMode)
    : 'detailed';
  data.displayMode = displayMode;

  // Thermal paper is committed once printed — no interactive toggle, so
  // 'flexible' prints Detailed by default; only a genuine 'summary' setting
  // collapses the printed lines. The A4 preview (below, spec rule 2 — client
  // HTML) gets the full `data` untouched and does its own toggle.
  const thermalData = displayMode === 'summary' && data.summaryItems
    ? { ...data, items: data.summaryItems }
    : data;
  const blocks = paperSize === 'A4' ? undefined : renderThermalBlocks(paperSize, thermalData);

  return {
    documentType,
    paperSize,
    template: { id: resolvedTemplate.id, name: resolvedTemplate.name },
    assignment: resolvedAssignment,
    data,
    blocks,
  };
}
