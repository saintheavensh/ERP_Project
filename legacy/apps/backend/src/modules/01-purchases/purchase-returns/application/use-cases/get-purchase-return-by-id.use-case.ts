import { IPurchaseReturnRepository } from "../../domain";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class GetPurchaseReturnByIdUseCase {
    constructor(private returnRepo: IPurchaseReturnRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext) {
        return await this.returnRepo.findById(tenantId, id, tx);
    }
}
