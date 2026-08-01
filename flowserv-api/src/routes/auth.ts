import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '../lib/validator';
import { db } from '../db/connection';
import { users, userRoleAssignments, roles } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { successResponse, errorResponse } from '../lib/response';
import { JWT_SECRET, requireAuth, getAuthContext } from '../middleware/auth';

const authRouter = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const userList = await db.select().from(users).where(eq(users.email, email));
  const user = userList[0];

  if (!user) {
    return errorResponse(c, 'AUTH_FAILED', 'Invalid email or password', [], 401);
  }

  // P9.2 — the Settings > Users "Nonaktifkan" action (users.status) was
  // previously write-only: nothing ever read it back, so deactivating a user
  // there would not actually have stopped them from logging in.
  if (user.status !== 'active') {
    return errorResponse(c, 'ACCOUNT_INACTIVE', 'This account has been deactivated', [], 401);
  }

  let isMatch = false;
  if (user.passwordHash.length === 64) {
    const crypto = await import('node:crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    isMatch = hash === user.passwordHash;
  } else {
    isMatch = await bcrypt.compare(password, user.passwordHash);
  }

  if (!isMatch) {
    return errorResponse(c, 'AUTH_FAILED', 'Invalid email or password', [], 401);
  }

  const assignments = await db
    .select({ roleId: userRoleAssignments.roleId, roleName: roles.name })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.userId, user.id));

  const roleId = assignments[0]?.roleId || 'no-role';
  const roleName = assignments[0]?.roleName || 'no-role';

  const payload = {
    userId: user.id,
    tenantId: user.tenantId,
    roleId,
    roleName,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };

  const token = await sign(payload, JWT_SECRET);

  return successResponse(c, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      roleId,
      roleName,
    }
  });
});

authRouter.get('/me', requireAuth, async (c) => {
  const payload = getAuthContext(c);
  
  const userList = await db.select().from(users).where(eq(users.id, payload.userId));
  const user = userList[0];

  if (!user) {
    return errorResponse(c, 'NOT_FOUND', 'User not found', [], 404);
  }

  return successResponse(c, {
    id: user.id,
    name: user.name,
    email: user.email,
    tenantId: user.tenantId,
    roleId: payload.roleId,
    roleName: payload.roleName,
  });
});

export { authRouter };
