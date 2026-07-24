import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection';
import { deviceBrands, deviceModels } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';

// Tahap A — device_brands/device_models existed in the schema (DEV-008,
// sparepart compatibility) but had ZERO routes — only ever created via seed.
// This is the first CRUD surface for them, now reused for the device catalog
// (image/specs/suggested services) feature too. See
// plan/tahap-a-device-catalog-invoice-mode.md for why this extends the
// existing tenant-scoped table instead of a new one.
export const deviceCatalogRouter = new Hono();
deviceCatalogRouter.use('*', requireAuth);

// GET /v1/device-catalog/brands — brands with their models nested, tenant-scoped.
// Open to any authenticated user: the intake form needs this list.
deviceCatalogRouter.get('/brands', async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const brands = await db.query.deviceBrands.findMany({
      where: eq(deviceBrands.tenantId, tenantId),
      with: { deviceModels: true },
      orderBy: (b, { asc }) => [asc(b.name)],
    });
    return successResponse(c, brands);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch device brands', [err.message]);
  }
});

const createBrandSchema = z.object({ name: z.string().min(1).max(100) });

deviceCatalogRouter.post('/brands', requirePermission('inventory.manage_items'), zValidator('json', createBrandSchema), auditMiddleware({ action: 'device_brand.create', entityType: 'device_brand', bodyFields: ['name'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const { name } = c.req.valid('json');

  try {
    const [brand] = await db.insert(deviceBrands).values({ tenantId, name }).returning();
    return successResponse(c, brand, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create device brand', [err.message], 500);
  }
});

// GET /v1/device-catalog/models?q=... — search by brand+model name, for the
// intake autocomplete. Tenant-scoped via a join back to deviceBrands (this
// table itself carries no tenantId — same shape as productCompatibility).
deviceCatalogRouter.get('/models', async (c) => {
  const { tenantId } = getAuthContext(c);
  const q = c.req.query('q')?.trim();

  try {
    const rows = await db
      .select({
        id: deviceModels.id,
        name: deviceModels.name,
        imageUrl: deviceModels.imageUrl,
        specs: deviceModels.specs,
        suggestedServices: deviceModels.suggestedServices,
        deviceBrandId: deviceModels.deviceBrandId,
        brandName: deviceBrands.name,
      })
      .from(deviceModels)
      .innerJoin(deviceBrands, eq(deviceModels.deviceBrandId, deviceBrands.id))
      .where(
        // The intake form sends "<assetBrand> <assetModel>" as one combined
        // query string (both fields feed the same search), so matching must
        // be against the concatenation — matching each field separately
        // against the whole combined string would never hit (neither "Samsung"
        // nor "Galaxy A10" alone contains "Samsung Galaxy A10").
        q
          ? and(eq(deviceBrands.tenantId, tenantId), sql`(${deviceBrands.name} || ' ' || ${deviceModels.name}) ILIKE ${'%' + q + '%'}`)
          : eq(deviceBrands.tenantId, tenantId)
      )
      .orderBy(deviceBrands.name, deviceModels.name)
      .limit(20);

    return successResponse(c, rows);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to search device models', [err.message]);
  }
});

const specsSchema = z.record(z.string(), z.string()).nullish();
const suggestedServicesSchema = z.array(z.string().min(1)).nullish();
// Either a full external URL (the hand-seeded demo entries) or a relative
// path our own upload endpoint / the bulk import returns ("/uploads/...").
// z.string().url() alone would reject every relative path, which is exactly
// what POST /v1/uploads and the device-catalog import produce.
const imageUrlSchema = z.string().refine((v) => v.startsWith('http') || v.startsWith('/'), {
  message: 'imageUrl must be an absolute URL or a path starting with /',
}).nullish();

const createModelSchema = z.object({
  deviceBrandId: z.string().uuid(),
  name: z.string().min(1).max(100),
  imageUrl: imageUrlSchema,
  specs: specsSchema,
  suggestedServices: suggestedServicesSchema,
});

deviceCatalogRouter.post('/models', requirePermission('inventory.manage_items'), zValidator('json', createModelSchema), auditMiddleware({ action: 'device_model.create', entityType: 'device_model', bodyFields: ['deviceBrandId', 'name', 'imageUrl'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  try {
    const brand = await db.query.deviceBrands.findFirst({
      where: and(eq(deviceBrands.id, data.deviceBrandId), eq(deviceBrands.tenantId, tenantId)),
    });
    if (!brand) return errorResponse(c, 'NOT_FOUND', 'Device brand not found', [], 404);

    const [model] = await db.insert(deviceModels).values({
      deviceBrandId: data.deviceBrandId,
      name: data.name,
      imageUrl: data.imageUrl ?? null,
      specs: data.specs ?? null,
      suggestedServices: data.suggestedServices ?? null,
    }).returning();

    return successResponse(c, model, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create device model', [err.message], 500);
  }
});

const updateModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  imageUrl: imageUrlSchema,
  specs: specsSchema,
  suggestedServices: suggestedServicesSchema,
});

deviceCatalogRouter.patch('/models/:id', requirePermission('inventory.manage_items'), zValidator('json', updateModelSchema), auditMiddleware({ action: 'device_model.update', entityType: 'device_model', entityIdParam: 'id' }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');
  const data = c.req.valid('json');

  try {
    // Tenant scoping via the brand join — deviceModels itself has no tenantId column.
    const existing = await db
      .select({ id: deviceModels.id })
      .from(deviceModels)
      .innerJoin(deviceBrands, eq(deviceModels.deviceBrandId, deviceBrands.id))
      .where(and(eq(deviceModels.id, id), eq(deviceBrands.tenantId, tenantId)));
    if (existing.length === 0) return errorResponse(c, 'NOT_FOUND', 'Device model not found', [], 404);

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
    if (data.specs !== undefined) patch.specs = data.specs;
    if (data.suggestedServices !== undefined) patch.suggestedServices = data.suggestedServices;
    if (Object.keys(patch).length === 0) {
      const current = await db.query.deviceModels.findFirst({ where: eq(deviceModels.id, id) });
      return successResponse(c, current);
    }

    const [updated] = await db.update(deviceModels).set(patch).where(eq(deviceModels.id, id)).returning();
    return successResponse(c, updated);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update device model', [err.message], 500);
  }
});
