import type { IStockOpnameRepository } from "@domain/stock-opname-repository.port";
import { TransactionContext } from "@shared/types/db-context";

export class GetOpnameSessionDetailsUseCase {
    constructor(private readonly stockOpnameRepository: IStockOpnameRepository) { }

    async execute(id: string, tx: TransactionContext) {
        const session = await this.stockOpnameRepository.findSessionById(id, tx);
        if (!session) return null;

        const items = await this.stockOpnameRepository.findItemsBySession(id, tx);
        return { ...session, items };
    }
}
