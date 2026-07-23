import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection.js';
import { paymentMethods, tenants } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../lib/response.js';
import { requireAuth, getAuthContext } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { auditMiddleware } from '../middleware/audit.js';

export const settingsRouter = new Hono();
settingsRouter.use('*', requireAuth);

// P9.3 — Settings CRUD (5.10). Scoped to what the schema actually has:
// `tenants.name`. Logo/address/contact from the SET-002 spec row don't exist
// as columns — inventing them here would be exactly the speculative-schema
// mistake F6 deleted (warranty_records). subscriptionTier/status are
// platform-level, not tenant-admin-editable, so GET returns them read-only
// and PATCH doesn't accept them.
settingsRouter.get('/company', requirePermission('settings.manage_company'), async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) return errorResponse(c, 'NOT_FOUND', 'Tenant not found', [], 404);

    return successResponse(c, {
      id: tenant.id,
      name: tenant.name,
      subscriptionTier: tenant.subscriptionTier,
      status: tenant.status,
      createdAt: tenant.createdAt,
    });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch company profile', [err.message]);
  }
});

const updateCompanySchema = z.object({
  name: z.string().min(1),
});

settingsRouter.patch('/company', requirePermission('settings.manage_company'), zValidator('json', updateCompanySchema), auditMiddleware({ action: 'settings.update_company', entityType: 'tenant', bodyFields: ['name'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  try {
    const [updated] = await db.update(tenants)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))
      .returning({ id: tenants.id, name: tenants.name, subscriptionTier: tenants.subscriptionTier, status: tenants.status });

    return successResponse(c, updated);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update company profile', [err.message], 500);
  }
});

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
