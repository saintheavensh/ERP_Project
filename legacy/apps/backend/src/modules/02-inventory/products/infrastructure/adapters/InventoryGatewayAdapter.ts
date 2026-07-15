import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { IInventoryGateway } from "../../domain/ports/IInventoryGateway";
import { Result } from "../../../../../shared/core/Result";
import type { TransactionContext } from "../../../../../shared/types/db-context";

/**
 * InventoryGatewayAdapter
 * Implements the Products module's port for interacting with the Inventory module.
 * This breaks direct dependencies between modules.
 */
@injectable()
export class InventoryGatewayAdapter implements IInventoryGateway {
    constructor(
        @inject(TYPES.InventoryFacade) private inventoryFacade: {
            getStockForProduct(productId: string, tx: TransactionContext): Promise<Result<number>>;
            hasActiveTransactions(productId: string, tx: TransactionContext): Promise<Result<boolean>>;
        }
    ) { }

    /**
     * Retrieves the current stock level for a product from the Inventory module.
     */
    public async getStockLevel(productId: string, tx: TransactionContext): Promise<Result<number>> {
        try {
            const stockResult = await this.inventoryFacade.getStockForProduct(productId, tx);

            if (stockResult.isFailure) {
                return Result.fail(`Failed to get stock: ${stockResult.errorValue()}`);
            }

            return Result.ok(stockResult.getValue());
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Inventory gateway error: ${message}`);
        }
    }

    /**
     * Checks if a product has active inventory transactions.
     */
    public async hasActiveTransactions(productId: string, tx: TransactionContext): Promise<Result<boolean>> {
        try {
            const result = await this.inventoryFacade.hasActiveTransactions(productId, tx);

            if (result.isFailure) {
                return Result.fail(`Failed to check transactions: ${result.errorValue()}`);
            }

            return Result.ok(result.getValue());
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Inventory gateway error: ${message}`);
        }
    }
}
