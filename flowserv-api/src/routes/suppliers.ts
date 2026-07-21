import { Hono } from 'hono';
import { db } from '../db/connection';
import { suppliers, supplierBrands } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { successResponse, errorResponse } from '../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const suppliersRouter = new Hono();

// All routes require authentication
suppliersRouter.use('*', requireAuth);

// GET /v1/suppliers
suppliersRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  
  try {
    const data = await db.select()
      .from(suppliers)
      .where(eq(suppliers.tenantId, tenantId))
      .orderBy(desc(suppliers.name));
      
    return successResponse(c, data);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch suppliers', [err.message]);
  }
});

// GET /v1/suppliers/:id
suppliersRouter.get('/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const supplierId = c.req.param('id');
  
  try {
    const data = await db.query.suppliers.findFirst({
      where: and(
        eq(suppliers.id, supplierId),
        eq(suppliers.tenantId, tenantId)
      ),
      with: {
        supplierBrands: {
          with: {
            partBrand: true
          }
        }
      }
    });
    
    if (!data) {
      return errorResponse(c, 'NOT_FOUND', 'Supplier not found', [], 404);
    }
      
    return successResponse(c, data);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch supplier', [err.message]);
  }
});

// POST /v1/suppliers/:id/brands
const linkBrandSchema = z.object({
  brandId: z.string().uuid()
});

suppliersRouter.post('/:id/brands', requirePermission('supplier.manage'), zValidator('json', linkBrandSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const supplierId = c.req.param('id');
  const { brandId } = c.req.valid('json');
  
  try {
    const [linked] = await db.insert(supplierBrands)
      .values({
        tenantId,
        supplierId,
        partBrandId: brandId
      })
      .returning();
      
    return successResponse(c, linked, undefined, 201);
  } catch (err: any) {
    if (err.code === '23505') {
      return errorResponse(c, 'CONFLICT', 'Brand is already linked to this supplier', [], 409);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to link brand', [err.message]);
  }
});

// DELETE /v1/suppliers/:id/brands/:brandId
suppliersRouter.delete('/:id/brands/:brandId', requirePermission('supplier.manage'), async (c) => {
  const { tenantId } = getAuthContext(c);
  const supplierId = c.req.param('id');
  const brandId = c.req.param('brandId');
  
  try {
    await db.delete(supplierBrands).where(
      and(
        eq(supplierBrands.supplierId, supplierId),
        eq(supplierBrands.partBrandId, brandId),
        eq(supplierBrands.tenantId, tenantId)
      )
    );
    return successResponse(c, { deleted: true });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to remove brand link', [err.message]);
  }
});

// POST /v1/suppliers
const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  contactInfo: z.string().optional(),
  photoUrl: z.string().optional(),
  type: z.enum(['wholesale', 'retailer']).default('wholesale'),
  paymentTermDays: z.number().default(0),
  returnPolicyDays: z.number().optional(),
  warrantyPolicyDays: z.number().optional(),
  returnWarrantyNotes: z.string().optional()
});

suppliersRouter.post('/', requirePermission('supplier.manage'), zValidator('json', supplierSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');
  
  try {
    const [newSupplier] = await db.insert(suppliers)
      .values({
        tenantId,
        ...data
      })
      .returning();
      
    return successResponse(c, newSupplier, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create supplier', [err.message]);
  }
});

// PUT /v1/suppliers/:id
suppliersRouter.put('/:id', requirePermission('supplier.manage'), zValidator('json', supplierSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const supplierId = c.req.param('id');
  const data = c.req.valid('json');
  
  try {
    const [updatedSupplier] = await db.update(suppliers)
      .set(data)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)))
      .returning();
      
    if (!updatedSupplier) {
      return errorResponse(c, 'NOT_FOUND', 'Supplier not found', [], 404);
    }
      
    return successResponse(c, updatedSupplier);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update supplier', [err.message]);
  }
});

// DELETE /v1/suppliers/:id
suppliersRouter.delete('/:id', requirePermission('supplier.manage'), async (c) => {
  const { tenantId } = getAuthContext(c);
  const supplierId = c.req.param('id');
  
  try {
    // Delete the supplier if it exists and belongs to the tenant.
    // Drizzle will throw an error if it's referenced by stockBatches or purchaseOrders due to foreign key constraints.
    await db.delete(suppliers).where(
      and(
        eq(suppliers.id, supplierId),
        eq(suppliers.tenantId, tenantId)
      )
    );
    return successResponse(c, { deleted: true });
  } catch (err: any) {
    if (err.code === '23503') { // Foreign key constraint violation
      return errorResponse(c, 'CONFLICT', 'Cannot delete supplier because it is referenced in purchase orders or stock batches.', [], 409);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete supplier', [err.message]);
  }
});

export { suppliersRouter };
