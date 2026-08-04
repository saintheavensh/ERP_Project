import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '../lib/validator';
import { db } from '../db/connection';
import { customers, customerAssets } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission, enforcePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';

const customersRouter = new Hono();
customersRouter.use('*', requireAuth);

const customerTypeEnum = z.enum(['service', 'sparepart']); // Tahap-B

const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  allowTempo: z.boolean().optional(), // D1 — izin utang; default false di DB
  customerType: customerTypeEnum.optional(), // Tahap-B — default 'service' di DB
});

// List customers
customersRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  
  const results = await db
    .select()
    .from(customers)
    .where(eq(customers.tenantId, tenantId))
    .orderBy(customers.createdAt);
    
  return successResponse(c, results);
});

// Get single customer
customersRouter.get('/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const customerId = c.req.param('id');
  
  const results = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));
    
  if (results.length === 0) {
    return errorResponse(c, 'NOT_FOUND', 'Customer not found', [], 404);
  }
  
  return successResponse(c, results[0]);
});

// Create customer
customersRouter.post('/', requirePermission('customer.manage'), zValidator('json', createCustomerSchema), auditMiddleware({ action: 'customer.create', entityType: 'customer', bodyFields: ['name', 'phone', 'email', 'allowTempo', 'customerType'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  // R1.9-T1b — memberi hak utang butuh `customer.allow_tempo`, bukan sekadar
  // `customer.manage`. Kondisional (pola D2 `pos.apply_discount`): hanya
  // diperiksa saat pelanggan benar-benar dibuat DENGAN hak tempo, jadi kasir
  // tetap bisa mendaftarkan pelanggan walk-in seperti biasa.
  if (data.allowTempo === true) {
    const blocked = await enforcePermission(c, 'customer.allow_tempo');
    if (blocked) return blocked;
  }

  // R1.10-T4 — kategori pelanggan, pola yang sama persis. Kondisional terhadap
  // DEFAULT ('service'), bukan terhadap "ada di payload": form selalu mengirim
  // kolom ini, jadi memeriksa keberadaannya akan memblokir kasir mendaftarkan
  // pelanggan biasa — bug yang R1.9-T1b sudah hindari sekali.
  if (data.customerType !== undefined && data.customerType !== 'service') {
    const blocked = await enforcePermission(c, 'customer.set_category');
    if (blocked) return blocked;
  }

  const result = await db.insert(customers).values({
    tenantId,
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    allowTempo: data.allowTempo ?? false,
    customerType: data.customerType ?? 'service',
  }).returning();

  return successResponse(c, result[0], undefined, 201);
});

// Edit customer
const editCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  allowTempo: z.boolean().optional(), // D1 — izin utang per pelanggan
  customerType: customerTypeEnum.optional(), // Tahap-B — kategori pelanggan
});

customersRouter.put('/:id', requirePermission('customer.manage'), zValidator('json', editCustomerSchema), auditMiddleware({ action: 'customer.update', entityType: 'customer', entityIdParam: 'id', bodyFields: ['name', 'phone', 'email', 'allowTempo', 'customerType'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const customerId = c.req.param('id');
  const data = c.req.valid('json');
  
  const cust = await db.select({ id: customers.id, allowTempo: customers.allowTempo, customerType: customers.customerType }).from(customers).where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));
  if (cust.length === 0) {
    return errorResponse(c, 'NOT_FOUND', 'Customer not found', [], 404);
  }

  // R1.9-T1b — diperiksa hanya bila nilainya BENAR-BENAR berubah. Form
  // pelanggan mengirim seluruh objek tiap simpan, jadi memeriksa
  // "allowTempo ada di payload" akan memblokir kasir yang cuma membetulkan
  // nomor telepon. Membandingkan ke nilai tersimpan yang baru saja diambil di
  // atas membuat gerbangnya persis sesempit wewenang yang dimaksud.
  if (data.allowTempo !== undefined && data.allowTempo !== cust[0].allowTempo) {
    const blocked = await enforcePermission(c, 'customer.allow_tempo');
    if (blocked) return blocked;
  }

  // R1.10-T4 — kategori pelanggan. Dibandingkan ke nilai TERSIMPAN dengan
  // alasan yang sama seperti tempo di atas: kasir yang cuma membetulkan nomor
  // telepon mengirim kategori yang tidak berubah, dan ia tidak boleh ikut
  // terblokir. Pemilik (uji-R1.9 A1): "kategorinya readonly hanya bisa di edit
  // oleh manager".
  if (data.customerType !== undefined && data.customerType !== cust[0].customerType) {
    const blocked = await enforcePermission(c, 'customer.set_category');
    if (blocked) return blocked;
  }

  const result = await db.update(customers).set({
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    ...(data.allowTempo !== undefined ? { allowTempo: data.allowTempo } : {}),
    ...(data.customerType !== undefined ? { customerType: data.customerType } : {}),
  }).where(eq(customers.id, customerId)).returning();
  
  return successResponse(c, result[0]);
});

// ==========================================
// CUSTOMER ASSETS (DEVICES)
// ==========================================

const createAssetSchema = z.object({
  assetType: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
});

// Get assets for customer
customersRouter.get('/:id/assets', async (c) => {
  const { tenantId } = getAuthContext(c);
  const customerId = c.req.param('id');
  
  // Verify customer belongs to tenant
  const cust = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));
  if (cust.length === 0) {
    return errorResponse(c, 'NOT_FOUND', 'Customer not found', [], 404);
  }
  
  const results = await db
    .select()
    .from(customerAssets)
    .where(eq(customerAssets.customerId, customerId));
    
  return successResponse(c, results);
});

// Register new asset for customer
customersRouter.post('/:id/assets', requirePermission('customer.manage'), zValidator('json', createAssetSchema), auditMiddleware({ action: 'customer.add_asset', entityType: 'customer_asset', bodyFields: ['assetType', 'brand', 'model', 'serialNumber'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const customerId = c.req.param('id');
  const data = c.req.valid('json');
  
  // Verify customer belongs to tenant
  const cust = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));
  if (cust.length === 0) {
    return errorResponse(c, 'NOT_FOUND', 'Customer not found', [], 404);
  }
  
  const result = await db.insert(customerAssets).values({
    customerId,
    assetType: data.assetType,
    brand: data.brand || null,
    model: data.model || null,
    serialNumber: data.serialNumber || null,
  }).returning();
  
  return successResponse(c, result[0], undefined, 201);
});

export { customersRouter };
