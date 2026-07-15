import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository } from "../../domain";

export class DeleteDeviceUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(tenantId: string, id: string, tx: DBContext) {
        return await this.repository.delete(tenantId, id, tx);
    }
}
