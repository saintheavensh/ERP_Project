import type { IStockOpnameRepository } from "@domain/stock-opname-repository.port";
import { TransactionContext } from "@shared/types/db-context";

export class UpdateOpnameItemUseCase {
    constructor(private readonly stockOpnameRepository: IStockOpnameRepository) { }

    async execute(itemId: number, physicalStock: number, reason: string | undefined, tx: TransactionContext) {
        const item = await this.stockOpnameRepository.updateItem(itemId, physicalStock, reason, tx);
        if (!item) throw new Error("Item not found");
        return { difference: item.difference };
    }
}
