import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository } from "../../domain";

export class GetUnlinkedProductsUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(tenantId: string, limit: number = 50, offset: number = 0, tx: DBContext) {
        return await this.repository.getUnlinkedProducts(tenantId, limit, offset, tx);
    }
}
