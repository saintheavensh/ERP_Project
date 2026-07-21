import type { MiddlewareHandler } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection';
import { rolePermissions, permissions } from '../db/schema';
import { getAuthContext } from './auth';
import { errorResponse } from '../lib/response';

// 'report': log what WOULD be denied, then let the request through — the
// mechanism the H12 rollout uses to discover missing grants before they can
// lock anyone out. 'enforce': actually return 403.
// Break-glass: setting this back to 'report' in .env restores non-enforcing
// behaviour with no code change — see CLAUDE.md.
export type RbacMode = 'report' | 'enforce';

const RBAC_MODE: RbacMode = process.env.RBAC_MODE === 'enforce' ? 'enforce' : 'report';

export type RbacCheck = {
  roleName: string;
  hasGrant: boolean;
  mode: RbacMode;
};

export type RbacResult = {
  // A missing grant is logged whether or not it actually blocks — that log
  // line is Stage 2's entire discovery mechanism (H12).
  wouldDeny: boolean;
  block: boolean;
};

/**
 * Pure decision — no DB, no HTTP. Mirrors evaluateTransition in
 * services/flow-engine.ts: keep the decision testable, push DB fetching to
 * a thin wrapper around it.
 */
export function evaluateRbac(check: RbacCheck): RbacResult {
  // Super Admin bypasses all permission checks, in both modes. Without this,
  // a catalog mistake leaves nobody able to repair the catalog.
  if (check.roleName === 'Super Admin') {
    return { wouldDeny: false, block: false };
  }

  if (check.hasGrant) {
    return { wouldDeny: false, block: false };
  }

  return { wouldDeny: true, block: check.mode === 'enforce' };
}

export async function hasPermission(roleId: string, code: string): Promise<boolean> {
  // 'no-role' is the JWT fallback for a user with no role assignment — not a
  // UUID, so querying it would throw a Postgres type error. Mirrors the same
  // guard in services/flow-engine.ts.
  if (roleId === 'no-role') return false;

  const rows = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(rolePermissions.roleId, roleId), eq(permissions.code, code)));

  return rows.length > 0;
}

// Typed as Hono's MiddlewareHandler (not a bare Context/Next arrow) so that
// inlining this in a route registration (`router.post(path, requirePermission(...), handler)`)
// doesn't collapse the route's path-param type inference for the handler that
// follows it — a resolved `(c: Context, next: Next) => ...` can't be
// re-instantiated per call site the way a generic MiddlewareHandler can.
export const requirePermission = (code: string): MiddlewareHandler => async (c, next) => {
  const { userId, roleId, roleName } = getAuthContext(c);

  // Super Admin never needs the grant query — evaluateRbac would bypass on
  // roleName alone anyway, so skip the DB round trip entirely.
  const hasGrant = roleName === 'Super Admin' ? true : await hasPermission(roleId, code);
  const result = evaluateRbac({ roleName, hasGrant, mode: RBAC_MODE });

  if (result.wouldDeny) {
    console.warn(`[RBAC] would deny: user=${userId} role=${roleName} perm=${code} ${c.req.method} ${c.req.path}`);
  }

  if (result.block) {
    return errorResponse(c, 'PERMISSION_DENIED', `Missing permission: ${code}`, undefined, 403);
  }

  await next();
};
