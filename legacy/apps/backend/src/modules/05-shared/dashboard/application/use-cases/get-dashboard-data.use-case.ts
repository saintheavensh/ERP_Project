import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

interface IReportsFacade {
    getSalesSummary(tenantId: string, filters: any, tx?: DBContext): Promise<any>;
    getServiceStats(tenantId: string, filters: any, tx?: DBContext): Promise<any>;
}

export class GetDashboardDataUseCase {
    constructor(
        private repository: IDashboardRepository,
        private reportsFacade: IReportsFacade
    ) { }

    async execute(tenantId: string, tx: DBContext) {
        // Time Ranges
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 86400000 - 1);

        // 1. Cards Data
        const salesStats = await this.reportsFacade.getSalesSummary(tenantId, {
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        }, tx);
        const serviceStats = await this.reportsFacade.getServiceStats(tenantId, {
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
        }, tx);

        const totalRevenueToday = (salesStats?.totalRevenue || 0) + (serviceStats?.revenue || 0);

        const activeServices = await this.repository.getActiveServicesCount(tenantId, tx);
        const readyPickup = await this.repository.getReadyPickupCount(tenantId, tx);
        const lowStock = await this.repository.getLowStockCount(tenantId, tx);
        const pendingVerifications = await this.repository.getPendingVerificationsCount(tenantId, tx);

        // 2. Charts Data
        const topProducts = await this.repository.getTopProducts(tenantId, 10, tx);
        const revenueTrend = await this.getRevenueTrend7Days(tenantId, tx);
        const procurementTasks = await this.repository.getProcurementTasks(tenantId, 5, tx);

        return {
            cards: {
                revenueToday: totalRevenueToday,
                activeServices,
                readyPickup,
                lowStock,
                pendingVerifications
            },
            charts: {
                revenueTrend,
                topProducts: (topProducts || []).map((p: any) => ({ name: p.name, value: p.sold }))
            },
            procurementTasks
        };
    }

    private async getRevenueTrend7Days(tenantId: string, tx: DBContext) {
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const startStr = d.toISOString().slice(0, 10);

            const sStart = new Date(d.setHours(0, 0, 0, 0)).toISOString();
            const sEnd = new Date(d.setHours(23, 59, 59, 999)).toISOString();

            const pSales = await this.reportsFacade.getSalesSummary(tenantId, { startDate: sStart, endDate: sEnd }, tx);
            const pService = await this.reportsFacade.getServiceStats(tenantId, { startDate: sStart, endDate: sEnd }, tx);

            result.push({
                date: startStr,
                revenue: (pSales?.totalRevenue || 0) + (pService?.revenue || 0)
            });
        }
        return result;
    }
}
