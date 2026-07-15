import { inject, injectable } from "inversify";
import { Result } from "../../../core/Result";
import { DashboardStatsDTO, TimeRangeDTO } from "../dtos/dashboard.dto";
import { TYPES } from "../../../../shared/core/types";
import { CacheService } from "../../../../shared/infrastructure/cache/CacheService";
import { LoggerFactory, Logger } from "../../../../shared/utils/logger/Logger";

@injectable()
export class DashboardAggregator {
    private logger: Logger;

    constructor(
        @inject(TYPES.SalesFacade) private salesFacade: any,
        @inject(TYPES.InventoryFacade) private inventoryFacade: any,
        @inject(TYPES.ProductsFacade) private productsFacade: any,
        @inject(TYPES.CustomersFacade) private customersFacade: any,
        @inject(TYPES.StoreDeviceFacade) private deviceFacade: any,
        @inject(TYPES.CacheService) private cache: CacheService,
        @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.createLogger('DashboardAggregator');
    }

    async getDashboardStats(timeRange?: TimeRangeDTO): Promise<Result<DashboardStatsDTO>> {
        const cacheKey = CacheService.key('dashboard:stats', JSON.stringify(timeRange || {}));

        // Check if Logger has a time method and handle if it doesn't
        if (typeof (this.logger as any).time === 'function') {
            return (this.logger as any).time('getDashboardStats', async () => this.executeGetDashboardStats(timeRange, cacheKey));
        } else {
            return this.executeGetDashboardStats(timeRange, cacheKey);
        }
    }

    private async executeGetDashboardStats(timeRange: TimeRangeDTO | undefined, cacheKey: string): Promise<Result<DashboardStatsDTO>> {
        try {
            // Try cache first
            const cached = this.cache.get<DashboardStatsDTO>(cacheKey);
            if (cached) {
                this.logger.debug('Dashboard stats served from cache', { cacheKey });
                return Result.ok(cached);
            }

            // Parallel calls to all modules for performance
            const [
                todaySalesResult,
                weeklySalesResult,
                inventoryResult,
                productsResult,
                customersResult,
                devicesResult
            ] = await Promise.all([
                this.salesFacade.getTodaySales(),
                this.salesFacade.getWeeklySales(),
                this.inventoryFacade.getLowStock(),
                this.productsFacade.getTotalCount ? this.productsFacade.getTotalCount() : Promise.resolve(Result.ok(0)), // Fallback if no totalCount
                this.customersFacade.getNewCustomersToday(),
                this.deviceFacade.getStatus ? this.deviceFacade.getStatus("all") : Promise.resolve(Result.ok({ online: 0, offline: 0, total: 0 }))
            ]);

            // Check for failures
            if (todaySalesResult.isFailure) {
                return Result.fail(`Failed to get sales data: ${todaySalesResult.errorValue()}`);
            }

            // Aggregate all data
            const stats: DashboardStatsDTO = {
                todaySales: {
                    count: todaySalesResult.getValue().count,
                    revenue: todaySalesResult.getValue().revenue,
                    target: 10000000,
                    percentage: 75
                },
                weeklySales: weeklySalesResult.isSuccess ? weeklySalesResult.getValue() : { days: [], values: [] },
                lowStockItems: inventoryResult.isSuccess ? inventoryResult.getValue() : [],
                outOfStockItems: 0,
                totalProducts: productsResult.isSuccess ? productsResult.getValue() : 0,
                todayRevenue: todaySalesResult.getValue().revenue,
                weeklyRevenue: 0,
                monthlyRevenue: 0,
                newCustomersToday: customersResult.isSuccess ? customersResult.getValue() : 0,
                activeCustomers: 0,
                pendingOrders: 0,
                openTickets: 0,
                deviceStatus: devicesResult.isSuccess ? devicesResult.getValue() : { online: 0, offline: 0, total: 0 }
            };

            // Cache for 5 minutes
            this.cache.set(cacheKey, stats, 300);
            this.logger.debug('Dashboard stats cached', { cacheKey });

            return Result.ok(stats);
        } catch (error: any) {
            return Result.fail(`Dashboard aggregation failed: ${error.message}`);
        }
    }

    async getSalesChart(timeRange: TimeRangeDTO): Promise<Result<any>> {
        // Get sales data grouped by hour/day/month
        return this.salesFacade.getSalesChart(timeRange);
    }

    async getInventoryAlerts(): Promise<Result<any>> {
        // Get inventory alerts (low stock, expiring, etc.)
        return this.inventoryFacade.getAlerts ? this.inventoryFacade.getAlerts() : this.inventoryFacade.getLowStock();
    }
}
