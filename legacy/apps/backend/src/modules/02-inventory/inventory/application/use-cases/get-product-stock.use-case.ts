import { TransactionContext } from "@shared/types/db-context";
import { IStockMovementRepository } from "@domain/stock-movement.repository";
import { Result } from "@shared/core/Result";

export class GetProductStockUseCase {
    constructor(private stockMovementRepo: IStockMovementRepository) { }

    async execute(productId: string, tx: TransactionContext): Promise<Result<number>> {
        if (!productId) {
            return Result.fail("Product ID is required");
        }

        const stock = await this.stockMovementRepo.getAggregatedStock(productId, tx);
        return Result.ok(stock);
    }
}
