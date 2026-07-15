import { TransactionContext } from "@shared/types/db-context";
import { IStockOpnameRepository } from "@domain/stock-opname-repository.port";
import { Result } from "@shared/core/Result";
import { RecordStockMovementUseCase } from "./record-stock-movement.use-case";
import { GetProductStockUseCase } from "./get-product-stock.use-case";

export interface FinalizeStockOpnameInput {
    sessionId: string;
}

export class FinalizeStockOpnameUseCase {
    constructor(
        private opnameRepo: IStockOpnameRepository,
        private getStockUseCase: GetProductStockUseCase,
        private recordStockMovementUseCase: RecordStockMovementUseCase
        // TODO: Validate roles dynamically (if required)
    ) { }

    async execute(data: FinalizeStockOpnameInput, tx?: TransactionContext): Promise<Result<any>> {
        // TODO: 1. Retrieve the ongoing StockOpname session and its associated items.
        // TODO: 2. Begin DB Transaction

        // TODO: 3. For each specific opname item record:
        //       a. Compute true stock by calling `GetProductStockUseCase`.
        //       b. Calculate difference: difference = physicalCount - computedLedgerStock.
        //       c. Update OpnameItem record holding the computed difference.
        //       d. if (difference !== 0) {
        //              Call RecordStockMovementUseCase with type="ADJUSTMENT" with quantity = difference.
        //          }

        // TODO: 4. Mark StockOpnameSession status as "COMPLETED"

        return Result.ok("Stock Opname finalized successfully");
    }
}
