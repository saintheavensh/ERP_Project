import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '../lib/validator';
import { db } from '../db/connection';
import { deviceBrands, deviceModels, customerAssets, customers } from '../db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
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

/**
 * GET /v1/device-catalog/uncatalogued — unit yang pernah masuk lewat Terima
 * Unit tapi tidak cocok ke katalog device.
 *
 * R1.8-T5, pasangan wajib dari T1. Pemilik (2026-08-02): "nantinya dapat pesan
 * notifikasi pada device katalog bahwa ada unit service yang masih belum ada
 * katalognya". Tanpa ini, "boleh ketik bebas" pelan-pelan berubah jadi katalog
 * yang ditinggalkan: tiap unit tak dikenal masuk sebagai teks, tak ada yang
 * tahu, dan setahun lagi katalognya tak mewakili apa pun yang masuk ke toko.
 *
 * TIDAK ADA KOLOM BARU. Datanya sudah terekam bentuknya sejak Tahap A:
 * `customer_assets` yang merek/model-nya terisi tapi `device_model_id`-nya
 * NULL persis berarti "unit masuk tanpa katalog" — `routes/tickets.ts` memang
 * menjatuhkan id yang tak cocok alih-alih menolak intake-nya.
 *
 * Digerbangi `catalog.manage` (izin yang sudah ada, bukan baru): ini pekerjaan
 * admin katalog, bukan bacaan kasir.
 *
 * Dikelompokkan per (merek, model) dan diurutkan dari yang paling sering
 * muncul — yang sering datang itulah yang paling layak dimasukkan katalog.
 */
deviceCatalogRouter.get('/uncatalogued', requirePermission('catalog.manage'), async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const rows = await db
      .select({
        brand: customerAssets.brand,
        model: customerAssets.model,
        assetType: sql<string>`min(${customerAssets.assetType})`,
        jumlah: sql<number>`count(*)::int`,
      })
      .from(customerAssets)
      // customer_assets tidak punya tenant_id sendiri; kepemilikannya lewat
      // customers. Tanpa join ini, satu toko bisa melihat unit toko lain.
      .innerJoin(customers, eq(customerAssets.customerId, customers.id))
      .where(and(
        eq(customers.tenantId, tenantId),
        isNull(customerAssets.deviceModelId),
        // Merek/model kosong bukan "belum ada di katalog" — itu data lama dari
        // sebelum T1 mewajibkannya. Menampilkannya cuma jadi baris hampa yang
        // tak bisa ditindaklanjuti.
        sql`coalesce(trim(${customerAssets.brand}), '') <> ''`,
        sql`coalesce(trim(${customerAssets.model}), '') <> ''`,
        // `device_model_id` NULL saja TIDAK cukup untuk berkata "belum ada di
        // katalog". Kolom itu hanya terisi bila kasir memilih dari autocomplete;
        // mengetik "Samsung Galaxy A10" sendiri tetap menghasilkan NULL walau
        // modelnya jelas-jelas ada di katalog. Tanpa pemeriksaan teks ini,
        // panelnya menyuruh admin menambahkan yang sudah ada — panel yang
        // berbohong, dan itu lebih buruk daripada tidak ada panel.
        sql`not exists (
          select 1 from ${deviceModels} dm
          join ${deviceBrands} db on db.id = dm.device_brand_id
          where db.tenant_id = ${tenantId}
            and lower(trim(db.name)) = lower(trim(${customerAssets.brand}))
            and lower(trim(dm.name)) = lower(trim(${customerAssets.model}))
        )`,
      ))
      .groupBy(customerAssets.brand, customerAssets.model)
      .orderBy(sql`count(*) desc`, customerAssets.brand)
      .limit(50);

    return successResponse(c, rows);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch uncatalogued devices', [err.message]);
  }
});

// GET /v1/device-catalog/brands — brands with their models nested, tenant-scoped.
// Open to any authenticated user: the intake form needs this list.
deviceCatalogRouter.get('/brands', async (c) => {
  const { tenantId } = getAuthContext(c);
  const q = c.req.query('q');

  try {
    // Lightweight brand autocomplete (intake): return just id/name, never nest
    // the (potentially thousands of) models. The no-`q` path below keeps the
    // nested shape the /devices admin page relies on.
    if (q !== undefined) {
      const rows = await db
        .select({ id: deviceBrands.id, name: deviceBrands.name })
        .from(deviceBrands)
        .where(and(eq(deviceBrands.tenantId, tenantId), sql`${deviceBrands.name} ILIKE ${'%' + q.trim() + '%'}`))
        .orderBy(deviceBrands.name)
        .limit(20);
      return successResponse(c, rows);
    }
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
  const brandId = c.req.query('brandId')?.trim();

  try {
    const rows = await db
      .select({
        id: deviceModels.id,
        name: deviceModels.name,
        imageUrl: deviceModels.imageUrl,
        specs: deviceModels.specs,
        deviceBrandId: deviceModels.deviceBrandId,
        brandName: deviceBrands.name,
      })
      .from(deviceModels)
      .innerJoin(deviceBrands, eq(deviceModels.deviceBrandId, deviceBrands.id))
      .where(
        and(
          eq(deviceBrands.tenantId, tenantId),
          // When the intake form has a chosen brand, scope models to it so the
          // Model autocomplete only shows that brand's models. `q` then matches
          // the model name within the brand; with no brand it matches the
          // combined "<brand> <model>" string (both fields feed one search).
          brandId ? eq(deviceModels.deviceBrandId, brandId) : undefined,
          q ? sql`(${deviceBrands.name} || ' ' || ${deviceModels.name}) ILIKE ${'%' + q + '%'}` : undefined,
        )
      )
      .orderBy(deviceBrands.name, deviceModels.name)
      .limit(20);

    return successResponse(c, rows);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to search device models', [err.message]);
  }
});

const specsSchema = z.record(z.string(), z.string()).nullish();
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
