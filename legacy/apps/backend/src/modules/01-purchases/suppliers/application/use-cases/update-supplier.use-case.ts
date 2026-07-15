import { TransactionContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { ISupplierRepository, UpdateSupplierData } from "../../domain";

export class UpdateSupplierUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(tenantId: string, id: string, data: UpdateSupplierData, tx: TransactionContext) {
        const updateData: UpdateSupplierData = { ...data };
        if (data.name) {
            updateData.name = normalizeName(data.name);
        }

        return await this.repository.update(tenantId, id, updateData, tx);
    }
}
