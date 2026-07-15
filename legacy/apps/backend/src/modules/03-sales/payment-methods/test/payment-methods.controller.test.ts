import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { PaymentMethodsController } from "../presentation/payment-methods.controller";
import { PaymentMethodsService } from "../payment-methods-container";
import { createMockContext } from "../../../../../test/factories";

describe("PaymentMethodsController", () => {
    let service: PaymentMethodsService;
    let controller: PaymentMethodsController;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PaymentMethodsService();
        controller = new PaymentMethodsController(service);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Payment Methods", () => {
        it("getAll should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(service, "getAll").mockResolvedValue([]);
            const res = await controller.getAll(ctx);
            expect(res.status).toBe(200);
        });

        it("getEnabled should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(service, "getEnabled").mockResolvedValue([]);
            const res = await controller.getEnabled(ctx);
            expect(res.status).toBe(200);
        });

        it("create should return 201", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "Cash" });
            vi.spyOn(service, "create").mockResolvedValue({ id: "pm1" } as any);
            const res = await controller.create(ctx);
            expect(res.status).toBe(201);
        });
    });

    describe("Variants", () => {
        it("addVariant should return 201", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("pm1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "V1" });
            vi.spyOn(service, "addVariant").mockResolvedValue({ id: "v1" } as any);
            const res = await controller.addVariant(ctx);
            expect(res.status).toBe(201);
        });

        it("updateVariant should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "param").mockReturnValue("v1");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ name: "V1 Updated" });
            vi.spyOn(service, "updateVariant").mockResolvedValue(undefined as any);
            const res = await controller.updateVariant(ctx);
            expect(res.status).toBe(200);
        });
    });
});
