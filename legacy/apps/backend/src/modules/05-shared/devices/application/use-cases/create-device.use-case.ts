import { v4 as uuidv4 } from "uuid";
import { DBContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { IDeviceRepository, CreateDeviceData } from "../../domain";
import { brandsFacade } from "../../../../02-inventory/brands/brands-container";

export class CreateDeviceUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(tenantId: string, data: Omit<CreateDeviceData, 'id' | 'brand'> & { brand: string; id?: string }, tx: DBContext) {
        // 1. Normalize brand name
        const normalizedBrand = normalizeName(data.brand);

        // 2. Ensure brand exists (using BrandsFacade)
        let brand = await brandsFacade.findByName(tenantId, normalizedBrand, tx);

        if (!brand) {
            const brandId = normalizedBrand.toLowerCase().replace(/\s+/g, '-');
            const createdBrands = await brandsFacade.create(tenantId, {
                id: brandId,
                name: normalizedBrand
            }, tx);
            brand = createdBrands[0] || null;
        }

        // 3. Generate ID if not provided
        const id = data.id || `DEV-${uuidv4().substring(0, 8)}`;

        // 4. Create device
        const result = await this.repository.create(tenantId, {
            ...data,
            id,
            brand: normalizedBrand
        }, tx);

        return result;
    }
}
