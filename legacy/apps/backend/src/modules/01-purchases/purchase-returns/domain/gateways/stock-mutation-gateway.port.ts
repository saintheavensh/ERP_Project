import { DBContext } from "../../../../../shared/types/db-context";

export interface IStockMutationGateway {
    /**
     * Deducts stock from a specific batch.
     */
    deductBatchStock(batchId: string, qty: number, dbOrTx?: DBContext): Promise<void>;

    /**
     * Updates the global product stock total.
     */
    updateProductStock(productId: string, delta: number, dbOrTx?: DBContext): Promise<void>;

    /**
     * Verifies if a batch exists and has sufficient stock.
     */
    getBatchStock(batchId: string, dbOrTx?: DBContext): Promise<{ productId: string, currentStock: number } | null>;
}
