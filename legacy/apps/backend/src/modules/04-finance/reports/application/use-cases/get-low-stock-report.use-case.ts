import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository } from "../../domain";

export class GetLowStockReportUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, threshold: number = 5) {
        return await this.repository.getLowStockItems(tenantId, threshold, tx);
    }
}
