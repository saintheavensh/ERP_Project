import { DBContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { IBrandRepository, CreateBrandData } from "../../domain";

export class CreateBrandUseCase {
    constructor(private repository: IBrandRepository) { }

    async execute(data: CreateBrandData, dbOrTx: DBContext) {
        // 1. Normalize brand name: capitalize first letter
        const normalizedName = normalizeName(data.name);

        // 2. Check if brand with same name (case-insensitive) already exists
        const existing = await this.repository.findByName(normalizedName, dbOrTx);
        if (existing) {
            // Return existing brand instead of creating duplicate (matches previous behavior)
            return [existing];
        }

        // 3. Ensure ID is lowercase/slugified
        const id = data.id.toLowerCase().replace(/\s+/g, '-');

        // 4. Create via repository
        return await this.repository.create({
            ...data,
            id,
            name: normalizedName,
        }, dbOrTx);
    }
}
