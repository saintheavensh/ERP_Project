import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

export class GetCashierDashboardUseCase {
    constructor(private repository: IDashboardRepository) { }

    async execute(tenantId: string, tx: DBContext) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const stats = await this.repository.getCashierStats(tenantId, startOfDay, tx);

        return {
            readyPickup: stats.readyPickup,
            stats: {
                readyCount: (stats.readyPickup || []).length,
                pickedUpToday: stats.pickedUpToday,
                revenueToday: stats.revenueToday,
                pendingConfirm: stats.pendingConfirm
            }
        };
    }
}
