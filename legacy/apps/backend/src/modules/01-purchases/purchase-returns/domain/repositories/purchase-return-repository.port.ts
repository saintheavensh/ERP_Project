import { TransactionContext } from "../../../../../shared/types/db-context";
import { PurchaseReturn, PurchaseReturnItem } from "../entities/purchase-return.entity";

export interface IPurchaseReturnRepository {
    findAll(tenantId: string, tx: TransactionContext): Promise<PurchaseReturn[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<PurchaseReturn | null>;
    create(tenantId: string, data: Omit<PurchaseReturn, 'items' | 'createdAt'>, tx: TransactionContext): Promise<PurchaseReturn>;
    createItems(tenantId: string, items: Omit<PurchaseReturnItem, 'id' | 'createdAt'>[], tx: TransactionContext): Promise<void>;
}
