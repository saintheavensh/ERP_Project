import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '../lib/validator';
import * as bcrypt from 'bcryptjs';
import { db } from '../db/connection';
import { users, roles, userRoleAssignments, branches } from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';
import { BusinessError } from '../lib/errors';

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

// P9.2 — Settings CRUD (5.10), closes 2A.1 (register/create-user endpoint,
// open since Phase 2). Full detail list for the Settings > Users tab: status
// and current role, unlike the bare id/name/email lookup above.
usersRouter.get('/list', requirePermission('user.manage'), async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        roleId: userRoleAssignments.roleId,
        roleName: roles.name,
        branchId: userRoleAssignments.branchId,
      })
      .from(users)
      .leftJoin(userRoleAssignments, eq(userRoleAssignments.userId, users.id))
      .leftJoin(roles, eq(roles.id, userRoleAssignments.roleId))
      .where(eq(users.tenantId, tenantId))
      .orderBy(users.name);

    return successResponse(c, rows);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch users', [err.message]);
  }
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string().uuid(),
  branchId: z.string().uuid().nullish(), // null = all branches, same convention as the seed
});

usersRouter.post('/', requirePermission('user.manage'), zValidator('json', createUserSchema), auditMiddleware({ action: 'user.create', entityType: 'user', bodyFields: ['name', 'email', 'roleId', 'branchId'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  try {
    const role = await db.query.roles.findFirst({ where: and(eq(roles.id, data.roleId), eq(roles.tenantId, tenantId)) });
    if (!role) return errorResponse(c, 'VALIDATION_ERROR', 'Role does not belong to this tenant', [], 400);

    if (data.branchId) {
      const branch = await db.query.branches.findFirst({ where: and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)) });
      if (!branch) return errorResponse(c, 'VALIDATION_ERROR', 'Branch does not belong to this tenant', [], 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const created = await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        tenantId,
        name: data.name,
        email: data.email,
        passwordHash,
        status: 'active',
      }).returning({ id: users.id, name: users.name, email: users.email, status: users.status, createdAt: users.createdAt });

      await tx.insert(userRoleAssignments).values({
        userId: user.id,
        roleId: data.roleId,
        branchId: data.branchId ?? null,
      });

      return user;
    });

    return successResponse(c, { ...created, roleId: data.roleId, roleName: role.name }, undefined, 201);
  } catch (err: any) {
    // Drizzle wraps a db.transaction() failure in a DrizzleQueryError — the
    // raw PostgresError (with .code) ends up at err.cause, not err.code.
    // Same latent bug exists in a few other routes' 23505/23503 checks
    // that also run inside db.transaction(); see plan/README.md's floating
    // gaps (not fixed here — out of scope for this task).
    if (err.code === '23505' || err.cause?.code === '23505') {
      return errorResponse(c, 'CONFLICT', 'A user with this email already exists', [], 409);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create user', [err.message], 500);
  }
});

const updateUserSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  roleId: z.string().uuid().optional(),
}).refine((data) => data.status !== undefined || data.roleId !== undefined, {
  message: 'At least one of status or roleId is required',
});

usersRouter.patch('/:id', requirePermission('user.manage'), zValidator('json', updateUserSchema), auditMiddleware({ action: 'user.update', entityType: 'user', entityIdParam: 'id', bodyFields: ['status', 'roleId'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const existing = await db.query.users.findFirst({ where: and(eq(users.id, id), eq(users.tenantId, tenantId)) });
    if (!existing) return errorResponse(c, 'NOT_FOUND', 'User not found', [], 404);

    if (data.roleId) {
      const role = await db.query.roles.findFirst({ where: and(eq(roles.id, data.roleId), eq(roles.tenantId, tenantId)) });
      if (!role) return errorResponse(c, 'VALIDATION_ERROR', 'Role does not belong to this tenant', [], 400);
    }

    // Guard against locking the tenant out of its own admin console: reject
    // any change that would leave zero active Super Admins (deactivating the
    // last one, or reassigning their role away). Same spirit as the RBAC
    // break-glass doc in CLAUDE.md — prevent the lockout rather than
    // document a recovery path for it.
    const wouldBecomeInactive = data.status === 'inactive';
    const roleIsChanging = data.roleId !== undefined;
    if (wouldBecomeInactive || roleIsChanging) {
      const activeAdmins = await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(userRoleAssignments, eq(userRoleAssignments.userId, users.id))
        .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
        .where(and(eq(users.tenantId, tenantId), eq(roles.name, 'Super Admin'), eq(users.status, 'active'), ne(users.id, id)));

      const currentlyAdmin = await db
        .select({ id: userRoleAssignments.id })
        .from(userRoleAssignments)
        .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
        .where(and(eq(userRoleAssignments.userId, id), eq(roles.name, 'Super Admin')));

      if (currentlyAdmin.length > 0 && activeAdmins.length === 0) {
        throw new BusinessError('LAST_SUPER_ADMIN', 'Cannot remove the tenant\'s last active Super Admin', 422);
      }
    }

    const result = await db.transaction(async (tx) => {
      if (data.status !== undefined) {
        await tx.update(users).set({ status: data.status }).where(eq(users.id, id));
      }
      if (data.roleId !== undefined) {
        // One role per user, per the login flow (takes assignments[0]) — replace
        // rather than append, same model the seed already assumes.
        await tx.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, id));
        await tx.insert(userRoleAssignments).values({ userId: id, roleId: data.roleId, branchId: null });
      }

      const [updated] = await tx
        .select({
          id: users.id, name: users.name, email: users.email, status: users.status,
          roleId: userRoleAssignments.roleId, roleName: roles.name,
        })
        .from(users)
        .leftJoin(userRoleAssignments, eq(userRoleAssignments.userId, users.id))
        .leftJoin(roles, eq(roles.id, userRoleAssignments.roleId))
        .where(eq(users.id, id));

      return updated;
    });

    return successResponse(c, result);
  } catch (err: any) {
    if (err instanceof BusinessError) {
      return errorResponse(c, err.code, err.message, err.details, err.statusCode);
    }
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update user', [err.message], 500);
  }
});
