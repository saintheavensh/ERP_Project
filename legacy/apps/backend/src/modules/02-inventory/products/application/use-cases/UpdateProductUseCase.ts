import { inject, injectable } from "inversify";
import { Result } from "../../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { UpdateProductDTO } from "../dtos/UpdateProductDTO";
import { ProductDTO } from "../dtos/ProductDTO";
import { Price } from "../../domain/value-objects/Price.vo";
import { ProductStatus, Status } from "../../domain/value-objects/ProductStatus.vo";
import { ProductMapper } from "../mappers/ProductMapper";
import { Logger, LoggerFactory } from "../../../../../shared/utils/logger/Logger";
import { TransactionContext } from "@shared/types/db-context";

interface UpdateProductRequest {
    id: string;
    data: UpdateProductDTO;
}

/**
 * UpdateProductUseCase
 * Orchestrates the update of an existing product's details.
 */
@injectable()
export class UpdateProductUseCase {
    private logger: Logger;
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
        @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.createLogger('UpdateProductUseCase');
    }

    public async execute(request: UpdateProductRequest, tx: TransactionContext): Promise<Result<ProductDTO>> {
        // 1. Find product
        const productResult = await this.productRepo.findById(request.id, tx);
        if (productResult.isFailure) {
            return Result.fail<ProductDTO>(productResult.errorValue());
        }

        const product = productResult.getValue();

        // 2. Business Rule: Cannot update archived products
        if (product.status.value === Status.ARCHIVED) {
            return Result.fail("Cannot update an archived product");
        }

        // 3. Apply updates
        if (request.data.name) {
            const nameRes = product.updateName(request.data.name);
            if (nameRes.isFailure) return Result.fail(nameRes.errorValue());
        }

        if (request.data.price !== undefined) {
            const priceRes = Price.create(request.data.price);
            if (priceRes.isFailure) return Result.fail(priceRes.errorValue());
            product.updatePrice(priceRes.getValue());
        }

        if (request.data.status) {
            const statusRes = product.status.transitionTo(request.data.status as Status);
            if (statusRes.isFailure) return Result.fail(statusRes.errorValue());
            // We need to apply this to the entity. Note: Entity has activate/deactivate/archive methods.
            // We can map the target status to the correct method.
            let transitionRes;
            switch (request.data.status) {
                case Status.ACTIVE: transitionRes = product.activate(); break;
                case Status.INACTIVE: transitionRes = product.deactivate(); break;
                case Status.ARCHIVED: transitionRes = product.archive(); break;
                default: return Result.fail("Invalid status transition requested");
            }
            if (transitionRes.isFailure) return Result.fail(transitionRes.errorValue());
        }

        // 4. Save
        const saveResult = await this.productRepo.save(product, tx);
        if (saveResult.isFailure) {
            return Result.fail<ProductDTO>(saveResult.errorValue());
        }

        return Result.ok(ProductMapper.toDTO(product));
    }
}
