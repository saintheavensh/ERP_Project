import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IServiceCategoryRepository {
    findAll(tenantId: string, tx: TransactionContext): Promise<any[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null>;
    create(tenantId: string, data: { name: string; description?: string | undefined; minWeight?: number | undefined; maxWeight?: number | undefined }, tx: TransactionContext): Promise<{ id: string }>;
    update(tenantId: string, id: string, data: Partial<{ name: string; description: string; minWeight: number; maxWeight: number }>, tx: TransactionContext): Promise<void>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
}
