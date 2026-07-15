import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, SalesSummary } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { sales } from "../../../../../shared/infrastructure/database/schema";

export class GetSalesSummaryUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, filters: ReportFilters = {}): Promise<SalesSummary> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(sales.createdAt, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(sales.createdAt, end));
        }

        const salesData = await this.repository.getSalesData(tenantId, conditions, tx);

        let totalRevenue = 0;
        let totalHPP = 0;
        let totalItems = 0;

        for (const sale of salesData) {
            totalRevenue += sale.totalAmount;

            for (const item of (sale.items || [])) {
                totalItems += item.qty;
                const buyPrice = (item as any).batch?.buyPrice || 0;
                totalHPP += buyPrice * item.qty;
            }
        }

        const totalProfit = totalRevenue - totalHPP;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalHPP,
            totalProfit,
            totalTransactions: salesData.length,
            totalItems,
            profitMargin: Math.round(profitMargin * 100) / 100
        };
    }
}
