import { DBContext } from "../../../../../shared/types/db-context";
import { IBrandRepository } from "../../domain";

export class DeleteBrandUseCase {
    constructor(private repository: IBrandRepository) { }

    async execute(id: string, dbOrTx: DBContext) {
        return await this.repository.delete(id, dbOrTx);
    }
}
