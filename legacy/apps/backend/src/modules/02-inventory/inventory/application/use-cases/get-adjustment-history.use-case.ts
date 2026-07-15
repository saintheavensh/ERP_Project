import type { IStockOpnameRepository } from "@domain/stock-opname-repository.port";
import { TransactionContext } from "@shared/types/db-context";

export class GetAdjustmentHistoryUseCase {
    constructor(private readonly stockOpnameRepository: IStockOpnameRepository) { }

    async execute(tx: TransactionContext) {
        return this.stockOpnameRepository.getAdjustmentHistoryRows(tx);
    }
}
