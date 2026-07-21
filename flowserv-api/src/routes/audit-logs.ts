import { Hono } from 'hono';
import { db } from '../db/connection';
import { auditLogs, users } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { successResponse, errorResponse } from '../lib/response';
import { cursorCondition, decodeCursor, parseLimit, buildPage, orderByCursor } from '../lib/pagination';

const auditLogsRouter = new Hono();
auditLogsRouter.use('*', requireAuth);

// GET /v1/audit-logs — admin-only (H12's Super Admin bypass is what actually
// grants this; see 01-core.ts's comment on why no role is explicitly granted it).
auditLogsRouter.get('/', requirePermission('audit.view'), async (c) => {
  const { tenantId } = getAuthContext(c);

  const entityType = c.req.query('entityType');
  const entityId = c.req.query('entityId');
  const actorId = c.req.query('actorId');
  const action = c.req.query('action');
  const limit = parseLimit(c.req.query('limit'));
  const cursorParam = c.req.query('cursor');

  try {
    const filters = [eq(auditLogs.tenantId, tenantId)];
    if (entityType) filters.push(eq(auditLogs.entityType, entityType));
    if (entityId) filters.push(eq(auditLogs.entityId, entityId));
    if (actorId) filters.push(eq(auditLogs.actorId, actorId));
    if (action) filters.push(eq(auditLogs.action, action));

    if (cursorParam) {
      const cursor = decodeCursor(cursorParam);
      if (!cursor) return errorResponse(c, 'INVALID_CURSOR', 'Malformed cursor', undefined, 400);
      filters.push(cursorCondition(auditLogs.createdAt, auditLogs.id, cursor));
    }

    const rows = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorName: users.name,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        changes: auditLogs.changes,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(and(...filters))
      .orderBy(...orderByCursor(auditLogs.createdAt, auditLogs.id))
      .limit(limit + 1);

    const { page, hasMore, nextCursor } = buildPage(rows, limit);

    return successResponse(c, page, { has_more: hasMore, next_cursor: nextCursor });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch audit logs', [err.message]);
  }
});

export { auditLogsRouter };
