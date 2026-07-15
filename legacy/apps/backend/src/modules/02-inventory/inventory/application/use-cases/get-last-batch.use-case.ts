/**
 * Use case: Get the last batch for a product.
 * Used by purchases module to determine pricing context.
 */
import type { IBatchRepository, ProductBatchEntity } from "@domain/batch-repository.port";
import type { TransactionContext } from "@shared/types/db-context";

export class GetLastBatchUseCase {
    constructor(private readonly batchRepository: IBatchRepository) { }

    async execute(productId: string, tx: TransactionContext): Promise<ProductBatchEntity | null> {
        return this.batchRepository.getLastBatchByProduct(productId, tx);
    }
}
