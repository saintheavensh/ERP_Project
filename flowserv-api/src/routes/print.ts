import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '../lib/validator';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';
import { BusinessError } from '../lib/errors';
import { DOCUMENT_TYPES, PAPER_SIZES } from '../modules/printer/types';
import { renderPosInvoiceDocument } from '../modules/printer/document';
import { renderTicketDocument } from '../modules/printer/ticket-document';

// Tahap A — 'label'/'tanda_terima' are ticket-sourced (printed at diagnosis,
// before any invoice exists); 'receipt'/'invoice_a4' are pos_invoice-sourced.
// The `:id` path param means different things depending on documentType --
// this is the one place that distinction is made.
const TICKET_SOURCED_TYPES = new Set(['label', 'tanda_terima']);

// 6A.4 — deliberately NOT gated by printer.manage: whoever can see an
// invoice (a cashier at checkout, a technician handing over a repair) needs
// to be able to print it. Tenant + invoice-ownership scoping inside
// renderPosInvoiceDocument() is what actually protects this, same as
// GET /v1/pos/invoices requiring only requireAuth.
const printRouter = new Hono();
printRouter.use('*', requireAuth);

const paramsSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  id: z.string().uuid(),
});

const querySchema = z.object({
  paperSize: z.enum(PAPER_SIZES).optional(),
});

printRouter.get(
  '/documents/:documentType/:id',
  zValidator('param', paramsSchema),
  zValidator('query', querySchema),
  async (c) => {
    const { tenantId } = getAuthContext(c);
    const { documentType, id } = c.req.valid('param');
    const { paperSize } = c.req.valid('query');

    try {
      const rendered = TICKET_SOURCED_TYPES.has(documentType)
        ? await renderTicketDocument(tenantId, documentType, id, paperSize)
        : await renderPosInvoiceDocument(tenantId, documentType, id, paperSize);
      return successResponse(c, rendered);
    } catch (err) {
      if (err instanceof BusinessError) {
        return errorResponse(c, err.code, err.message, err.details, err.statusCode);
      }
      console.error('Failed to render print document:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to render print document', undefined, 500);
    }
  }
);

export { printRouter };
