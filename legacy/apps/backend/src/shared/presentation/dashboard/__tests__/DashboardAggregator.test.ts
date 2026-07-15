import { describe, it, expect, beforeEach, vi } from "vitest";
import { DashboardAggregator } from "../services/DashboardAggregator";
import { Result } from "../../../core/Result";

describe("DashboardAggregator", () => {
    let aggregator: DashboardAggregator;

    // Mock facades
    const mockSalesFacade = {
        getTodaySales: vi.fn(),
        getWeeklySales: vi.fn(),
        getSalesChart: vi.fn()
    };

    const mockInventoryFacade = {
        getLowStock: vi.fn(),
        getAlerts: vi.fn()
    };

    const mockProductsFacade = {
        getTotalCount: vi.fn()
    };

    const mockCustomersFacade = {
        getNewCustomersToday: vi.fn()
    };

    const mockDeviceFacade = {
        getStatus: vi.fn()
    };

    const mockCacheService = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        remember: vi.fn()
    };

    const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        time: vi.fn((name, cb) => cb())
    };

    const mockLoggerFactory = {
        createLogger: vi.fn().mockReturnValue(mockLogger)
    };

    beforeEach(() => {
        vi.clearAllMocks();
        aggregator = new DashboardAggregator(
            mockSalesFacade,
            mockInventoryFacade,
            mockProductsFacade,
            mockCustomersFacade,
            mockDeviceFacade,
            mockCacheService as any,
            mockLoggerFactory as any
        );
    });

    it("should successfully aggregate dashboard stats from all modules", async () => {
        // Arrange
        mockSalesFacade.getTodaySales.mockResolvedValue(Result.ok({ count: 10, revenue: 500000 }));
        mockSalesFacade.getWeeklySales.mockResolvedValue(Result.ok({ days: ['Mon'], values: [500000] }));
        mockInventoryFacade.getLowStock.mockResolvedValue(Result.ok([{ id: '1', currentStock: 2 }]));
        mockProductsFacade.getTotalCount.mockResolvedValue(Result.ok(150));
        mockCustomersFacade.getNewCustomersToday.mockResolvedValue(Result.ok(5));
        mockDeviceFacade.getStatus.mockResolvedValue(Result.ok({ online: 2, offline: 1, total: 3 }));

        // Act
        const result = await aggregator.getDashboardStats();

        // Assert
        expect(result.isSuccess).toBe(true);
        const stats = result.getValue();
        expect(stats.todaySales.revenue).toBe(500000);
        expect(stats.lowStockItems.length).toBe(1);
        expect(stats.totalProducts).toBe(150);
        expect(stats.newCustomersToday).toBe(5);
        expect(stats.deviceStatus.total).toBe(3);
    });

    it("should fail gracefully if primary sales data fails", async () => {
        // Arrange
        mockSalesFacade.getTodaySales.mockResolvedValue(Result.fail("Database connection error"));
        mockSalesFacade.getWeeklySales.mockResolvedValue(Result.ok({ days: [], values: [] }));
        mockInventoryFacade.getLowStock.mockResolvedValue(Result.ok([]));
        mockProductsFacade.getTotalCount.mockResolvedValue(Result.ok(150));
        mockCustomersFacade.getNewCustomersToday.mockResolvedValue(Result.ok(5));
        mockDeviceFacade.getStatus.mockResolvedValue(Result.ok({ online: 2, offline: 0, total: 2 }));

        // Act
        const result = await aggregator.getDashboardStats();

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Failed to get sales data");
    });

    it("should aggregate data even if secondary modules fail", async () => {
        // Arrange
        mockSalesFacade.getTodaySales.mockResolvedValue(Result.ok({ count: 10, revenue: 500000 }));
        mockSalesFacade.getWeeklySales.mockResolvedValue(Result.ok({ days: [], values: [] }));
        // Inventory fails, should fallback to empty array
        mockInventoryFacade.getLowStock.mockResolvedValue(Result.fail("Inventory service down"));
        mockProductsFacade.getTotalCount.mockResolvedValue(Result.ok(150));
        mockCustomersFacade.getNewCustomersToday.mockResolvedValue(Result.ok(5));
        mockDeviceFacade.getStatus.mockResolvedValue(Result.ok({ online: 2, offline: 0, total: 2 }));

        // Act
        const result = await aggregator.getDashboardStats();

        // Assert
        expect(result.isSuccess).toBe(true);
        const stats = result.getValue();
        expect(stats.todaySales.revenue).toBe(500000);
        expect(stats.lowStockItems).toEqual([]); // Fallback value
        expect(stats.totalProducts).toBe(150);
    });
});
