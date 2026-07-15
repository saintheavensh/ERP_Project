import { DBContext } from "../../../../../shared/types/db-context";
import { IBrandRepository } from "../../domain";

export class GetBrandsUseCase {
    constructor(private repository: IBrandRepository) { }

    async execute(dbOrTx: DBContext) {
        return await this.repository.findAll(dbOrTx);
    }
}
