import { Result } from "../../../../../shared/core/Result";
import { Product } from "../entities/Product.entity";
import { Status } from "../value-objects/ProductStatus.vo";
import { IInventoryGateway } from "../ports/IInventoryGateway";

export interface ReferenceCheck {
    hasActiveSales: boolean;
    hasInventory: boolean;
    canBeDeleted: boolean;
}

/**
 * ProductValidationService
 * Domain service for validations that involve multiple entities or external module checks.
 */
export class ProductValidationService {
    constructor(private readonly inventoryGateway: IInventoryGateway) { }

    /**
     * Validates if a product can be sold.
     */
    public async validateProductForSale(product: Product, quantity: number): Promise<Result<void>> {
        if (product.status.value !== Status.ACTIVE) {
            return Result.fail(`Product ${product.name} is not active for sale`);
        }

        const stockResult = await this.inventoryGateway.getStockLevel(product.id);
        if (stockResult.isFailure) {
            return Result.fail(stockResult.errorValue());
        }

        if (stockResult.getValue() < quantity) {
            return Result.fail(`Insufficient stock for ${product.name}. Requested: ${quantity}, Available: ${stockResult.getValue()}`);
        }

        return Result.ok();
    }

    /**
     * Checks if a product has active references in other modules.
     */
    public async checkProductReferences(productId: string): Promise<Result<ReferenceCheck>> {
        const hasActiveTransactionsResult = await this.inventoryGateway.hasActiveTransactions(productId);

        if (hasActiveTransactionsResult.isFailure) {
            return Result.fail(hasActiveTransactionsResult.errorValue());
        }

        const hasInventory = hasActiveTransactionsResult.getValue();

        // In a real scenario, we might also check Sales module via another gateway.
        // For now, we use the inventory check as the primary reference check.

        return Result.ok({
            hasActiveSales: false, // Placeholder
            hasInventory: hasInventory,
            canBeDeleted: !hasInventory
        });
    }
}
