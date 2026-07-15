import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { services } from "../../../../../shared/infrastructure/database/schema";

export class GetServiceStatsUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, filters: ReportFilters = {}) {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(services.dateIn, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(services.dateIn, end));
        }

        const servicesData = await this.repository.getServices(tenantId, conditions, tx);

        const statusCounts: Record<string, number> = {};
        let totalRevenue = 0;
        let completedCount = 0;

        for (const svc of servicesData) {
            const status = svc.status || 'antrian';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            if (svc.actualCost) {
                totalRevenue += svc.actualCost;
            }

            if (status === 'selesai' || status === 'diambil') {
                completedCount++;
            }
        }

        return {
            total: servicesData.length,
            completed: completedCount,
            byStatus: statusCounts,
            revenue: totalRevenue
        };
    }
}
