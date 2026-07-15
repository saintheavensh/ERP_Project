/**
 * Use case: Reverse stock changes from a deleted/cancelled purchase.
 * Called by the purchases module during purchase deletion.
 */
import type { IStockMutationGateway } from "@domain/stock-mutation-gateway.port";
import type { ReverseStockInput } from "@domain/stock.types";
import type { TransactionContext } from "@shared/types/db-context";

export class ReverseStockUseCase {
    constructor(private readonly stockGateway: IStockMutationGateway) { }

    async execute(input: ReverseStockInput, tx: TransactionContext, tenantId?: string): Promise<void> {
        const affectedProductIds = new Set<string>();

        for (const item of input.items) {
            affectedProductIds.add(item.productId);

            if (item.batchId) {
                await this.stockGateway.updateBatchStockDelta(item.batchId, -item.qtyReceived, tx);
            }

            await this.stockGateway.updateProductStockDelta(item.productId, -item.qtyReceived, tx);
        }

        await this.stockGateway.assertStockConsistency([...affectedProductIds], tx);
    }
}
