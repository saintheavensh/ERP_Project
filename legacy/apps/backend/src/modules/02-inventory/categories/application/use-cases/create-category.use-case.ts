import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";

export interface CreateCategoryInput {
    name: string;
    description?: string;
    parentId?: string | null;
    variants?: string[];
}

export class CreateCategoryUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(data: CreateCategoryInput, tx: TransactionContext) {
        if (data.parentId) {
            const parent = await this.repository.findById(data.parentId, tx);
            if (!parent) {
                throw new Error("Parent category not found");
            }
        }
        const id = generateId(ID_PREFIX.CATEGORY);
        const category = await this.repository.create({
            id,
            name: data.name,
            description: data.description,
            parentId: data.parentId
        }, tx);

        if (data.variants && data.variants.length > 0) {
            for (const vName of data.variants) {
                await this.repository.addVariantTemplate(id, vName, tx);
            }
        }

        return category;
    }
}
