import { TransactionContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";
import { ISupplierRepository, CreateSupplierData } from "../../domain";

export class CreateSupplierUseCase {
    constructor(private repository: ISupplierRepository) { }

    async execute(tenantId: string, data: Omit<CreateSupplierData, 'id'>, tx: TransactionContext) {
        const id = generateId(ID_PREFIX.SUPPLIER);
        const normalizedName = normalizeName(data.name);

        return await this.repository.create(tenantId, {
            ...data,
            id,
            name: normalizedName
        }, tx);
    }
}
