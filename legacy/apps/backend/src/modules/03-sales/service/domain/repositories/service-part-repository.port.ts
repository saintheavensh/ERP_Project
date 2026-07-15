import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IServicePartRepository {
    findByServiceItemId(tenantId: string, serviceItemId: string, tx: TransactionContext): Promise<any[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null>;
    create(tenantId: string, data: { serviceItemId: string; variantBatchId?: string | undefined; quantity: number; purchasePrice?: number | undefined; sellingPrice: number; notes?: string | undefined }, tx: TransactionContext): Promise<{ id: string }>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
}
