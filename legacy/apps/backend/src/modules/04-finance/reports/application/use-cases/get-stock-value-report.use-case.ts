import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, StockValueReport } from "../../domain";

export class GetStockValueReportUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext): Promise<StockValueReport> {
        const categoriesData = await this.repository.getCategoriesWithStock(tenantId, tx);

        let totalItems = 0;
        let totalStock = 0;
        let totalValueHPP = 0;
        let totalValueSell = 0;
        const categoryStats = [];

        for (const cat of categoriesData) {
            let catStock = 0;
            let catValue = 0;

            for (const prod of (cat.products || [])) {
                totalItems++;
                for (const batch of (prod.batches || [])) {
                    catStock += batch.currentStock;
                    totalStock += batch.currentStock;

                    const hpp = batch.buyPrice * batch.currentStock;
                    const sell = batch.sellPrice * batch.currentStock;

                    catValue += hpp;
                    totalValueHPP += hpp;
                    totalValueSell += sell;
                }
            }

            categoryStats.push({
                name: cat.name,
                stock: catStock,
                value: catValue
            });
        }

        return {
            totalItems,
            totalStock,
            totalValueHPP,
            totalValueSell,
            potentialProfit: totalValueSell - totalValueHPP,
            categories: categoryStats
        };
    }
}
