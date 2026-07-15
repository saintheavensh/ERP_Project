import { DBContext } from "@shared/types/db-context";
import { IInventoryGateway } from "../../../../03-sales/sales/domain/gateways";
import { RecordStockMovementUseCase } from "../use-cases/record-stock-movement.use-case";
import {
    IInventoryTransactionService,
    DeductForSaleInput,
    DeductForSaleResult,
    StockAllocation
} from "./inventory-transaction.service";

/**
 * Domain error: allocated quantity does not match requested quantity.
 */
export class AllocationIntegrityError extends Error {
    constructor(productId: string, variant: string, expected: number, actual: number) {
        super(
            `Allocation integrity failed for product ${productId} (variant: ${variant || "default"}). ` +
            `Expected: ${expected}, Allocated: ${actual}`
        );
        this.name = "AllocationIntegrityError";
    }
}

/**
 * Domain error: insufficient stock for FIFO deduction.
 */
export class InsufficientStockError extends Error {
    constructor(productId: string) {
        super(`Insufficient stock for product ${productId} during FIFO deduction.`);
        this.name = "InsufficientStockError";
    }
}

/**
 * Orchestrates FIFO batch deduction → allocation validation → ledger recording.
 *
 * Flow:
 * 1. Call inventoryGateway.deductStockFIFO (batch stock only, NO ledger writes)
 * 2. Validate allocation integrity (allocated qty == requested qty per product+variant)
 * 3. Record OUT stock movements via RecordStockMovementUseCase (immutable ledger)
 * 4. Return allocations + totalCOGS
 */
export class InventoryTransactionServiceImpl implements IInventoryTransactionService {
    constructor(
        private readonly inventoryGateway: IInventoryGateway,
        private readonly recordStockMovementUseCase: RecordStockMovementUseCase
    ) { }

    async deductForSale(input: DeductForSaleInput, tx: DBContext): Promise<DeductForSaleResult> {
        const { referenceId, items } = input;

        // 1. FIFO batch deduction (only mutates batch stock, no ledger writes)
        const { allocations, cogsAmount } = await this.inventoryGateway.deductStockFIFO({
            saleId: referenceId,
            items: items.map(i => ({
                productId: i.productId,
                variant: i.variant || "",
                quantity: i.quantity,
                unitPrice: 0 // unitPrice is not needed for deduction, COGS is computed by gateway
            }))
        }, tx);

        // 2. Validate allocation integrity
        // Aggregate allocated quantity per (productId + variant)
        const allocatedMap = new Map<string, number>();
        for (const a of allocations) {
            const key = `${a.productId}|${a.variantName || ""}`;
            allocatedMap.set(key, (allocatedMap.get(key) || 0) + a.quantity);
        }

        // Compare against requested quantities
        for (const item of items) {
            const key = `${item.productId}|${item.variant || ""}`;
            const allocatedQty = allocatedMap.get(key) || 0;

            if (allocatedQty !== item.quantity) {
                if (allocatedQty < item.quantity) {
                    throw new InsufficientStockError(item.productId);
                }
                throw new AllocationIntegrityError(
                    item.productId,
                    item.variant || "",
                    item.quantity,
                    allocatedQty
                );
            }
        }

        // 3. Record immutable stock movements (OUT) in the ledger
        for (const item of items) {
            const movementResult = await this.recordStockMovementUseCase.execute({
                productId: item.productId,
                type: "OUT",
                referenceType: "SALE",
                referenceId: referenceId,
                quantity: item.quantity
            }, tx);

            if (movementResult.isFailure) {
                throw new Error(
                    `Stock ledger recording failed for product ${item.productId}: ${movementResult.error}`
                );
            }
        }

        // 4. Return typed allocations + totalCOGS
        const typedAllocations: StockAllocation[] = allocations.map((a: any) => ({
            productId: a.productId,
            batchId: a.batchId,
            variantName: a.variantName,
            quantity: a.quantity
        }));

        return {
            allocations: typedAllocations,
            totalCOGS: cogsAmount
        };
    }
}
