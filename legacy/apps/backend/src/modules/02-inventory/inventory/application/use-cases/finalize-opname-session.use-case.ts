import type { IStockOpnameRepository, OpnameItemEntity } from "@domain/stock-opname-repository.port";
import type { IActivityLogger } from "@domain/activity-logger.port";
import { StockCalculator } from "@domain/services/stock-calculator";
import { TransactionContext } from "@shared/types/db-context";

export class FinalizeOpnameSessionUseCase {
    constructor(
        private readonly stockOpnameRepository: IStockOpnameRepository,
        private readonly activityLogger: IActivityLogger
    ) { }

    async execute(id: string, userId: string, tx: TransactionContext) {
        const repo = this.stockOpnameRepository;

        const session = await repo.findSessionById(id, tx);
        if (!session) throw new Error("Session not found");
        if (session.status !== "draft") throw new Error("Only draft sessions can be finalized");

        const items = await repo.findItemsBySession(id, tx);

        for (const item of items) {
            if (item.physicalStock === null) continue;

            const difference = item.difference;
            if (difference === 0) continue;

            await this.adjustBatches(item, difference, userId, id, tx);
            await repo.updateProductStockDelta(item.productId, difference, tx);
        }

        await repo.updateSessionStatus(id, "completed", new Date(), tx);

        await this.activityLogger.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Finalized stock opname session ${id}`
        }, tx);

        return { success: true };
    }

    /**
     * Adjust batch stock based on opname difference.
     * LOSS: deduct from oldest batches (FIFO) using StockCalculator.
     * SURPLUS: add to first batch.
     */
    private async adjustBatches(
        item: OpnameItemEntity,
        difference: number,
        userId: string,
        sessionId: string,
        tx: TransactionContext
    ) {
        const repo = this.stockOpnameRepository;
        const batches = await repo.findBatchesByProductAndVariant(
            item.productId,
            item.variantName !== "Standard" ? item.variantName : null,
            tx
        );

        if (difference < 0) {
            const requestedQty = Math.abs(difference);
            const { allocations } = StockCalculator.calculateFIFO(requestedQty, batches);

            for (const allocation of allocations) {
                const batch = batches.find(b => b.id === allocation.batchId);
                if (!batch) continue;

                const newStock = batch.currentStock - allocation.quantity;
                await repo.updateBatchStock(batch.id, newStock, tx);

                await this.activityLogger.log({
                    userId,
                    action: "UPDATE",
                    entityType: "product_batch",
                    entityId: batch.id,
                    description: `Stock adjusted (LOSS) via SO ${sessionId}. Batch reduction: -${allocation.quantity}`,
                    details: { oldValue: { stock: batch.currentStock }, newValue: { stock: newStock } }
                }, tx);
            }
        } else {
            if (batches.length > 0) {
                const firstBatch = batches[0];
                const newStock = firstBatch.currentStock + difference;

                await repo.updateBatchStock(firstBatch.id, newStock, tx);

                await this.activityLogger.log({
                    userId,
                    action: "UPDATE",
                    entityType: "product_batch",
                    entityId: firstBatch.id,
                    description: `Stock adjusted (SURPLUS) via SO ${sessionId}. Added: +${difference}`,
                    details: { oldValue: { stock: firstBatch.currentStock }, newValue: { stock: newStock } }
                }, tx);
            }
        }
    }
}
