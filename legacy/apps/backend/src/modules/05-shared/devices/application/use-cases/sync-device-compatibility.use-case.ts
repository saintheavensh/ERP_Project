import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository } from "../../domain";

export class SyncDeviceCompatibilityUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(tenantId: string, deviceId: string, tx: DBContext) {
        const device = await this.repository.findById(tenantId, deviceId, tx);
        if (!device) return { count: 0, products: [] };

        const model = device.model.trim();

        // 1. Find candidate products where name contains the model
        const candidates = await this.repository.findProductsByName(tenantId, model, tx);

        let linkCount = 0;
        const linksToInsert = candidates.map(product => ({
            productId: product.id,
            deviceId: device.id
        }));

        if (linksToInsert.length > 0) {
            await this.repository.addCompatibilityLinks(tenantId, linksToInsert, tx);
            linkCount = linksToInsert.length;
        }

        return { count: linkCount, products: candidates.map((c: any) => c.name) };
    }
}
