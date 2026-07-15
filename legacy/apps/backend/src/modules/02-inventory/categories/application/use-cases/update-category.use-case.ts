import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { categories } from "../../../../../shared/infrastructure/database/schema";

export class UpdateCategoryUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(id: string, data: Partial<typeof categories.$inferInsert>, tx: TransactionContext) {
        return await this.repository.update(id, data, tx);
    }
}
