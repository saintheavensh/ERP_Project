import { TransactionContext } from "../../../../../shared/types/db-context";
import { IDefectiveItemRepository, DefectiveItem, DefectiveItemStatus } from "../../domain";

export class GetDefectiveItemsUseCase {
    constructor(private readonly repository: IDefectiveItemRepository) { }

    async execute(tx: TransactionContext, status: DefectiveItemStatus = "pending"): Promise<DefectiveItem[]> {
        return await this.repository.findAll(status, tx);
    }
}
