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
import { INVOICE_DISPLAY_MODES, type InvoiceDisplayMode } from '../modules/printer/types.js';

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

// Tahap A — invoice display mode (Detailed/Summary/Flexible). Stored in the
// existing tenants.settings jsonb (already used for simplifiedFinanceMode) —
// no new column/table. Same admin gate as /company: one small tenant-wide
// knob doesn't warrant its own permission code.
settingsRouter.get('/sales', requirePermission('settings.manage_company'), async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) return errorResponse(c, 'NOT_FOUND', 'Tenant not found', [], 404);

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    const raw = settings.invoiceDisplayMode;
    const invoiceDisplayMode: InvoiceDisplayMode = (INVOICE_DISPLAY_MODES as readonly string[]).includes(raw as string)
      ? (raw as InvoiceDisplayMode)
      : 'detailed';

    return successResponse(c, { invoiceDisplayMode });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch sales settings', [err.message]);
  }
});

const updateSalesSchema = z.object({
  invoiceDisplayMode: z.enum(INVOICE_DISPLAY_MODES),
});

settingsRouter.patch('/sales', requirePermission('settings.manage_company'), zValidator('json', updateSalesSchema), auditMiddleware({ action: 'settings.update_sales', entityType: 'tenant', bodyFields: ['invoiceDisplayMode'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  try {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) return errorResponse(c, 'NOT_FOUND', 'Tenant not found', [], 404);

    const settings = { ...(tenant.settings as Record<string, unknown> ?? {}), invoiceDisplayMode: data.invoiceDisplayMode };
    await db.update(tenants).set({ settings, updatedAt: new Date() }).where(eq(tenants.id, tenantId));

    return successResponse(c, { invoiceDisplayMode: data.invoiceDisplayMode });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update sales settings', [err.message], 500);
  }
});

// GET /v1/settings/payment-methods
// Returns all payment methods for the tenant (active + inactive; the POS
// filters to active ones itself). Readable by ANY authenticated user — the
// cashier needs this list at checkout — so it is deliberately not gated by
// `payment.manage` (only the mutations below are).
settingsRouter.get('/payment-methods', async (c) => {
  const { tenantId } = getAuthContext(c);
  if (!tenantId) return errorResponse(c, 'UNAUTHORIZED', 'Missing tenant context', undefined, 401);

  try {
    const methods = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.tenantId, tenantId),
      orderBy: (pm, { asc }) => [asc(pm.name)],
    });

    return successResponse(c, methods);
  } catch (e: any) {
    console.error('Failed to fetch payment methods', e);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Failed to fetch payment methods');
  }
});

// Tahap A (go-live gap Tier-1 #4) — payment-method CRUD. `type` is the finite
// category the POS/checkout keys off; 'split' is a checkout-only concept, not a
// real tender, so it is not creatable here.
const PAYMENT_TYPES = ['cash', 'transfer', 'qris', 'ewallet', 'tempo'] as const;

const createPaymentMethodSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(PAYMENT_TYPES),
  isActive: z.boolean().optional(),
});

settingsRouter.post('/payment-methods', requirePermission('payment.manage'), zValidator('json', createPaymentMethodSchema), auditMiddleware({ action: 'payment_method.create', entityType: 'payment_method', bodyFields: ['name', 'type', 'isActive'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  try {
    const [method] = await db.insert(paymentMethods).values({
      tenantId,
      name: data.name,
      type: data.type,
      isActive: data.isActive ?? true,
    }).returning();

    return successResponse(c, method, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create payment method', [err.message], 500);
  }
});

const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(PAYMENT_TYPES).optional(),
  isActive: z.boolean().optional(),
});

settingsRouter.patch('/payment-methods/:id', requirePermission('payment.manage'), zValidator('json', updatePaymentMethodSchema), auditMiddleware({ action: 'payment_method.update', entityType: 'payment_method', entityIdParam: 'id', bodyFields: ['name', 'type', 'isActive'] }), async (c) => {
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
