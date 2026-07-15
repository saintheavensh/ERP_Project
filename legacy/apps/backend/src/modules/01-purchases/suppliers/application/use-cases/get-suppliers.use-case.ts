import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class GetSuppliersUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(tenantId: string, tx: TransactionContext) {
        return await this.repository.findAll(tenantId, tx);
    }
}
