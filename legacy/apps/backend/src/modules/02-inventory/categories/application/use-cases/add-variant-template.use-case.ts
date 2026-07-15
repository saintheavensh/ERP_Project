import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";

export class AddVariantTemplateUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(categoryId: string, name: string, supplierId: string | undefined, tx: TransactionContext) {
        // 1. Add to Category with supplier
        const template = await this.repository.addVariantTemplate(categoryId, name, tx, supplierId);

        // 2. Propagate to ALL existing products in this category
        await this.repository.propagateVariantToProducts(categoryId, name, tx, supplierId);

        return template;
    }
}
