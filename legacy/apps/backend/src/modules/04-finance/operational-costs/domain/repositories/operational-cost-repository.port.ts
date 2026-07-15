import { TransactionContext } from "../../../../../shared/types/db-context";
import { OperationalCost } from "../entities/operational-cost.entity";

export interface IOperationalCostRepository {
    findAll(tenantId: string, tx: TransactionContext, limit?: number | undefined): Promise<OperationalCost[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<OperationalCost | null>;
    create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }>;
    update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<void>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
}
