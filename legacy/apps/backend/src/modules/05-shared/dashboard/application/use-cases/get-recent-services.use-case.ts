import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

export class GetRecentServicesUseCase {
    constructor(private repository: IDashboardRepository) { }

    async execute(tenantId: string, limit: number, tx: DBContext) {
        return await this.repository.getRecentServices(tenantId, limit, tx);
    }
}
