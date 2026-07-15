import { DBContext } from "@shared/types/db-context";

/**
 * Allocation result for a single batch deduction.
 */
export interface StockAllocation {
    productId: string;
    batchId: string;
    variantName?: string;
    quantity: number;
}

/**
 * Input for deducting stock during a sale.
 */
export interface DeductForSaleInput {
    referenceId: string;
    items: Array<{
        productId: string;
        variant?: string;
        quantity: number;
    }>;
}

/**
 * Result of a deductForSale operation.
 */
export interface DeductForSaleResult {
    allocations: StockAllocation[];
    totalCOGS: number;
}

/**
 * Orchestrates inventory mutations for transactional flows.
 * Ensures FIFO deduction + ledger recording are atomic and consistent.
 *
 * Constraints:
 * - inventoryGateway.deductStockFIFO MUST only update batch stock (no ledger writes).
 * - Ledger entries are written ONLY via RecordStockMovementUseCase.
 * - Allocation integrity is validated before ledger recording.
 * - All operations run inside the same DB transaction (tx).
 */
export interface IInventoryTransactionService {
    deductForSale(input: DeductForSaleInput, tx: DBContext): Promise<DeductForSaleResult>;
}
