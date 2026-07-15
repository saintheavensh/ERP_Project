import { IPurchaseReturnRepository } from "../../domain";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class GetPurchaseReturnsUseCase {
    constructor(private returnRepo: IPurchaseReturnRepository) { }

    async execute(tenantId: string, tx: TransactionContext) {
        return await this.returnRepo.findAll(tenantId, tx);
    }
}
