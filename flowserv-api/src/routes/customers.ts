import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection';
import { customers, customerAssets } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { successResponse, errorResponse } from '../lib/response';

const customersRouter = new Hono();
customersRouter.use('*', requireAuth);

const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
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
customersRouter.post('/', requirePermission('customer.manage'), zValidator('json', createCustomerSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');
  
  const result = await db.insert(customers).values({
    tenantId,
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
  }).returning();
  
  return successResponse(c, result[0], undefined, 201);
});

// Edit customer
const editCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
});

customersRouter.put('/:id', requirePermission('customer.manage'), zValidator('json', editCustomerSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const customerId = c.req.param('id');
  const data = c.req.valid('json');
  
  const cust = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));
  if (cust.length === 0) {
    return errorResponse(c, 'NOT_FOUND', 'Customer not found', [], 404);
  }
  
  const result = await db.update(customers).set({
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
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
customersRouter.post('/:id/assets', requirePermission('customer.manage'), zValidator('json', createAssetSchema), async (c) => {
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
