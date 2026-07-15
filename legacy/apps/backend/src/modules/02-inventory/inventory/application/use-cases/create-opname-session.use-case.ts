import type { IStockOpnameRepository, OpnameBatchEntity } from "@domain/stock-opname-repository.port";
import type { IActivityLogger } from "@domain/activity-logger.port";
import { StockCalculator } from "@domain/services/stock-calculator";
import { TransactionContext } from "@shared/types/db-context";

export class CreateOpnameSessionUseCase {
    constructor(
        private readonly stockOpnameRepository: IStockOpnameRepository,
        private readonly activityLogger: IActivityLogger
    ) { }

    async execute(userId: string, tx: TransactionContext, notes?: string, categoryId?: string): Promise<string> {
        const repo = this.stockOpnameRepository;
        const sessionId = `SO-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`;

        await repo.insertSession({ id: sessionId, userId, notes, status: "draft" }, tx);

        let batches: OpnameBatchEntity[];
        if (categoryId) {
            const productIds = await repo.findProductIdsByCategory(categoryId, tx);
            if (productIds.length > 0) {
                batches = await repo.findAllBatches(productIds, tx);
            } else {
                batches = [];
            }
        } else {
            batches = await repo.findAllBatches(undefined, tx);
        }

        const items = StockCalculator.groupBatchesIntoOpnameItems(sessionId, batches);
        if (items.length > 0) {
            await repo.insertItems(items, tx);
        }

        await this.activityLogger.log({
            userId,
            action: "CREATE",
            entityType: "stock_opname",
            entityId: sessionId,
            description: `Started new stock opname session ${sessionId}`
        }, tx);

        return sessionId;
    }
}
