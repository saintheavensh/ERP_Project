import { db } from '../../db/connection';
import { posInvoices, printerAssignments, printerTemplates, serviceTickets } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import { buildDocumentData, renderThermalBlocks, renderTicketThermalBlocks, type InvoiceBundle, type ServiceTicketBundle } from './render';
import type { DocumentType, PaperSize, LayoutConfig, DocumentData, ThermalBlock, ConnectionType } from './types';

export interface RenderedDocument {
  documentType: DocumentType;
  paperSize: PaperSize;
  template: { id: string; name: string };
  // The branch's actual configured printer for this documentType — null when
  // the caller asked for a paperSize different from what's assigned (a
  // preview), or when nothing is assigned yet at all.
  assignment: { deviceId: string; deviceName: string; connectionType: ConnectionType } | null;
  // DocumentData for 'receipt'/'invoice_a4' (invoice-sourced); ServiceTicketBundle
  // for 'label'/'tanda_terima' (ticket-sourced, Tahap A) — the A4 component only
  // ever reads the former, since the latter two are thermal-only (see
  // renderServiceTicketDocument's A4 guard below).
  data: DocumentData | ServiceTicketBundle;
  // Only for thermal paper — A4 never touches blocks (spec rule 2), the FE
  // renders `data` directly with HTML/CSS for window.print().
  blocks?: ThermalBlock[];
}

/**
 * pos_invoice-sourced document types (plan Q2's MVP scope). 'label' and
 * 'tanda_terima' are sourced from a service_ticket instead — see
 * renderServiceTicketDocument() below (Tahap A).
 */
const SUPPORTED_DOCUMENT_TYPES: readonly DocumentType[] = ['receipt', 'invoice_a4'];
const SUPPORTED_TICKET_DOCUMENT_TYPES: readonly DocumentType[] = ['label', 'tanda_terima'];

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

  const branchAssignment = await db.query.printerAssignments.findFirst({
    where: and(
      eq(printerAssignments.tenantId, tenantId),
      eq(printerAssignments.branchId, invoice.branchId),
      eq(printerAssignments.documentType, documentType)
    ),
    with: { device: true, template: true },
  });

  // Drizzle leaves layout_config as `unknown` (jsonb with no .$type<>() —
  // matches every other jsonb column in this schema) and paperSize as the
  // column's plain `string`, not the PaperSize literal union — both are cast
  // at the point of use below, same as connectionType a few lines down.
  interface ResolvedTemplateRef { id: string; name: string; paperSize: string; layoutConfig: unknown }
  let resolvedTemplate: ResolvedTemplateRef | null = null;
  let resolvedAssignment: RenderedDocument['assignment'] = null;

  if (requestedPaperSize) {
    if (branchAssignment && branchAssignment.template.paperSize === requestedPaperSize) {
      resolvedTemplate = branchAssignment.template;
      resolvedAssignment = {
        deviceId: branchAssignment.device.id,
        deviceName: branchAssignment.device.name,
        connectionType: branchAssignment.device.connectionType as ConnectionType,
      };
    } else {
      const fallback = await db.query.printerTemplates.findFirst({
        where: and(
          eq(printerTemplates.tenantId, tenantId),
          eq(printerTemplates.documentType, documentType),
          eq(printerTemplates.paperSize, requestedPaperSize),
          eq(printerTemplates.isDefault, true)
        ),
      });
      if (!fallback) throw new BusinessError('NO_TEMPLATE', `No ${documentType} template for paper size ${requestedPaperSize}`, 404);
      resolvedTemplate = fallback;
    }
  } else if (branchAssignment) {
    resolvedTemplate = branchAssignment.template;
    resolvedAssignment = {
      deviceId: branchAssignment.device.id,
      deviceName: branchAssignment.device.name,
      connectionType: branchAssignment.device.connectionType as ConnectionType,
    };
  } else if (documentType === 'invoice_a4') {
    // A4 is unambiguous — there is only one paper size for this doc type,
    // so a missing assignment can still fall back to the tenant default.
    const fallback = await db.query.printerTemplates.findFirst({
      where: and(
        eq(printerTemplates.tenantId, tenantId),
        eq(printerTemplates.documentType, documentType),
        eq(printerTemplates.paperSize, 'A4'),
        eq(printerTemplates.isDefault, true)
      ),
    });
    if (!fallback) throw new BusinessError('NO_TEMPLATE', 'No invoice_a4 template configured for this tenant', 404);
    resolvedTemplate = fallback;
  } else {
    // 'receipt' has no branch assignment AND no explicit paperSize -- 58mm
    // vs 80mm can't be guessed. Ask the caller to say which, rather than
    // silently picking one.
    throw new BusinessError('PAPER_SIZE_REQUIRED', 'No printer is assigned to this branch for receipts; specify ?paperSize=58mm or 80mm', 400);
  }

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
  const blocks = paperSize === 'A4' ? undefined : renderThermalBlocks(paperSize, data);

  return {
    documentType,
    paperSize,
    template: { id: resolvedTemplate.id, name: resolvedTemplate.name },
    assignment: resolvedAssignment,
    data,
    blocks,
  };
}

/**
 * Tahap A (plan/A-service-flow-templates.md) — 'label' and 'tanda_terima', sourced
 * directly from a service_ticket rather than a pos_invoice: at "diagnosis + price
 * given" (the print trigger, see modules/tickets/service.ts generateQuotation),
 * there is no invoice yet. Thermal-only by design (a label is a small sticker, a
 * tanda terima is handed over on the spot) — an A4 template for either is rejected
 * rather than silently mishandled, since no A4 layout for a ticket document exists
 * anywhere in this codebase.
 */
export async function renderServiceTicketDocument(
  tenantId: string,
  documentType: DocumentType,
  ticketId: string,
  requestedPaperSize?: PaperSize
): Promise<RenderedDocument> {
  if (!SUPPORTED_TICKET_DOCUMENT_TYPES.includes(documentType)) {
    throw new BusinessError('DOCUMENT_TYPE_NOT_SUPPORTED', `'${documentType}' printing is not wired to a ticket data source`, 400);
  }

  const ticket = await db.query.serviceTickets.findFirst({
    where: and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)),
    with: { tenant: true, branch: true, customer: true, customerAsset: true },
  });
  if (!ticket) throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);

  const branchAssignment = await db.query.printerAssignments.findFirst({
    where: and(
      eq(printerAssignments.tenantId, tenantId),
      eq(printerAssignments.branchId, ticket.branchId),
      eq(printerAssignments.documentType, documentType)
    ),
    with: { device: true, template: true },
  });

  interface ResolvedTemplateRef { id: string; name: string; paperSize: string; layoutConfig: unknown }
  let resolvedTemplate: ResolvedTemplateRef | null = null;
  let resolvedAssignment: RenderedDocument['assignment'] = null;

  if (requestedPaperSize) {
    if (branchAssignment && branchAssignment.template.paperSize === requestedPaperSize) {
      resolvedTemplate = branchAssignment.template;
      resolvedAssignment = {
        deviceId: branchAssignment.device.id,
        deviceName: branchAssignment.device.name,
        connectionType: branchAssignment.device.connectionType as ConnectionType,
      };
    } else {
      const fallback = await db.query.printerTemplates.findFirst({
        where: and(
          eq(printerTemplates.tenantId, tenantId),
          eq(printerTemplates.documentType, documentType),
          eq(printerTemplates.paperSize, requestedPaperSize),
          eq(printerTemplates.isDefault, true)
        ),
      });
      if (!fallback) throw new BusinessError('NO_TEMPLATE', `No ${documentType} template for paper size ${requestedPaperSize}`, 404);
      resolvedTemplate = fallback;
    }
  } else if (branchAssignment) {
    resolvedTemplate = branchAssignment.template;
    resolvedAssignment = {
      deviceId: branchAssignment.device.id,
      deviceName: branchAssignment.device.name,
      connectionType: branchAssignment.device.connectionType as ConnectionType,
    };
  } else {
    // No branch assignment and no explicit size — fall back to whichever
    // paper size the tenant's default template for this documentType uses
    // (label/tanda terima realistically only ever have one physical size in
    // practice, so unlike 'receipt' there's no genuine ambiguity to reject).
    const fallback = await db.query.printerTemplates.findFirst({
      where: and(
        eq(printerTemplates.tenantId, tenantId),
        eq(printerTemplates.documentType, documentType),
        eq(printerTemplates.isDefault, true)
      ),
    });
    if (!fallback) throw new BusinessError('NO_TEMPLATE', `No ${documentType} template configured for this tenant`, 404);
    resolvedTemplate = fallback;
  }

  const paperSize = resolvedTemplate.paperSize as PaperSize;
  if (paperSize !== '58mm' && paperSize !== '80mm') {
    throw new BusinessError('UNSUPPORTED_PAPER_SIZE', `'${documentType}' only supports thermal paper (58mm/80mm), not ${paperSize}`, 400);
  }

  const assetLabel = [ticket.customerAsset.assetType, ticket.customerAsset.brand, ticket.customerAsset.model]
    .filter(Boolean)
    .join(' ');

  const bundle: ServiceTicketBundle = {
    createdAt: ticket.createdAt.toISOString(),
    storeName: ticket.tenant.name,
    branch: { name: ticket.branch.name, address: ticket.branch.address ?? undefined },
    customerName: ticket.customer.name,
    assetLabel,
    reportedComplaint: ticket.reportedComplaint ?? '(tidak dicatat)',
    unlockCode: ticket.unlockCode ?? undefined,
    serviceMode: ticket.serviceMode,
    // approvedTotal is the cumulative quoted amount across every generateQuotation
    // cycle (including change orders, Tahap A.2) — null until the first quote.
    quotedAmount: ticket.approvedTotal !== null ? Number(ticket.approvedTotal) : undefined,
  };

  const blocks = renderTicketThermalBlocks(documentType as 'label' | 'tanda_terima', paperSize, bundle);

  return {
    documentType,
    paperSize,
    template: { id: resolvedTemplate.id, name: resolvedTemplate.name },
    assignment: resolvedAssignment,
    data: bundle,
    blocks,
  };
}
