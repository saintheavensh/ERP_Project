import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection.js';
import { paymentMethods, tenants } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
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
// Returns ALL payment methods (active + inactive) for the tenant — no
// permission gate, since the POS checkout screen needs this for every
// cashier, not just admins. The POS-consuming side is responsible for
// filtering to isActive (see pos.checkout.svelte.ts); this endpoint stays
// the single source both callers share, same as the settings page which
// needs inactive rows visible so an admin can reactivate them.
settingsRouter.get('/payment-methods', async (c) => {
  const { tenantId } = getAuthContext(c);
  if (!tenantId) return errorResponse(c, 'UNAUTHORIZED', 'Missing tenant context', undefined, 401);

  try {
    const methods = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.tenantId, tenantId),
      orderBy: (paymentMethods, { asc }) => [asc(paymentMethods.name)],
    });

    return successResponse(c, methods);
  } catch (e: any) {
    console.error('Failed to fetch payment methods', e);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Failed to fetch payment methods');
  }
});

// Tahap A (go-live plan tier 1 item 4) — CRUD closing the gap the read-only
// P9 tab left open. 'type' is restricted to the four buckets a cashier can
// actually pick at checkout ('split' is a system-computed settlement shape
// for multi-method checkouts, never a named method someone creates here —
// see enums.ts's comment on paymentMethodEnum).
const paymentMethodTypeSchema = z.enum(['cash', 'transfer', 'qris', 'tempo']);

const createPaymentMethodSchema = z.object({
  name: z.string().min(1).max(50),
  type: paymentMethodTypeSchema,
  isActive: z.boolean().optional(),
});

settingsRouter.post('/payment-methods', requirePermission('settings.manage_payment_methods'), zValidator('json', createPaymentMethodSchema), auditMiddleware({ action: 'settings.create_payment_method', entityType: 'payment_method', bodyFields: ['name', 'type', 'isActive'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  try {
    const [created] = await db.insert(paymentMethods).values({
      tenantId,
      name: data.name,
      type: data.type,
      isActive: data.isActive ?? true,
    }).returning();

    return successResponse(c, created, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create payment method', [err.message], 500);
  }
});

const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: paymentMethodTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

settingsRouter.patch('/payment-methods/:id', requirePermission('settings.manage_payment_methods'), zValidator('json', updatePaymentMethodSchema), auditMiddleware({ action: 'settings.update_payment_method', entityType: 'payment_method', entityIdParam: 'id', bodyFields: ['name', 'type', 'isActive'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const existing = await db.query.paymentMethods.findFirst({
      where: and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, tenantId)),
    });
    if (!existing) return errorResponse(c, 'NOT_FOUND', 'Payment method not found', [], 404);

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.type !== undefined) patch.type = data.type;
    if (data.isActive !== undefined) patch.isActive = data.isActive;

    if (Object.keys(patch).length === 0) return successResponse(c, existing);

    const [updated] = await db.update(paymentMethods)
      .set(patch)
      .where(and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, tenantId)))
      .returning();

    return successResponse(c, updated);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update payment method', [err.message], 500);
  }
});
