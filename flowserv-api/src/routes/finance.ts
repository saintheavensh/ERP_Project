import { Hono } from 'hono';
import { db } from '../db/connection';
import { supplierInvoices, suppliers, purchaseOrders, posInvoices, financeLedgerEntries } from '../db/schema';
import { eq, desc, and, ne, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { successResponse, errorResponse } from '../lib/response';
import { BusinessError } from '../lib/errors';
import { recordPaymentInput } from '../modules/finance/types';
import { recordPayment, getPayableDetail } from '../modules/finance/service';
import { reconcileSaleLedger } from '../lib/ledger-reconciliation';

const financeRouter = new Hono();

financeRouter.use('*', requireAuth);

// GET /v1/finance/payables
financeRouter.get('/payables', async (c) => {
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
financeRouter.get('/payables/:id', async (c) => {
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
financeRouter.post('/payables/:id/payments', requirePermission('finance.record_payment'), zValidator('json', recordPaymentInput), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const id = c.req.param('id');
  const input = c.req.valid('json');

  try {
    const result = await recordPayment(tenantId, id, input, userId);
    return successResponse(c, result, undefined, 201);
  } catch (err) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    console.error('Failed to record payment:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to record payment', undefined, 500);
  }
});

// GET /v1/finance/ledger — H11 simple ledger view (DAS-004 Simple Mode).
// No chart of accounts here on purpose — see PHASES.md Architecture Debt.
financeRouter.get('/ledger', async (c) => {
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

// GET /v1/finance/ledger/reconcile — H11: compares posted revenue against
// pos_invoices totals per invoice and flags any gap. Also the recovery tool
// for the commit-then-emit gap the ledger's design deliberately accepts.
financeRouter.get('/ledger/reconcile', async (c) => {
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
