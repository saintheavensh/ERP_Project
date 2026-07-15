import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class UnlinkCategoryUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(tenantId: string, supplierId: string, categoryId: string, tx: TransactionContext) {
        return await this.repository.removeCategoryLink(tenantId, supplierId, categoryId, tx);
    }
}
