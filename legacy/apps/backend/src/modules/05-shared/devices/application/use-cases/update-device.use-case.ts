import { DBContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { IDeviceRepository, UpdateDeviceData } from "../../domain";

export class UpdateDeviceUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(tenantId: string, id: string, data: UpdateDeviceData, tx: DBContext) {
        const updateData = { ...data };
        if (data.brand) {
            updateData.brand = normalizeName(data.brand);
        }
        return await this.repository.update(tenantId, id, updateData, tx);
    }
}
