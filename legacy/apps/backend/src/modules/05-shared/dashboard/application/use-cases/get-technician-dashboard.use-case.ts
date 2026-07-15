import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

export class GetTechnicianDashboardUseCase {
    constructor(private repository: IDashboardRepository) { }

    async execute(tenantId: string, technicianId: string, tx: DBContext) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const activeJobs = await this.repository.getTechnicianJobs(tenantId, technicianId, tx);
        const queue = await this.repository.getTechnicianQueue(tenantId, 10, tx);
        const stats = await this.repository.getTechnicianStats(tenantId, technicianId, startOfDay, tx);

        return {
            activeJobs,
            queue,
            stats
        };
    }
}
