import { Hono } from 'hono';
import { db } from '../db/connection';
import { supplierInvoices, suppliers, purchaseOrders } from '../db/schema';
import { eq, desc, and, ne, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';
import { BusinessError } from '../lib/errors';
import { recordPaymentInput } from '../modules/finance/types';
import { recordPayment, getPayableDetail } from '../modules/finance/service';

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
financeRouter.post('/payables/:id/payments', zValidator('json', recordPaymentInput), async (c) => {
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

export { financeRouter };
