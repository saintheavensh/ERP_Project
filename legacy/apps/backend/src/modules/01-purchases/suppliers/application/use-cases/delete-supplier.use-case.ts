import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository } from "../../domain";

export class DeleteSupplierUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext) {
        return await this.repository.delete(tenantId, id, tx);
    }
}
