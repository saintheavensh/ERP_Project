import { describe, it, expect, beforeEach, vi } from "vitest";
import { DashboardController } from "../controllers/DashboardController";
import { DashboardAggregator } from "../services/DashboardAggregator";
import { Result } from "../../../core/Result";
import { Context } from "hono";

describe("DashboardController", () => {
    let controller: DashboardController;
    let mockAggregator: {
        getDashboardStats: ReturnType<typeof vi.fn>;
        getSalesChart: ReturnType<typeof vi.fn>;
        getInventoryAlerts: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.resetAllMocks();
        mockAggregator = {
            getDashboardStats: vi.fn(),
            getSalesChart: vi.fn(),
            getInventoryAlerts: vi.fn()
        };
        controller = new DashboardController(mockAggregator as unknown as DashboardAggregator);
    });

    const createMockContext = (queryParams: Record<string, string> = {}) => {
        return {
            req: {
                query: (key: string) => queryParams[key]
            },
            json: vi.fn().mockImplementation((val, status = 200) => ({ body: val, status }))
        } as unknown as Context;
    };

    it("should return dashboard stats on success", async () => {
        // Arrange
        const mockStats = { todaySales: { revenue: 1000 } };
        mockAggregator.getDashboardStats.mockResolvedValue(Result.ok(mockStats));
        const c = createMockContext();

        // Act
        const response = await controller.getStats(c) as any;

        // Assert
        expect(mockAggregator.getDashboardStats).toHaveBeenCalled();
        expect(c.json).toHaveBeenCalledWith(mockStats);
        expect(response.status).toBe(200);
    });

    it("should return 500 error if stats aggregation fails", async () => {
        // Arrange
        mockAggregator.getDashboardStats.mockResolvedValue(Result.fail("Database timeout"));
        const c = createMockContext();

        // Act
        const response = await controller.getStats(c) as any;

        // Assert
        expect(mockAggregator.getDashboardStats).toHaveBeenCalled();
        expect(c.json).toHaveBeenCalledWith({ error: "Database timeout" }, 500);
        expect(response.status).toBe(500);
    });
});
