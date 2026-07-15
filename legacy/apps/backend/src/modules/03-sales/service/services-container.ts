
import {
    ServiceRepositoryAdapter,
    AccountingGatewayAdapter,
    InventoryGatewayAdapter,
    NotificationGatewayAdapter,
    SettingsGatewayAdapter,
    UserGatewayAdapter
} from "./infrastructure";
import {
    GetServicesUseCase,
    GetServiceCountsUseCase,
    GetServiceByIdUseCase,
    GetTechnicianDashboardStatsUseCase,
    CreateServiceUseCase,
    UpdateServiceStatusUseCase,
    AssignTechnicianUseCase,
    UpdateServiceDetailsUseCase,
    PatchServiceUseCase,
    DeleteServiceUseCase
} from "./application";

// Adapters
const repository = new ServiceRepositoryAdapter();
const accountingGateway = new AccountingGatewayAdapter();
const inventoryGateway = new InventoryGatewayAdapter();
const notificationGateway = new NotificationGatewayAdapter();
const settingsGateway = new SettingsGatewayAdapter();
const userGateway = new UserGatewayAdapter();

// Use Cases
const getServicesUC = new GetServicesUseCase(repository);
const getServiceCountsUC = new GetServiceCountsUseCase(repository);
const getServiceByIdUC = new GetServiceByIdUseCase(repository);
const getTechnicianDashboardStatsUC = new GetTechnicianDashboardStatsUseCase(repository);
const createServiceUC = new CreateServiceUseCase(repository, accountingGateway, notificationGateway);
const updateServiceStatusUC = new UpdateServiceStatusUseCase(repository, accountingGateway, inventoryGateway, notificationGateway);
const assignTechnicianUC = new AssignTechnicianUseCase(repository, userGateway, notificationGateway);
const updateServiceDetailsUC = new UpdateServiceDetailsUseCase(repository);
const patchServiceUC = new PatchServiceUseCase(repository, settingsGateway);
const deleteServiceUC = new DeleteServiceUseCase(repository);

import { inventoryAuthority } from "../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../shared/types/db-context";

/**
 * ServiceApplicationService — Facade for external and presentation layers.
 */
export class ServiceApplicationService {
    async getAll(tenantId: string, params: { status?: string; technicianId?: string }) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getServicesUC.execute(tenantId, params, tx)
        );
    }

    async getCounts(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getServiceCountsUC.execute(tenantId, tx)
        );
    }

    async getById(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getServiceByIdUC.execute(tenantId, id, tx)
        );
    }

    async getTechnicianDashboardStats(tenantId: string, userId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => {
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return await getTechnicianDashboardStatsUC.execute(tenantId, userId, startDate, endDate, tx);
            }
        );
    }

    async createService(tenantId: string, data: any, userId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await createServiceUC.execute(tenantId, data, userId, tx)
        );
    }

    async updateStatus(tenantId: string, id: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await updateServiceStatusUC.execute(tenantId, id, data, tx)
        );
    }

    async assignTechnician(tenantId: string, id: string, technicianId: string, userId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await assignTechnicianUC.execute(tenantId, id, technicianId, userId, tx)
        );
    }

    async updateDetails(tenantId: string, id: string, data: any, userId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await updateServiceDetailsUC.execute(tenantId, id, data, userId, tx)
        );
    }

    async patchService(tenantId: string, id: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await patchServiceUC.execute(tenantId, id, data, tx)
        );
    }

    async delete(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await deleteServiceUC.execute(tenantId, id, tx)
        );
    }
}

/** Singleton instance */
export const serviceApplicationService = new ServiceApplicationService();
