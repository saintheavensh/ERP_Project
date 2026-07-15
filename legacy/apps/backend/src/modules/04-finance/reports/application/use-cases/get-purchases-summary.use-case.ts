import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, PurchasesSummary } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { purchases } from "../../../../../shared/infrastructure/database/schema";

export class GetPurchasesSummaryUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, filters: ReportFilters = {}): Promise<PurchasesSummary> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(purchases.date, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(purchases.date, end));
        }

        const purchasesData = await this.repository.getPurchases(tenantId, conditions, tx);

        let totalAmount = 0;
        let totalItems = 0;

        for (const purchase of purchasesData) {
            totalAmount += purchase.totalAmount;
            for (const item of (purchase.items || [])) {
                totalItems += item.qtyReceived;
            }
        }

        return {
            totalAmount,
            totalTransactions: purchasesData.length,
            totalItems
        };
    }
}
