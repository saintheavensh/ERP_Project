import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, TransactionReport } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { sales } from "../../../../../shared/infrastructure/database/schema";

export class GetTransactionsUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, filters: ReportFilters = {}): Promise<TransactionReport[]> {
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

        const salesData = await this.repository.getTransactions(tenantId, conditions, tx);

        return salesData.map((sale: any) => {
            let hpp = 0;
            let itemCount = 0;

            for (const item of (sale.items || [])) {
                itemCount += item.qty;
                const buyPrice = (item as any).batch?.buyPrice || 0;
                hpp += buyPrice * item.qty;
            }

            return {
                id: sale.id,
                date: sale.createdAt!,
                nota: sale.id,
                customerName: sale.customerName,
                items: itemCount,
                total: sale.totalAmount,
                hpp,
                profit: sale.totalAmount - hpp
            };
        });
    }
}
