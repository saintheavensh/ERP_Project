import type { IStockMutationGateway } from "@domain/stock-mutation-gateway.port";
import type { IBatchRepository } from "@domain/batch-repository.port";
import type { TransactionContext } from "@shared/types/db-context";

export class ReduceBatchStockUseCase {
    constructor(
        private readonly stockGateway: IStockMutationGateway,
        private readonly batchRepository: IBatchRepository
    ) { }

    async execute(batchId: string, qty: number, tx: TransactionContext, tenantId?: string): Promise<void> {
        const batch = await this.batchRepository.findById(batchId, tx);
        if (!batch) {
            throw new Error(`Batch ${batchId} not found.`);
        }
        if (batch.currentStock < qty) {
            throw new Error(`Batch ${batchId} has insufficient stock. Available: ${batch.currentStock}, Requested: ${qty}`);
        }

        await this.stockGateway.updateBatchStockDelta(batchId, -qty, tx);

        // Adjust parent
        await this.stockGateway.updateProductStockDelta(batch.productId, -qty, tx);

        // Assert
        await this.stockGateway.assertStockConsistency([batch.productId], tx);
    }
}
