import { Hono } from 'hono';
import { db } from '../db/connection';
import { supplierInvoices, suppliers, purchaseOrders } from '../db/schema';
import { eq, desc, and, ne, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';

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

export { financeRouter };
