import { Hono } from 'hono';
import { db } from '../db/connection';
import { roles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';

// P9 — lookup list for the Settings > Users role dropdown. Read-only,
// auth-scoped like GET /v1/branches and GET /v1/users (no requirePermission —
// seeing what roles exist isn't sensitive, only creating/assigning users is).
export const rolesRouter = new Hono();
rolesRouter.use('*', requireAuth);

rolesRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const data = await db.query.roles.findMany({
      where: eq(roles.tenantId, tenantId),
      orderBy: (roles, { asc }) => [asc(roles.name)],
    });

    return successResponse(c, data);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch roles', [err.message]);
  }
});
