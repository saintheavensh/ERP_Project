import { TransactionContext } from "@shared/types/db-context";
import { IStockMovementRepository } from "@domain/stock-movement.repository";
import { StockMovementEntity, StockMovementType, StockReferenceType } from "@domain/stock-movement.entity";
import { generateId, ID_PREFIX } from "@shared/utils/validation/IdGenerator";
import type { IProductRepository } from "../../../products/domain/ports/IProductRepository";
import { Result } from "@shared/core/Result";

export interface RecordStockMovementInput {
    productId: string;
    type: StockMovementType;
    referenceType: StockReferenceType;
    referenceId: string;
    quantity: number;
}

export class RecordStockMovementUseCase {
    constructor(
        private stockMovementRepo: IStockMovementRepository,
        private productRepo: IProductRepository
    ) { }

    async execute(data: RecordStockMovementInput, tx: TransactionContext, tenantId?: string): Promise<Result<StockMovementEntity>> {
        if (!data.productId) return Result.fail("Product ID is required");

        // Quantity validation
        if (data.quantity === 0) {
            return Result.fail("Quantity cannot be zero");
        }
        if (data.type === "IN" && data.quantity < 0) {
            return Result.fail("IN movements must have a quantity > 0");
        }

        // 1. Lock Product and verify existence
        const productResult = await this.productRepo.findByIdForUpdate(data.productId, tx);
        if (productResult.isFailure) {
            return Result.fail("Product not found or unable to acquire lock");
        }

        const absQuantity = Math.abs(data.quantity);

        // 2. Validate current stock doesn't fall below 0 for OUT operations
        if (data.type === "OUT") {
            const currentStock = await this.stockMovementRepo.getAggregatedStock(data.productId, tx);
            if (currentStock - absQuantity < 0) {
                return Result.fail("Insufficient stock for OUT operation");
            }
        }

        // 3. For ADJUSTMENT, ensure stock + quantity >= 0
        if (data.type === "ADJUSTMENT") {
            const currentStock = await this.stockMovementRepo.getAggregatedStock(data.productId, tx);
            if (currentStock + data.quantity < 0) {
                return Result.fail("Adjustment would result in negative stock");
            }
        }

        // 4. Save to Ledger
        const movementData = {
            productId: data.productId,
            type: data.type,
            referenceType: data.referenceType,
            referenceId: data.referenceId,
            quantity: data.type === 'OUT' || data.type === 'IN' ? absQuantity : data.quantity
        };

        const inserted = await this.stockMovementRepo.insert(movementData, tx);

        return Result.ok(inserted);
    }
}
