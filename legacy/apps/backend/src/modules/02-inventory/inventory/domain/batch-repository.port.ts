import { TransactionContext } from "../../../../shared/types/db-context";

/**
 * Port for batch lookup operations.
 * Split from IProductRepository since batch data belongs to the stock domain.
 */

export interface ProductBatchEntity {
    id: string;
    productId: string;
    supplierId: string | null;
    variantId: string | null;
    buyPrice: number;
    sellPrice: number;
    initialStock: number;
    currentStock: number;
    supplier?: { id: string; name: string } | null;
    createdAt?: Date | null;
}

export interface IBatchRepository {
    getLastBatchByProduct(productId: string, tx: TransactionContext): Promise<ProductBatchEntity | null>;
    findById(batchId: string, tx: TransactionContext): Promise<ProductBatchEntity | null>;
}
