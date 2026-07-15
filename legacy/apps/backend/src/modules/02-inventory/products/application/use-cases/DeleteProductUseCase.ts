import { inject, injectable } from "inversify";
import { Result } from "../../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import type { IInventoryGateway } from "../../domain/ports/IInventoryGateway";
import { Status } from "../../domain/value-objects/ProductStatus.vo";
import { Logger, LoggerFactory } from "../../../../../shared/utils/logger/Logger";
import { ProductValidationService } from "../../domain/services/ProductValidationService";
import { TransactionContext } from "@shared/types/db-context";

/**
 * DeleteProductUseCase
 * Orchestrates the deletion of a product, ensuring business rules are met.
 */
@injectable()
export class DeleteProductUseCase {
    private logger: Logger;
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
        @inject(TYPES.IInventoryGateway) private readonly inventoryGateway: any, // Using specific type later
        @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.createLogger('DeleteProductUseCase');
    }

    public async execute(productId: string, tx: TransactionContext): Promise<Result<void>> {
        // 1. Find product
        const productResult = await this.productRepo.findById(productId, tx);
        if (productResult.isFailure) {
            return Result.fail(productResult.errorValue());
        }

        const product = productResult.getValue();

        // 2. Domain check: Can internal state be deleted?
        if (!product.canBeDeleted()) {
            return Result.fail("Active or archived products cannot be deleted. Deactivate or DRAFT them first.");
        }

        // 3. Cross-module check: Are there inventory references?
        const validationService = new ProductValidationService(this.inventoryGateway);
        const referenceCheck = await validationService.checkProductReferences(productId);

        if (referenceCheck.isFailure) {
            return Result.fail(referenceCheck.errorValue());
        }

        if (!referenceCheck.getValue().canBeDeleted) {
            return Result.fail("Cannot delete product: Active inventory records or sales transactions exist.");
        }

        // 4. Delete
        const deleteResult = await this.productRepo.delete(productId, tx);
        if (deleteResult.isFailure) {
            return Result.fail(deleteResult.errorValue());
        }

        return Result.ok();
    }
}
