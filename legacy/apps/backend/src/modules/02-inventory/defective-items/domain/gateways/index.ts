import type { TransactionContext } from "../../../../../shared/types/db-context";
import type { ProductBatchEntity } from "../../../inventory/domain/batch-repository.port";

export interface IInventoryGateway {
    getBatch(batchId: string, tx: TransactionContext): Promise<ProductBatchEntity | null>;
    reduceStock(batchId: string, qty: number, tx: TransactionContext): Promise<void>;
}

export interface IPurchaseReturnGateway {
    createReturn(params: {
        supplierId: string;
        userId: string;
        items: Array<{
            productId: string;
            batchId: string;
            qty: number;
            reason: string;
        }>;
        notes?: string;
    }, tx: TransactionContext): Promise<{ returnId: string }>;
}
