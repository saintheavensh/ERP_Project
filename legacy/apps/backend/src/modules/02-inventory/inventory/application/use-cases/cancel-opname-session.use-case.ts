import type { IStockOpnameRepository, OpnameStatus } from "@domain/stock-opname-repository.port";
import type { IActivityLogger } from "@domain/activity-logger.port";
import { TransactionContext } from "@shared/types/db-context";

export class CancelOpnameSessionUseCase {
    constructor(
        private readonly stockOpnameRepository: IStockOpnameRepository,
        private readonly activityLogger: IActivityLogger
    ) { }

    async execute(id: string, userId: string, tx: TransactionContext) {
        await this.stockOpnameRepository.updateSessionStatus(id, "cancelled", undefined, tx);

        await this.activityLogger.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Cancelled stock opname session ${id}`
        }, tx);
    }
}
