import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { createMockContext, createMockUser } from "../../../../../test/factories";

vi.mock("../inventory-container", () => {
    const mockService = {
        createSession: vi.fn(),
        getSessions: vi.fn(),
        getSessionDetails: vi.fn(),
        updateItem: vi.fn(),
        finalizeSession: vi.fn(),
        cancelSession: vi.fn(),
        getAdjustmentHistory: vi.fn()
    };
    return {
        stockOpnameService: mockService,
        stockOpnameApplicationService: mockService,
    };
});

// Access the initialized mock service via standard import
import { stockOpnameService } from "../inventory-container";
const mockService = stockOpnameService as any;

import { StockOpnameController } from "../presentation/stock-opname.controller";

describe("StockOpnameController", () => {
    let controller: StockOpnameController;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService.createSession.mockResolvedValue("SO-123");
        mockService.getSessions.mockResolvedValue([]);
        mockService.getSessionDetails.mockResolvedValue(null);
        mockService.updateItem.mockResolvedValue({ difference: 0 });
        mockService.finalizeSession.mockResolvedValue({ success: true });
        mockService.cancelSession.mockResolvedValue(undefined);
        mockService.getAdjustmentHistory.mockResolvedValue([]);

        controller = new StockOpnameController();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockAuth = (ctx: any) => {
        vi.spyOn(ctx, "get").mockReturnValue(createMockUser({ id: "user-1", tenantId: "tenant-1" } as any));
    };

    describe("createSession", () => {
        it("should return 201 and session ID", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "json").mockResolvedValue({ notes: "Opname 1", categoryId: "cat-1" });

            const res = await controller.createSession(ctx);

            expect(res.status).toBe(201);
        });

        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "json").mockResolvedValue({});
            mockService.createSession.mockRejectedValue(new Error("Err"));

            const res = await controller.createSession(ctx);
            expect(res.status).toBe(500);
        });
    });

    describe("getSessions", () => {
        it("should return 200 and list", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            const res = await controller.getSessions(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("getSessionDetails", () => {
        it("should return 200 and details if found", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "param").mockReturnValue("SO-1");
            mockService.getSessionDetails.mockResolvedValue({ id: "SO-1", items: [] });
            const res = await controller.getSessionDetails(ctx);
            expect(res.status).toBe(200);
        });

        it("should return 404 if not found", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "param").mockReturnValue("SO-1");
            mockService.getSessionDetails.mockResolvedValue(null);
            const res = await controller.getSessionDetails(ctx);
            expect(res.status).toBe(404);
        });
    });

    describe("updateItem", () => {
        it("should return 200 and result", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "param").mockReturnValue("123");
            vi.spyOn(ctx.req, "json").mockResolvedValue({ physicalStock: 10, reason: "Count" });
            const res = await controller.updateItem(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("finalizeSession", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "param").mockReturnValue("SO-1");
            const res = await controller.finalizeSession(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("cancelSession", () => {
        it("should return 200 on success", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            vi.spyOn(ctx.req, "param").mockReturnValue("SO-1");
            const res = await controller.cancelSession(ctx);
            expect(res.status).toBe(200);
        });
    });

    describe("getAdjustmentHistory", () => {
        it("should return 200 and history", async () => {
            const ctx = createMockContext();
            mockAuth(ctx);
            const res = await controller.getAdjustmentHistory(ctx);
            expect(res.status).toBe(200);
        });
    });
});
