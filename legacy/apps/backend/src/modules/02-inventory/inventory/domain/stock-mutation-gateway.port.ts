import type { BatchLike } from "./services/stock-calculator";
import type { TransactionContext } from "@shared/types/db-context";
export type { BatchLike };

export interface InsertBatchData {
    id: string;
    productId: string;
    supplierId: string | null;
    variantId: string | null;
    buyPrice: number;
    sellPrice: number;
    supplierName?: string | null;
    initialStock: number;
    currentStock: number;
    warrantyEndDate?: Date | null;
}

export interface IStockMutationGateway {
    /** Find batches for a product and variant, ordered by creation (FIFO). */
    findBatchesForFIFO(productId: string, variantName: string | null, tx: TransactionContext): Promise<BatchLike[]>;

    /** Update a batch's current stock by a delta. */
    updateBatchStockDelta(batchId: string, delta: number, tx: TransactionContext): Promise<void>;

    /** Update a product's total stock by a delta. */
    updateProductStockDelta(productId: string, delta: number, tx: TransactionContext): Promise<void>;

    /** Insert a new stock batch. */
    insertBatch(data: InsertBatchData, tx: TransactionContext): Promise<void>;

    /** Assert that product.stock matches sum(batches.current_stock). */
    assertStockConsistency(productIds: string[], tx: TransactionContext): Promise<void>;
}
