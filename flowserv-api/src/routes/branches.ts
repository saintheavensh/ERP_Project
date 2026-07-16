import { Hono } from 'hono';
import { db } from '../db/connection';
import { branches } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
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
