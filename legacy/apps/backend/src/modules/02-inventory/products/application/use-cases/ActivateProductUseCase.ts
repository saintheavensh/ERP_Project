import { inject, injectable } from "inversify";
import { Result } from "../../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { ProductDTO } from "../dtos/ProductDTO";
import { ProductMapper } from "../mappers/ProductMapper";
import { Logger, LoggerFactory } from "../../../../../shared/utils/logger/Logger";
import { TransactionContext } from "../../../../../shared/types/db-context";

/**
 * ActivateProductUseCase
 * Orchestrates the activation of a product.
 */
@injectable()
export class ActivateProductUseCase {
    private logger: Logger;
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
        @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.createLogger('ActivateProductUseCase');
    }

    public async execute(productId: string, tx: TransactionContext): Promise<Result<ProductDTO>> {
        // 1. Find product
        const productResult = await this.productRepo.findById(productId, tx);
        if (productResult.isFailure) {
            return Result.fail<ProductDTO>(productResult.errorValue());
        }

        const product = productResult.getValue();

        // 2. Activate (Domain will handle state transition rules)
        const activationResult = product.activate();
        if (activationResult.isFailure) {
            return Result.fail<ProductDTO>(activationResult.errorValue());
        }

        // 3. Save
        const saveResult = await this.productRepo.save(product, tx);
        if (saveResult.isFailure) {
            return Result.fail<ProductDTO>(saveResult.errorValue());
        }

        return Result.ok(ProductMapper.toDTO(product));
    }
}
