import { Hono } from 'hono';
import { db } from '../db/connection';
import { supplierInvoices, suppliers, purchaseOrders, posInvoices, financeLedgerEntries } from '../db/schema';
import { eq, desc, and, ne, sql, gte, lte } from 'drizzle-orm';
import { zValidator } from '../lib/validator';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse, getRequestId } from '../lib/response';
import { BusinessError } from '../lib/errors';
import { roundMoney } from '../lib/money';
import { recordPaymentInput } from '../modules/finance/types';
import { recordPayment, getPayableDetail, getReceivables } from '../modules/finance/service';
import { reconcileSaleLedger } from '../lib/ledger-reconciliation';
import { findIdempotentResponse, isIdempotencyKeyConflict, replayIdempotentResponse } from '../lib/idempotency';

const financeRouter = new Hono();

financeRouter.use('*', requireAuth);

// R1.5A — every read below is gated on `finance.view_reports`. That permission
// has existed in the seed catalog since H12 and is granted to Manager, but no
// route ever called it: cashier and technician both got 200 with real revenue,
// COGS, and profit. The gate was never breached — it was never installed.
// Same defect shape as S5's unenforced stage capabilities.

// GET /v1/finance/payables
financeRouter.get('/payables', requirePermission('finance.view_reports'), async (c) => {
  const { tenantId } = getAuthContext(c);
  
  try {
    const payables = await db.query.supplierInvoices.findMany({
      where: and(
        eq(supplierInvoices.tenantId, tenantId),
        ne(supplierInvoices.status, 'paid')
      ),
      orderBy: [desc(supplierInvoices.dueDate), desc(supplierInvoices.createdAt)],
      with: {
        supplier: true,
        purchaseOrder: true
      }
    });
    
    return successResponse(c, payables);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch payables', [err.message]);
  }
});

// GET /v1/finance/payables/:id — invoice detail with its full payment history
financeRouter.get('/payables/:id', requirePermission('finance.view_reports'), async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');

  try {
    const invoice = await getPayableDetail(tenantId, id);
    return successResponse(c, invoice);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to fetch payable detail:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch payable detail', undefined, 500);
  }
});

// POST /v1/finance/payables/:id/payments — record a full or partial payment
const RECORD_PAYMENT_ENDPOINT = 'POST /v1/finance/payables/:id/payments';

financeRouter.post('/payables/:id/payments', requirePermission('finance.record_payment'), zValidator('json', recordPaymentInput), auditMiddleware({ action: 'payable.record_payment', entityType: 'supplier_invoice', entityIdParam: 'id', bodyFields: ['amount', 'paymentMethod', 'referenceNumber'] }), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const id = c.req.param('id');
  const input = c.req.valid('json');

  const idempotencyKey = c.req.header('Idempotency-Key');
  if (idempotencyKey) {
    const replay = await findIdempotentResponse(tenantId, RECORD_PAYMENT_ENDPOINT, idempotencyKey);
    if (replay) return replayIdempotentResponse(c, replay);
  }

  try {
    const result = await recordPayment(
      tenantId,
      id,
      input,
      userId,
      idempotencyKey ? { key: idempotencyKey, endpoint: RECORD_PAYMENT_ENDPOINT } : undefined,
      getRequestId(c)
    );
    return successResponse(c, result, undefined, 201);
  } catch (err) {
    if (idempotencyKey && isIdempotencyKeyConflict(err)) {
      const replay = await findIdempotentResponse(tenantId, RECORD_PAYMENT_ENDPOINT, idempotencyKey);
      if (replay) return replayIdempotentResponse(c, replay);
    }
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to record payment:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to record payment', undefined, 500);
  }
});

// GET /v1/finance/receivables — H14/FIN-003: outstanding customer debt,
// mirroring /payables. Only possible because H8 gave pos_invoices a real
// customerId FK.
// Receivables is deliberately gated on `pos.process_payment`, NOT
// `finance.view_reports`. It is the cashier's collection worklist — "who still
// owes us" is instrumental to "take their payment", and the owner's rule is
// that the cashier is the one who bills and receives money. Gating it as a
// management report would silently zero the Cashier dashboard's AR tile (P3),
// since that load path swallows non-OK responses. Technician has neither
// permission and is correctly refused.
financeRouter.get('/receivables', requirePermission('pos.process_payment'), async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const receivables = await getReceivables(tenantId);
    return successResponse(c, receivables);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch receivables', [err.message]);
  }
});

// GET /v1/finance/ledger — H11 simple ledger view (DAS-004 Simple Mode).
// No chart of accounts here on purpose — see PHASES.md Architecture Debt.
financeRouter.get('/ledger', requirePermission('finance.view_reports'), async (c) => {
  const { tenantId } = getAuthContext(c);
  const branchId = c.req.query('branchId');

  try {
    const filters = [eq(financeLedgerEntries.tenantId, tenantId)];
    if (branchId) filters.push(eq(financeLedgerEntries.branchId, branchId));

    const entries = await db
      .select()
      .from(financeLedgerEntries)
      .where(and(...filters))
      .orderBy(desc(financeLedgerEntries.postedAt))
      .limit(200);

    return successResponse(c, entries);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch ledger', [err.message]);
  }
});

// GET /v1/finance/ledger/summary — P5 (DAS-004): period revenue/COGS totals for
// the Simple/Accountant dashboard. Computed in SQL over the full date range, not
// by summing /ledger's capped 200-row list (which silently under-counts once a
// branch has more than 200 lifetime entries).
financeRouter.get('/ledger/summary', requirePermission('finance.view_reports'), async (c) => {
  const { tenantId } = getAuthContext(c);
  const branchId = c.req.query('branchId');
  const fromParam = c.req.query('from');
  const toParam = c.req.query('to');

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : now;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return errorResponse(c, 'VALIDATION_ERROR', 'Invalid from/to date', [], 400);
  }

  try {
    const filters = [
      eq(financeLedgerEntries.tenantId, tenantId),
      gte(financeLedgerEntries.postedAt, from),
      lte(financeLedgerEntries.postedAt, to),
    ];
    if (branchId) filters.push(eq(financeLedgerEntries.branchId, branchId));

    // entryType='adjustment' (AP/AR cash movement, see modules/finance/ledger.ts)
    // and the unused 'loss' type are deliberately excluded — only revenue/cogs
    // are income-statement rows. Summing 'adjustment' in here would silently
    // misstate profit with unrelated cash-movement entries.
    const [row] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${financeLedgerEntries.entryType} = 'revenue' THEN ${financeLedgerEntries.amount} ELSE 0 END), 0)`,
        cogs: sql<string>`COALESCE(SUM(CASE WHEN ${financeLedgerEntries.entryType} = 'cogs' THEN ${financeLedgerEntries.amount} ELSE 0 END), 0)`,
        entryCount: sql<string>`COUNT(*)`,
      })
      .from(financeLedgerEntries)
      .where(and(...filters));

    const revenue = roundMoney(Number(row?.revenue || 0));
    const cogs = roundMoney(Number(row?.cogs || 0));

    return successResponse(c, {
      revenue,
      cogs,
      estimatedProfit: roundMoney(revenue - cogs),
      entryCount: Number(row?.entryCount || 0),
      from: from.toISOString(),
      to: to.toISOString(),
    });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to summarize ledger', [err.message]);
  }
});

// GET /v1/finance/ledger/reconcile — H11: compares posted revenue against
// pos_invoices totals per invoice and flags any gap. Also the recovery tool
// for the commit-then-emit gap the ledger's design deliberately accepts.
financeRouter.get('/ledger/reconcile', requirePermission('finance.view_reports'), async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const invoices = await db
      .select({ id: posInvoices.id, grandTotal: posInvoices.grandTotal, status: posInvoices.status })
      .from(posInvoices)
      .where(eq(posInvoices.tenantId, tenantId));

    const revenueEntries = await db
      .select({ referenceId: financeLedgerEntries.referenceId, amount: financeLedgerEntries.amount })
      .from(financeLedgerEntries)
      .where(
        and(
          eq(financeLedgerEntries.tenantId, tenantId),
          eq(financeLedgerEntries.entryType, 'revenue'),
          eq(financeLedgerEntries.referenceType, 'pos_sale')
        )
      );

    const gaps = reconcileSaleLedger(
      invoices.map((i) => ({ id: i.id, grandTotal: Number(i.grandTotal), status: i.status })),
      revenueEntries
        .filter((e): e is { referenceId: string; amount: string } => e.referenceId !== null)
        .map((e) => ({ referenceId: e.referenceId, amount: Number(e.amount) }))
    );

    return successResponse(c, { isClean: gaps.length === 0, gaps });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reconcile ledger', [err.message]);
  }
});

export { financeRouter };
