import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

export class GetWarehouseDashboardUseCase {
    constructor(private repository: IDashboardRepository) { }

    async execute(tenantId: string, tx: DBContext) {
        const stats = await this.repository.getWarehouseStats(tenantId, tx);
        const incomingOrders = await this.repository.getIncomingOrders(tenantId, 5, tx);
        const lowStock = await this.repository.getLowStockProducts(tenantId, 10, tx);

        return {
            stats,
            incomingOrders,
            lowStock
        };
    }
}
