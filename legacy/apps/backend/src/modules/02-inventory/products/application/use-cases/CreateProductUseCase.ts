import { inject, injectable } from "inversify";
import { UseCase } from "../../../../../shared/core/UseCase";
import { Result } from "../../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { CreateProductDTO } from "../dtos/CreateProductDTO";
import { ProductDTO } from "../dtos/ProductDTO";
import { Product } from "../../domain/entities/Product.entity";
import { Price } from "../../domain/value-objects/Price.vo";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { Logger, LoggerFactory } from "../../../../../shared/utils/logger/Logger";
import { ProductMapper } from "../mappers/ProductMapper";
import { TransactionContext } from "@shared/types/db-context";
import type { ICategoryGateway } from "../../domain/ports/ICategoryGateway";

@injectable()
export class CreateProductUseCase {
    private logger: Logger;
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
        @inject(TYPES.ICategoryGateway) private readonly categoryGateway: ICategoryGateway,
        @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.createLogger('CreateProductUseCase');
    }

    public async execute(request: CreateProductDTO, tx: TransactionContext): Promise<Result<ProductDTO>> {
        // 1. Create Value Objects
        const skuResult = Sku.create(request.sku);
        const priceResult = Price.create(request.price);

        const result = Result.combine([skuResult, priceResult]);
        if (result.isFailure) {
            return Result.fail<ProductDTO>(result.errorValue());
        }

        // 1.5 Validate Category Exists
        const categoryExists = await this.categoryGateway.categoryExists(request.categoryId, tx);
        if (!categoryExists) {
            return Result.fail<ProductDTO>('Category not found');
        }

        // 1.6 Validate SKU Uniqueness
        const skuExists = await this.productRepo.findBySku(skuResult.getValue(), tx);
        if (skuExists.isSuccess) {
            return Result.fail<ProductDTO>('Product with this SKU already exists');
        }

        // 2. Create Domain Entity
        const productResult = Product.create({
            sku: skuResult.getValue(),
            name: request.name,
            price: priceResult.getValue(),
            categoryId: request.categoryId
        });

        if (productResult.isFailure) {
            return Result.fail<ProductDTO>(productResult.errorValue());
        }

        const product = productResult.getValue();

        // 3. Save to Repository
        const saveResult = await this.productRepo.save(product, tx);
        if (saveResult.isFailure) {
            return Result.fail<ProductDTO>(saveResult.errorValue());
        }

        // 4. Return DTO
        return Result.ok(ProductMapper.toDTO(product));
    }
}
