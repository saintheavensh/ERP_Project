import { Hono } from 'hono';
import { db } from '../db/connection';
import { inventoryCategories } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';
import { validateTargetMargin, DEFAULT_MARGIN_STRATEGY, MARGIN_STRATEGIES, type MarginStrategy } from '../lib/margin';
import { zValidator } from '../lib/validator';
import { z } from 'zod';

const categoriesRouter = new Hono();
categoriesRouter.use('*', requireAuth);

// Phase 4C.1 — margin config. Shared by category create and update. Both fields
// are optional/nullable: null clears the override so the item/system default wins.
const marginStrategySchema = z.enum(MARGIN_STRATEGIES as unknown as [MarginStrategy, ...MarginStrategy[]]);
const marginConfigShape = {
  marginStrategy: marginStrategySchema.nullish(),
  targetMargin: z.number().nullish(),
};

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
  description: z.string().optional(),
  ...marginConfigShape,
});

categoriesRouter.post('/', requirePermission('catalog.manage'), zValidator('json', createCategorySchema), auditMiddleware({ action: 'category.create', entityType: 'inventory_category', bodyFields: ['name', 'description', 'marginStrategy', 'targetMargin'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  // Effective strategy = the one being set, else system default (which is what
  // resolveMarginConfig would fall back to). Only 'markup' may exceed 100%.
  const marginErr = data.targetMargin == null
    ? null
    : validateTargetMargin(data.marginStrategy ?? DEFAULT_MARGIN_STRATEGY, data.targetMargin);
  if (marginErr) return errorResponse(c, 'VALIDATION_ERROR', marginErr, [], 400);

  try {
    const [newCat] = await db.insert(inventoryCategories)
      .values({
        tenantId,
        name: data.name,
        description: data.description,
        marginStrategy: data.marginStrategy ?? null,
        // decimal columns are stored as strings by drizzle-orm
        targetMargin: data.targetMargin == null ? null : data.targetMargin.toString(),
      })
      .returning();
    return successResponse(c, newCat, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create category', [err.message]);
  }
});

// PATCH /v1/categories/:id — update name/description and/or margin config (4C.1).
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullish(),
  ...marginConfigShape,
});

categoriesRouter.patch('/:id', requirePermission('catalog.manage'), zValidator('json', updateCategorySchema), auditMiddleware({ action: 'category.update', entityType: 'inventory_category', entityIdParam: 'id', bodyFields: ['name', 'description', 'marginStrategy', 'targetMargin'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');
  const data = c.req.valid('json');

  try {
    // Tenant-scoped existence check — never trust the URL id alone.
    const existing = await db.query.inventoryCategories.findFirst({
      where: and(eq(inventoryCategories.id, id), eq(inventoryCategories.tenantId, tenantId)),
    });
    if (!existing) return errorResponse(c, 'NOT_FOUND', 'Category not found', [], 404);

    // Validate targetMargin against the strategy that will actually apply after this
    // update (incoming value if provided, else what's already stored, else default).
    const effectiveStrategy = (data.marginStrategy ?? existing.marginStrategy ?? DEFAULT_MARGIN_STRATEGY) as MarginStrategy;
    const effectiveTarget = data.targetMargin !== undefined
      ? data.targetMargin
      : (existing.targetMargin == null ? null : parseFloat(existing.targetMargin));
    const marginErr = effectiveTarget == null ? null : validateTargetMargin(effectiveStrategy, effectiveTarget);
    if (marginErr) return errorResponse(c, 'VALIDATION_ERROR', marginErr, [], 400);

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.marginStrategy !== undefined) patch.marginStrategy = data.marginStrategy;
    if (data.targetMargin !== undefined) patch.targetMargin = data.targetMargin == null ? null : data.targetMargin.toString();

    if (Object.keys(patch).length === 0) return successResponse(c, existing);

    const [updated] = await db.update(inventoryCategories)
      .set(patch)
      .where(and(eq(inventoryCategories.id, id), eq(inventoryCategories.tenantId, tenantId)))
      .returning();
    return successResponse(c, updated);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update category', [err.message]);
  }
});

export { categoriesRouter };
