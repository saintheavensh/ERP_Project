import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { paymentMethods } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../lib/response.js';
import { requireAuth, getAuthContext } from '../middleware/auth.js';

export const settingsRouter = new Hono();
settingsRouter.use('*', requireAuth);

// GET /v1/settings/payment-methods
// Returns all active payment methods for the tenant
settingsRouter.get('/payment-methods', async (c) => {
  const { tenantId } = getAuthContext(c);
  if (!tenantId) return errorResponse(c, 'UNAUTHORIZED', 'Missing tenant context', undefined, 401);

  try {
    const methods = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.tenantId, tenantId),
      // order by can be added if needed, e.g., name or type
    });
    
    // For now, if no methods found, we can return empty or a default set (will be populated by seed)
    return successResponse(c, methods);
  } catch (e: any) {
    console.error('Failed to fetch payment methods', e);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Failed to fetch payment methods');
  }
});
