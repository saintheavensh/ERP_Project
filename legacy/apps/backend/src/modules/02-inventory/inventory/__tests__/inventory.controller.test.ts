/**
 * Inventory controller tests — now only tests stock opname controller.
 * Product controller tests moved to products module.
 */
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
        stockOpnameService: mockService
    };
});

import { stockOpnameService } from "../inventory-container";
const mockService = stockOpnameService as any;

import { StockOpnameController } from "../presentation/stock-opname.controller";

describe("StockOpnameController", () => {
    let controller: StockOpnameController;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService.createSession.mockResolvedValue("SO-001");
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

    it("getSessions should return 200", async () => {
        const ctx = createMockContext();
        mockAuth(ctx);
        expect((await controller.getSessions(ctx)).status).toBe(200);
    });

    it("getAdjustmentHistory should return 200", async () => {
        const ctx = createMockContext();
        mockAuth(ctx);
        expect((await controller.getAdjustmentHistory(ctx)).status).toBe(200);
    });

    it("getSessionDetails 404 if not found", async () => {
        const ctx = createMockContext();
        mockAuth(ctx);
        vi.spyOn(ctx.req, "param").mockReturnValue("SO-001");
        expect((await controller.getSessionDetails(ctx)).status).toBe(404);
    });

    it("getSessionDetails 200 if found", async () => {
        const ctx = createMockContext();
        mockAuth(ctx);
        vi.spyOn(ctx.req, "param").mockReturnValue("SO-001");
        mockService.getSessionDetails.mockResolvedValue({ id: "SO-001", items: [] });
        expect((await controller.getSessionDetails(ctx)).status).toBe(200);
    });

    it("getSessions 500 on error", async () => {
        const ctx = createMockContext();
        mockService.getSessions.mockRejectedValue(new Error("Err"));
        expect((await controller.getSessions(ctx)).status).toBe(500);
    });
});
