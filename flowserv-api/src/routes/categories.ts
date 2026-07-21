import { Hono } from 'hono';
import { db } from '../db/connection';
import { inventoryCategories } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const categoriesRouter = new Hono();
categoriesRouter.use('*', requireAuth);

categoriesRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  try {
    const data = await db.select()
      .from(inventoryCategories)
      .where(eq(inventoryCategories.tenantId, tenantId))
      .orderBy(desc(inventoryCategories.name));
    return successResponse(c, data);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch categories', [err.message]);
  }
});

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
});

categoriesRouter.post('/', requirePermission('catalog.manage'), zValidator('json', createCategorySchema), auditMiddleware({ action: 'category.create', entityType: 'inventory_category', bodyFields: ['name', 'description'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');
  try {
    const [newCat] = await db.insert(inventoryCategories)
      .values({ tenantId, ...data })
      .returning();
    return successResponse(c, newCat, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create category', [err.message]);
  }
});

export { categoriesRouter };
