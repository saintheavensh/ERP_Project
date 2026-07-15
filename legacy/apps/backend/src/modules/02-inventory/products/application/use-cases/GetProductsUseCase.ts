import { inject, injectable } from "inversify";
import { Result } from "../../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Logger, LoggerFactory } from "../../../../../shared/utils/logger/Logger";
import { ProductDTO } from "../dtos/ProductDTO";
import { ProductMapper } from "../mappers/ProductMapper";
import { TransactionContext } from "@shared/types/db-context";

interface GetProductsRequest {
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
}

@injectable()
export class GetProductsUseCase {
    private logger: Logger;
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
        @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.createLogger('GetProductsUseCase');
    }

    public async execute(request: GetProductsRequest, tx: TransactionContext): Promise<Result<any>> {
        const page = request.page || 1;
        const limit = request.limit || 50;

        let result;
        if (request.search) {
            result = await this.productRepo.searchProducts(request.search, { page, limit }, tx);
        } else if (request.categoryId) {
            result = await this.productRepo.findByCategoryPaginated(request.categoryId, { page, limit }, tx);
        } else {
            result = await this.productRepo.findAllPaginated({ page, limit }, tx);
        }

        if (result.isFailure) {
            return Result.fail(result.errorValue());
        }

        const paginatedData = result.getValue();
        return Result.ok({
            data: paginatedData.data.map(p => ProductMapper.toDTO(p)),
            meta: paginatedData.meta
        });
    }
}
