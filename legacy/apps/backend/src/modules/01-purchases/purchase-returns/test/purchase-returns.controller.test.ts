import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { PurchaseReturnsController } from "../presentation/purchase-returns.controller";
import { PurchaseReturnsService } from "../purchase-returns-container";
import { createMockContext } from "../../../../../test/factories";

describe("PurchaseReturnsController", () => {
    let service: PurchaseReturnsService;
    let controller: PurchaseReturnsController;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PurchaseReturnsService();
        controller = new PurchaseReturnsController(service);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("getAll should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(service, "getAll").mockResolvedValue([]);
        expect((await controller.getAll(ctx)).status).toBe(200);
    });

    it("getAll should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(service, "getAll").mockRejectedValue(new Error("Err"));
        expect((await controller.getAll(ctx)).status).toBe(500);
    });

    it("getById should return 200", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        vi.spyOn(service, "getById").mockResolvedValue({} as any);
        expect((await controller.getById(ctx)).status).toBe(200);
    });

    it("getById should return 404 if not found", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "param").mockReturnValue("1");
        // The service now throws 404 error internally, so we mock the rejection
        vi.spyOn(service, "getById").mockRejectedValue({ status: 404, message: "Not found" });
        expect((await controller.getById(ctx)).status).toBe(404);
    });

    it("create should return 201", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(service, "create").mockResolvedValue({} as any);
        expect((await controller.create(ctx)).status).toBe(201);
    });

    it("create should return 500 on error", async () => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        vi.spyOn(service, "create").mockRejectedValue(new Error("Err"));
        expect((await controller.create(ctx)).status).toBe(500);
    });
});
