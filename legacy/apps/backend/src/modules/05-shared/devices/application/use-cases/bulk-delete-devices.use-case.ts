import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository } from "../../domain";

export class BulkDeleteDevicesUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(tenantId: string, ids: string[], tx: DBContext) {
        return await this.repository.bulkDelete(tenantId, ids, tx);
    }
}
