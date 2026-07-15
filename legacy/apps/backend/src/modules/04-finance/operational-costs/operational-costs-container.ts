import { TransactionContext } from "../../../shared/types/db-context";
import {
    OperationalCostRepositoryAdapter,
    AccountingGatewayAdapter
} from "./infrastructure";
import {
    GetOperationalCostsUseCase,
    CreateOperationalCostUseCase,
    MarkAsPaidUseCase,
    DeleteOperationalCostUseCase
} from "./application";

// Adapters
const repository = new OperationalCostRepositoryAdapter();
const accountingGateway = new AccountingGatewayAdapter();

// Use Cases
const getCostsUC = new GetOperationalCostsUseCase(repository);
const createCostUC = new CreateOperationalCostUseCase(repository, accountingGateway);
const markAsPaidUC = new MarkAsPaidUseCase(repository, accountingGateway);
const deleteCostUC = new DeleteOperationalCostUseCase(repository);

/**
 * OperationalCostsService — Facade for external and presentation layers.
 */
export class OperationalCostsService {
    async getAll(tenantId: string, tx: TransactionContext) {
        return await getCostsUC.execute(tenantId, 100, tx);
    }

    async create(tenantId: string, data: any, tx: TransactionContext, userId?: string) {
        return await createCostUC.execute(tenantId, data, tx, userId);
    }

    async markAsPaid(tenantId: string, id: string, paymentData: any, tx: TransactionContext, userId?: string) {
        return await markAsPaidUC.execute(tenantId, id, paymentData, tx, userId);
    }

    async delete(tenantId: string, id: string, tx: TransactionContext) {
        return await deleteCostUC.execute(tenantId, id, tx);
    }
}

/** Singleton instance */
export const operationalCostsService = new OperationalCostsService();
