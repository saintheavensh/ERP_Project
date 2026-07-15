import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";

export class GetCategoriesUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(tx: TransactionContext) {
        return await this.repository.findAll(tx);
    }
}
