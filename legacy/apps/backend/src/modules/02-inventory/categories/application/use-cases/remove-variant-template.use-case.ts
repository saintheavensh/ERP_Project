import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";

export class RemoveVariantTemplateUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(id: string, tx: TransactionContext) {
        return await this.repository.removeVariantTemplate(id, tx);
    }
}
