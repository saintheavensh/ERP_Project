import {
    ServiceToolRepositoryAdapter,
    NotificationGatewayAdapter
} from "./infrastructure";
import {
    GetServiceToolsUseCase,
    GetServiceToolByIdUseCase,
    CreateServiceToolUseCase,
    UpdateServiceToolUseCase,
    UpdateToolConditionUseCase,
    DeleteServiceToolUseCase,
    CreateToolRequestUseCase,
    GetToolRequestsUseCase,
    UpdateToolRequestStatusUseCase
} from "./application";
import { inventoryAuthority } from "../inventory/inventory-container";
import { TransactionContext } from "../../../shared/types/db-context";

// Adapters
const repository = new ServiceToolRepositoryAdapter();
const notificationGateway = new NotificationGatewayAdapter();

// Use Cases
const getServiceToolsUC = new GetServiceToolsUseCase(repository);
const getServiceToolByIdUC = new GetServiceToolByIdUseCase(repository);
const createServiceToolUC = new CreateServiceToolUseCase(repository);
const updateServiceToolUC = new UpdateServiceToolUseCase(repository);
const updateToolConditionUC = new UpdateToolConditionUseCase(repository);
const deleteServiceToolUC = new DeleteServiceToolUseCase(repository);

const createToolRequestUC = new CreateToolRequestUseCase(repository, notificationGateway);
const getToolRequestsUC = new GetToolRequestsUseCase(repository);
const updateToolRequestStatusUC = new UpdateToolRequestStatusUseCase(repository);

/**
 * ServiceToolsApplicationService — Facade for external and presentation layers.
 */
export class ServiceToolsApplicationService {
    async getAll(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getServiceToolsUC.execute(tx)
        );
    }

    async getByUserId(tenantId: string, userId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getServiceToolsUC.execute(tx, { userId })
        );
    }

    async getById(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getServiceToolByIdUC.execute(id, tx)
        );
    }

    async create(tenantId: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await createServiceToolUC.execute(data, tx)
        );
    }

    async update(tenantId: string, id: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await updateServiceToolUC.execute(id, data, tx)
        );
    }

    async updateCondition(tenantId: string, id: string, condition: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await updateToolConditionUC.execute(id, condition, tx)
        );
    }

    async delete(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await deleteServiceToolUC.execute(id, tx)
        );
    }

    // Requests
    async createRequest(tenantId: string, userId: string, userName: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await createToolRequestUC.execute(userId, userName, data, tx)
        );
    }

    async getMyRequests(tenantId: string, userId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getToolRequestsUC.execute(tx, { userId })
        );
    }

    async getAllRequests(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getToolRequestsUC.execute(tx)
        );
    }

    async updateRequestStatus(tenantId: string, id: string, status: "approved" | "rejected") {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await updateToolRequestStatusUC.execute(id, status, tx)
        );
    }
}

/** Singleton instance */
export const serviceToolsApplicationService = new ServiceToolsApplicationService();
