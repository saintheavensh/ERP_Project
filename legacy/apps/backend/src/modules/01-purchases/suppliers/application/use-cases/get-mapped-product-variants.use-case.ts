import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class GetMappedProductVariantsUseCase {
    constructor(private readonly repository: ISupplierRepository) { }

    async execute(tenantId: string, supplierId: string, tx: TransactionContext) {
        if (!supplierId) {
            throw new Error("Validation Error: Supplier ID is required");
        }
        return await this.repository.getMappedProductVariants(tenantId, supplierId, tx);
    }
}
