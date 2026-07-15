import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceController } from "../presentation/service.controller";
import { ServiceApplicationService } from "../services-container";
import { createMockContext, createMockUser } from "../../../../../test/factories";

describe("ServiceController", () => {
    let service: ServiceApplicationService;
    let controller: ServiceController;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ServiceApplicationService();
        controller = new ServiceController(service);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

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
        it("getById 200 if found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            vi.spyOn(service, "getById").mockResolvedValue({ id: "1", no: "SRV-1" } as any);
            const res = await controller.getById(ctx);
            expect(res.status).toBe(200);
        });

        it("getById 404 if not found", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("1");
            vi.spyOn(service, "getById").mockRejectedValue({ status: 404, message: "Not found" });
            const res = await controller.getById(ctx);
            expect(res.status).toBe(404);
        });

        it("createService 201 on success", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ customer: { name: "Test" } });
            vi.spyOn(service, "createService").mockResolvedValue({ message: "Created", no: "SRV-1", id: "1" });
            const res = await controller.createService(ctx);
            expect(res.status).toBe(201);
        });

        it("createService 400 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req as any, "valid").mockReturnValue({ customer: { name: "Test" } });
            vi.spyOn(service, "createService").mockRejectedValue(new Error("Err"));
            const res = await controller.createService(ctx);
            expect(res.status).toBe(400);
        });
    });
});
