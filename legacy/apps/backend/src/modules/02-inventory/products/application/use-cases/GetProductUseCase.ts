import { inject, injectable } from "inversify";
import { Result } from "../../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Logger, LoggerFactory } from "../../../../../shared/utils/logger/Logger";
import { ProductDTO } from "../dtos/ProductDTO";
import { ProductMapper } from "../mappers/ProductMapper";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { TransactionContext } from "@shared/types/db-context";

interface GetProductRequest {
    id?: string;
    sku?: string;
}

/**
 * GetProductUseCase
 * Orchestrates product retrieval by ID or SKU.
 */
@injectable()
export class GetProductUseCase {
    private logger: Logger;
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
        @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.createLogger('GetProductUseCase');
    }

    public async execute(request: GetProductRequest, tx: TransactionContext): Promise<Result<ProductDTO>> {
        let productResult: Result<any> = Result.fail("Product identifier missing");

        if (request.id) {
            productResult = await this.productRepo.findById(request.id, tx);
        } else if (request.sku) {
            const skuRes = Sku.create(request.sku);
            if (skuRes.isFailure) return Result.fail(skuRes.errorValue());
            productResult = await this.productRepo.findBySku(skuRes.getValue(), tx);
        } else {
            return Result.fail("Either product ID or SKU must be provided");
        }

        if (productResult.isFailure) {
            return Result.fail<ProductDTO>(productResult.errorValue());
        }

        return Result.ok(ProductMapper.toDTO(productResult.getValue()));
    }
}
