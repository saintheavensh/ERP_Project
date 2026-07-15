import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class MapProductVariantUseCase {
    constructor(private readonly repository: ISupplierRepository) { }

    async execute(tenantId: string, supplierId: string, productId: string, variantId: string | null | undefined, tx: TransactionContext) {
        if (!supplierId) {
            throw new Error("Validation Error: Supplier ID is required");
        }
        if (!productId) {
            throw new Error("Validation Error: Product ID is required");
        }
        await this.repository.mapProductVariant(tenantId, supplierId, productId, variantId, tx);
    }
}
