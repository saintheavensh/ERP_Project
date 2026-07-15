import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class GetPurchasesUseCase {
    constructor(private purchaseRepo: IPurchaseRepository) { }
    async execute(tenantId: string, filters: any, tx: TransactionContext) {
        return await this.purchaseRepo.findAll(tenantId, filters, tx);
    }
}

export class GetPurchaseByIdUseCase {
    constructor(private purchaseRepo: IPurchaseRepository) { }
    async execute(tenantId: string, id: string, tx: TransactionContext) {
        return await this.purchaseRepo.findById(tenantId, id, tx);
    }
}
