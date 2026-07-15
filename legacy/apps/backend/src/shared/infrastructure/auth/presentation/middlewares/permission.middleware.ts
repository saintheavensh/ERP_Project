import { createMiddleware } from "hono/factory";
import { authFacade } from "../../AuthContainer";
import type { Permission } from "../../domain/constants/Permissions";

async function getRolePermissions(roleId: string): Promise<string[]> {
    return await authFacade.getRolePermissions(roleId);
}

/**
 * Permission-based middleware.
 * Checks if the authenticated user's role has ANY of the required permissions.
 * The "all" permission (super_admin/owner) bypasses all checks.
 *
 * Usage: requirePermission(Permissions.SALE_CREATE, Permissions.SALE_MANAGE)
 */
export function requirePermission(...requiredPermissions: Permission[]) {
    return createMiddleware(async (c, next) => {
        const user = c.get("user") as any;
        if (!user?.role) {
            return c.json({
                success: false,
                message: "Forbidden",
                errors: ["Authentication required"],
                error_code: "FORBIDDEN"
            }, 403);
        }

        const userRole = typeof user.role === "object" ? user.role.id : user.role;
        const rolePerms = await getRolePermissions(userRole);

        // "all" permission bypasses every check (super_admin, owner)
        if (rolePerms.includes("all")) {
            await next();
            return;
        }

        // Check if user has any of the required permissions
        const hasPermission = requiredPermissions.some(p => rolePerms.includes(p));
        if (!hasPermission) {
            return c.json({
                success: false,
                message: "Forbidden",
                errors: [`Insufficient permissions. Required: ${requiredPermissions.join(" or ")}`],
                error_code: "FORBIDDEN"
            }, 403);
        }

        await next();
    });
}

/**
 * Role-based middleware (simpler alternative).
 * Checks if the user's role is in the allowed list.
 * super_admin always passes.
 *
 * Usage: requireRole("kasir", "manager")
 */
export function requireRole(...allowedRoles: string[]) {
    return createMiddleware(async (c, next) => {
        const user = c.get("user") as any;
        if (!user?.role) {
            return c.json({
                success: false,
                message: "Forbidden",
                errors: ["Authentication required"],
                error_code: "FORBIDDEN"
            }, 403);
        }

        const userRole = typeof user.role === "object" ? user.role.id : user.role;

        // super_admin always bypasses
        if (userRole === "super_admin") {
            await next();
            return;
        }

        if (!allowedRoles.includes(userRole)) {
            return c.json({
                success: false,
                message: "Forbidden",
                errors: [`Role '${userRole}' is not authorized for this action`],
                error_code: "FORBIDDEN"
            }, 403);
        }

        await next();
    });
}

/** Utility to clear the permission cache (useful for tests or after role updates) */
export function clearPermissionCache() {
    authFacade.clearPermissionCache();
}

/** @deprecated Use requirePermission() instead. Kept for backward compatibility. */
export const permissionGuard = requirePermission;
