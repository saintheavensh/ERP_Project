import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '../lib/validator';
import { db } from '../db/connection';
import { branches } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';

export const branchesRouter = new Hono();
branchesRouter.use('*', requireAuth);

branchesRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const data = await db.query.branches.findMany({
      where: eq(branches.tenantId, tenantId),
      orderBy: (branches, { asc }) => [asc(branches.name)]
    });

    return successResponse(c, data);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch branches', [err.message]);
  }
});

// P9.1 — Settings CRUD (5.10). Branches are the simplest of the three
// resources: no dependent business logic to protect, just tenant-scoped CRUD.
const createBranchSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1).optional(),
});

branchesRouter.post('/', requirePermission('branch.manage'), zValidator('json', createBranchSchema), auditMiddleware({ action: 'branch.create', entityType: 'branch', bodyFields: ['name', 'address'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  try {
    const [branch] = await db.insert(branches).values({
      tenantId,
      name: data.name,
      address: data.address || null,
    }).returning();

    return successResponse(c, branch, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create branch', [err.message], 500);
  }
});

const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).nullish(),
});

branchesRouter.patch('/:id', requirePermission('branch.manage'), zValidator('json', updateBranchSchema), auditMiddleware({ action: 'branch.update', entityType: 'branch', entityIdParam: 'id', bodyFields: ['name', 'address'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const existing = await db.query.branches.findFirst({
      where: and(eq(branches.id, id), eq(branches.tenantId, tenantId)),
    });
    if (!existing) return errorResponse(c, 'NOT_FOUND', 'Branch not found', [], 404);

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.address !== undefined) patch.address = data.address;

    if (Object.keys(patch).length === 0) return successResponse(c, existing);

    const [updated] = await db.update(branches)
      .set(patch)
      .where(and(eq(branches.id, id), eq(branches.tenantId, tenantId)))
      .returning();

    return successResponse(c, updated);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update branch', [err.message], 500);
  }
});
