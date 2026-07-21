import { Hono } from 'hono';
import { db } from '../db/connection';
import { partBrands } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { successResponse, errorResponse } from '../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const brandsRouter = new Hono();
brandsRouter.use('*', requireAuth);

// GET /v1/brands
brandsRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  
  try {
    const data = await db.select()
      .from(partBrands)
      .where(eq(partBrands.tenantId, tenantId))
      .orderBy(desc(partBrands.name));
      
    return successResponse(c, data);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch brands', [err.message]);
  }
});

// POST /v1/brands
const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  qualityGrade: z.string().min(1, 'Quality grade is required')
});

brandsRouter.post('/', requirePermission('catalog.manage'), zValidator('json', brandSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');
  
  try {
    const [newBrand] = await db.insert(partBrands)
      .values({
        tenantId,
        ...data
      })
      .returning();
      
    return successResponse(c, newBrand, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create brand', [err.message]);
  }
});

// DELETE /v1/brands/:id
brandsRouter.delete('/:id', requirePermission('catalog.manage'), async (c) => {
  const { tenantId } = getAuthContext(c);
  const brandId = c.req.param('id');
  
  try {
    await db.delete(partBrands).where(
      and(
        eq(partBrands.id, brandId),
        eq(partBrands.tenantId, tenantId)
      )
    );
    return successResponse(c, { deleted: true });
  } catch (err: any) {
    if (err.code === '23503') { 
      return errorResponse(c, 'CONFLICT', 'Cannot delete brand because it is used by items.', [], 409);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete brand', [err.message]);
  }
});

export { brandsRouter };
