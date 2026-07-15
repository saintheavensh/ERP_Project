import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class GetSupplierCategoriesUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(tenantId: string, supplierId: string, tx: TransactionContext) {
        return await this.repository.getLinkedCategories(tenantId, supplierId, tx);
    }
}
