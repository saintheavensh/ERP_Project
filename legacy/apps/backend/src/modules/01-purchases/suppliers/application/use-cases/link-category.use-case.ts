import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class LinkCategoryUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(tenantId: string, supplierId: string, categoryId: string, tx: TransactionContext) {
        return await this.repository.addCategoryLink(tenantId, supplierId, categoryId, tx);
    }
}
