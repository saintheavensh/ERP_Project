import { DBContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { IBrandRepository, UpdateBrandData } from "../../domain";

export class UpdateBrandUseCase {
    constructor(private repository: IBrandRepository) { }

    async execute(id: string, data: UpdateBrandData, dbOrTx: DBContext) {
        const updateData: UpdateBrandData = { ...data };
        if (data.name) {
            updateData.name = normalizeName(data.name);
        }

        return await this.repository.update(id, updateData, dbOrTx);
    }
}
