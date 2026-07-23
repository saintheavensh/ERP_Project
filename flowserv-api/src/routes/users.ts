import { Hono } from 'hono';
import { db } from '../db/connection';
import { users, roles, userRoleAssignments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';

export const usersRouter = new Hono();
usersRouter.use('*', requireAuth);

// F1 — technician picker for the ticket workspace. Read-only, auth-scoped like
// GET /v1/branches (no requirePermission — this is a lookup list, not a mutation).
// ?role=<name> filters to users holding that role in this tenant (e.g. "Technician").
usersRouter.get('/', async (c) => {
  const { tenantId } = getAuthContext(c);
  const roleName = c.req.query('role');

  try {
    const filters = [eq(users.tenantId, tenantId)];

    const rows = roleName
      ? await db
          .selectDistinct({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .innerJoin(userRoleAssignments, eq(userRoleAssignments.userId, users.id))
          .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
          .where(and(...filters, eq(roles.tenantId, tenantId), eq(roles.name, roleName)))
          .orderBy(users.name)
      : await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(and(...filters))
          .orderBy(users.name);

    return successResponse(c, rows);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch users', [err.message]);
  }
});
