import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { UsersController } from "../presentation/users.controller";
import { UsersService } from "../users-container";
import { createMockContext } from "../../../../../test/factories";

describe("UsersController", () => {
    let service: UsersService;
    let controller: UsersController;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new UsersService();
        controller = new UsersController(service);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getAll", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            const mockData = [{ id: "u-1" }];
            vi.spyOn(service, "findAll").mockResolvedValue(mockData as any);
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(service, "findAll").mockRejectedValue(new Error("Err"));
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("getById", () => {
        it("should return 200 if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u-1");
            vi.spyOn(service, "getById").mockResolvedValue({ id: "u-1" } as any);
            const res = await controller.getById(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u-1");
            vi.spyOn(service, "getById").mockRejectedValue({ status: 404, message: "Not found" });
            const res = await controller.getById(ctx);
            expect(res.status).toBe(404);
        });
    });

    describe("create", () => {
        it("should return 201 on success", async () => {
            const ctx = createMockContext();
            const data = { email: "test@example.com" };
            vi.spyOn(ctx.req, "json").mockResolvedValue(data);
            vi.spyOn(service, "create").mockResolvedValue({ id: "u-1", ...data } as any);
            const res = await controller.create(ctx);
            expect(res.status).toBe(201);
        });
    });

    describe("update", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u-1");
            const data = { name: "Updated" };
            vi.spyOn(ctx.req, "json").mockResolvedValue(data);
            vi.spyOn(service, "update").mockResolvedValue({ id: "u-1", ...data } as any);
            const res = await controller.update(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("delete", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("u-1");
            vi.spyOn(service, "delete").mockResolvedValue(undefined);
            const res = await controller.delete(ctx);
            expect(res.status).toBe(200);
        });
    });
});
