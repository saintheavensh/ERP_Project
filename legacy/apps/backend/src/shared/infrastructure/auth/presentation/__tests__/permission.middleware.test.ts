import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockContext } from "../../../../../../test/factories";

// Mock the DB module before importing the middleware
vi.mock("@shared/infrastructure/database/client", () => ({
    db: {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    limit: vi.fn()
                })
            })
        })
    }
}));

vi.mock("@shared/infrastructure/database/schema", () => ({
    roles: { permissions: "permissions", id: "id" },
    rolePermissions: { roleId: "roleId", permissionId: "permissionId" }
}));

vi.mock("drizzle-orm", () => ({
    eq: vi.fn((a: any, b: any) => ({ field: a, value: b })),
    relations: vi.fn(),
    sql: vi.fn()
}));

vi.mock("../../../config/AppConfig", () => ({
    appConfig: {
        jwtSecret: "test-secret-12345678",
        databaseUrl: "postgres://localhost:5432/test"
    },
    AppConfigService: class { }
}));

import { requirePermission, requireRole, clearPermissionCache } from "../middlewares/permission.middleware";
import { db } from "@shared/infrastructure/database/client";

// Helper: set up mock DB to return specific permissions for a role
// GetRolePermissionsUseCase does: db.select({permissionId}).from(rolePermissions).where(...)
// where() returns an array of { permissionId: string }
function mockRolePermissions(permissions: string[]) {
    const rows = permissions.map(p => ({ permissionId: p }));
    const whereMock = vi.fn().mockResolvedValue(rows);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.select as any).mockReturnValue({ from: fromMock });
}

function mockRoleNotFound() {
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.select as any).mockReturnValue({ from: fromMock });
}

describe("requirePermission middleware", () => {
    beforeEach(() => {
        clearPermissionCache();
        vi.clearAllMocks();
    });

    it("should call next() when user has the required permission", async () => {
        mockRolePermissions(["sale.create", "sale.read"]);
        const c = createMockContext();
        c.set("user", { id: "u1", role: "kasir" });

        const middleware = requirePermission("sale.create");
        const next = vi.fn();

        await middleware(c, next);

        expect(next).toHaveBeenCalled();
    });

    it("should call next() when user has 'all' permission (super_admin bypass)", async () => {
        mockRolePermissions(["all"]);
        const c = createMockContext();
        c.set("user", { id: "u1", role: "super_admin" });

        const middleware = requirePermission("some.random.permission" as any);
        const next = vi.fn();

        await middleware(c, next);

        expect(next).toHaveBeenCalled();
    });

    it("should return 403 when user lacks required permission", async () => {
        mockRolePermissions(["service.read", "service.update"]);
        const c = createMockContext();
        c.set("user", { id: "u1", role: "teknisi" });

        const middleware = requirePermission("sale.create");
        const next = vi.fn();

        const response = await middleware(c, next);

        expect(next).not.toHaveBeenCalled();
        expect(response).toBeDefined();
        const body = (await response?.json()) as any;
        expect(body.success).toBe(false);
        expect(body.message).toBe("Forbidden");
        expect(body.error_code).toBe("FORBIDDEN");
    });

    it("should return 403 when user has no role in context", async () => {
        const c = createMockContext();
        c.set("user", { id: "u1" }); // No role field

        const middleware = requirePermission("sale.create");
        const next = vi.fn();

        const response = await middleware(c, next);

        expect(next).not.toHaveBeenCalled();
        const body = (await response?.json()) as any;
        expect(body.success).toBe(false);
    });

    it("should pass when user has ANY of multiple required permissions", async () => {
        mockRolePermissions(["sale.read"]);
        const c = createMockContext();
        c.set("user", { id: "u1", role: "kasir" });

        // User has sale.read, middleware requires sale.create OR sale.read
        const middleware = requirePermission("sale.create", "sale.read");
        const next = vi.fn();

        await middleware(c, next);

        expect(next).toHaveBeenCalled();
    });

    it("should handle role field as an object with id", async () => {
        mockRolePermissions(["inventory.manage"]);
        const c = createMockContext();
        c.set("user", { id: "u1", role: { id: "warehouse", name: "Warehouse" } });

        const middleware = requirePermission("inventory.manage" as any);
        const next = vi.fn();

        await middleware(c, next);

        expect(next).toHaveBeenCalled();
    });

    it("should handle role not found in database", async () => {
        mockRoleNotFound();
        const c = createMockContext();
        c.set("user", { id: "u1", role: "unknown_role" });

        const middleware = requirePermission("sale.create");
        const next = vi.fn();

        const response = await middleware(c, next);

        expect(next).not.toHaveBeenCalled();
        const body = (await response?.json()) as any;
        expect(body.success).toBe(false);
    });

    it("should use cache on subsequent calls for same role", async () => {
        mockRolePermissions(["sale.create"]);
        const middleware = requirePermission("sale.create");

        // First call - hits DB
        const c1 = createMockContext();
        c1.set("user", { id: "u1", role: "kasir" });
        await middleware(c1, vi.fn());

        // Second call - should use cache
        const c2 = createMockContext();
        c2.set("user", { id: "u2", role: "kasir" });
        await middleware(c2, vi.fn());

        // db.select should only be called once due to caching
        expect(db.select).toHaveBeenCalledTimes(1);
    });
});

describe("requireRole middleware", () => {
    beforeEach(() => {
        clearPermissionCache();
        vi.clearAllMocks();
    });

    it("should call next() when user role is in allowed list", async () => {
        const c = createMockContext();
        c.set("user", { id: "u1", role: "kasir" });

        const middleware = requireRole("kasir", "manager");
        const next = vi.fn();

        await middleware(c, next);

        expect(next).toHaveBeenCalled();
    });

    it("should always allow super_admin", async () => {
        const c = createMockContext();
        c.set("user", { id: "u1", role: "super_admin" });

        const middleware = requireRole("kasir"); // super_admin not in list but should pass
        const next = vi.fn();

        await middleware(c, next);

        expect(next).toHaveBeenCalled();
    });

    it("should return 403 when user role is not in allowed list", async () => {
        const c = createMockContext();
        c.set("user", { id: "u1", role: "teknisi" });

        const middleware = requireRole("kasir", "manager");
        const next = vi.fn();

        const response = await middleware(c, next);

        expect(next).not.toHaveBeenCalled();
        const body = (await response?.json()) as any;
        expect(body.success).toBe(false);
        expect(body.message).toBe("Forbidden");
        expect(body.errors[0]).toContain("teknisi");
    });

    it("should return 403 when user has no role", async () => {
        const c = createMockContext();
        c.set("user", { id: "u1" });

        const middleware = requireRole("kasir");
        const next = vi.fn();

        const response = await middleware(c, next);

        expect(next).not.toHaveBeenCalled();
    });

    it("should handle role as object with id", async () => {
        const c = createMockContext();
        c.set("user", { id: "u1", role: { id: "manager", name: "Manager" } });

        const middleware = requireRole("manager", "owner");
        const next = vi.fn();

        await middleware(c, next);

        expect(next).toHaveBeenCalled();
    });
});
