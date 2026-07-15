import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { SalesController } from "../presentation/sales.controller";
import { SalesService } from "../sales-container";
import { createMockContext, createMockUser } from "../../../../../test/factories";

describe("SalesController", () => {
    let service: SalesService;
    let controller: SalesController;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new SalesService();
        controller = new SalesController(service);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockAuth = (ctx: any) => {
        vi.spyOn(ctx, "get").mockReturnValue(createMockUser());
    };

    describe("General", () => {
        it("getAll should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(service, "getAll").mockResolvedValue([]);
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(200);
        });

        it("getAll 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(service, "getAll").mockRejectedValue(new Error("Err"));
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("CRUD", () => {
        it("getOne 200 if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            vi.spyOn(service, "getById").mockResolvedValue({ id: "1" } as any);
            const res = await controller.getOne(ctx);
            expect(res.status).toBe(200);
        });

        it("getOne 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            vi.spyOn(service, "getById").mockRejectedValue({ status: 404, message: "Not found" });
            const res = await controller.getOne(ctx);
            expect(res.status).toBe(404);
        });

        it("createSale 201 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ items: [] });
            vi.spyOn(service, "createSale").mockResolvedValue({ message: "Sale created", id: "S1", change: 0 });
            const res = await controller.createSale(ctx);
            expect(res.status).toBe(201);
        });

        it("createSale 400 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ items: [] });
            vi.spyOn(service, "createSale").mockRejectedValue(new Error("Err"));
            const res = await controller.createSale(ctx);
            expect(res.status).toBe(400);
        });
    });
});
