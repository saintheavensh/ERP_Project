import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository, IDeviceFilters } from "../../domain";

export class GetDevicesUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(tenantId: string, filters: IDeviceFilters, tx: DBContext) {
        return await this.repository.findAll(tenantId, filters, tx);
    }
}
