import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { CustomersController } from "../presentation/customers.controller";
import { CustomersService } from "../customers-container";
import { createMockContext } from "../../../../../test/factories";

describe("CustomersController", () => {
    let service: CustomersService;
    let controller: CustomersController;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new CustomersService();
        controller = new CustomersController(service);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getAll", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            const mockData = [{ id: "c-1" }];
            vi.spyOn(service, "getAll").mockResolvedValue(mockData as any);
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(service, "getAll").mockRejectedValue(new Error("Err"));
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("getById", () => {
        it("should return 200 and data if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            vi.spyOn(service, "getById").mockResolvedValue({ id: "c-1" } as any);
            const res = await controller.getById(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            vi.spyOn(service, "getById").mockRejectedValue({ status: 404, message: "Not found" });
            const res = await controller.getById(ctx);
            expect(res.status).toBe(404);
        });
    });

    describe("create", () => {
        it("should return 201 on success", async () => {
            const ctx = createMockContext();
            const data = { name: "John", phone: "123" };
            (ctx.req as any).valid = vi.fn().mockReturnValue(data);
            vi.spyOn(service, "create").mockResolvedValue({ id: "c-1", ...data } as any);
            const res = await controller.create(ctx);
            expect(res.status).toBe(201);
        });
    });

    describe("update", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            const data = { name: "Updated" };
            (ctx.req as any).valid = vi.fn().mockReturnValue(data);
            vi.spyOn(service, "update").mockResolvedValue({ id: "c-1", ...data } as any);
            const res = await controller.update(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("delete", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            vi.spyOn(service, "delete").mockResolvedValue(undefined);
            const res = await controller.delete(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("getSales", () => {
        it("should return 200 and sales", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            vi.spyOn(service, "getSales").mockResolvedValue([]);
            const res = await controller.getSales(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("getUnpaidSales", () => {
        it("should return 200 and unpaid sales", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            vi.spyOn(service, "getUnpaidSales").mockResolvedValue([]);
            const res = await controller.getUnpaidSales(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("processPayment", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("c-1");
            const input = { amount: 1000, method: "cash" };
            (ctx.req as any).valid = vi.fn().mockReturnValue(input);
            vi.spyOn(service, "processPayment").mockResolvedValue({ id: "c-1" } as any);
            const res = await controller.processPayment(ctx);
            expect(res.status).toBe(200);
        });
    });
});
