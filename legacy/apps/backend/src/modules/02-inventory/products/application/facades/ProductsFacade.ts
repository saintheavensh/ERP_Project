import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { Result } from "../../../../../shared/core/Result";
import { ProductDTO } from "../dtos/ProductDTO";
import { CreateProductDTO } from "../dtos/CreateProductDTO";
import { UpdateProductDTO } from "../dtos/UpdateProductDTO";
import { CreateProductUseCase } from "../use-cases/CreateProductUseCase";
import { GetProductUseCase } from "../use-cases/GetProductUseCase";
import { GetProductsUseCase } from "../use-cases/GetProductsUseCase";
import { GetProductVariantsUseCase } from "../use-cases/GetProductVariantsUseCase";
import { GetBatchesUseCase } from "../use-cases/GetBatchesUseCase";
import { UpdateProductUseCase } from "../use-cases/UpdateProductUseCase";
import { ActivateProductUseCase } from "../use-cases/ActivateProductUseCase";
import { DeleteProductUseCase } from "../use-cases/DeleteProductUseCase";
import { InventoryTransactionAuthority } from "../../../inventory/application/services/inventory-transaction-authority";
import { TransactionContext } from "../../../../../shared/types/db-context";

/**
 * ProductsFacade
 * Entrance point for other modules to interact with the Products module.
 * It hides the complexity of use cases and mappers.
 */
@injectable()
export class ProductsFacade {
    constructor(
        @inject(TYPES.InventoryTransactionAuthority || Symbol.for("InventoryTransactionAuthority"))
        private readonly inventoryAuthority: InventoryTransactionAuthority,
        @inject(TYPES.CreateProductUseCase)
        private readonly createProductUC: CreateProductUseCase,
        @inject(TYPES.GetProductsUseCase)
        private readonly getProductsUC: GetProductsUseCase,
        @inject(TYPES.GetProductUseCase || Symbol.for("GetProductUseCase"))
        private readonly getProductUC: GetProductUseCase,
        @inject(TYPES.GetProductVariantsUseCase || Symbol.for("GetProductVariantsUseCase"))
        private readonly getProductVariantsUC: GetProductVariantsUseCase,
        @inject(TYPES.GetBatchesUseCase || Symbol.for("GetBatchesUseCase"))
        private readonly getBatchesUC: GetBatchesUseCase,
        @inject(TYPES.UpdateProductUseCase)
        private readonly updateProductUC: UpdateProductUseCase,
        @inject(TYPES.ActivateProductUseCase)
        private readonly activateProductUC: ActivateProductUseCase,
        @inject(TYPES.DeleteProductUseCase)
        private readonly deleteProductUC: DeleteProductUseCase,
    ) { }

    public async createProduct(tenantId: string, data: CreateProductDTO): Promise<Result<ProductDTO>> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.createProductUC.execute(data, tx)
        );
    }

    public async activateProduct(tenantId: string, productId: string): Promise<Result<ProductDTO>> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.activateProductUC.execute(productId, tx)
        );
    }

    public async getProduct(tenantId: string, id: string): Promise<Result<ProductDTO>> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.getProductUC.execute({ id }, tx)
        );
    }

    public async getAllProducts(tenantId: string, deviceId?: string, search?: string, categoryId?: string, page?: number, limit?: number): Promise<any> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => {
                const result = await this.getProductsUC.execute({ search, categoryId, page, limit }, tx);
                if (result.isFailure) throw new Error(result.errorValue() as string);
                return result.getValue();
            }
        );
    }

    public async getProductBySku(tenantId: string, sku: string): Promise<Result<ProductDTO>> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.getProductUC.execute({ sku }, tx)
        );
    }

    public async searchProduct(tenantId: string, query: string): Promise<any> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => {
                const result = await this.getProductsUC.execute({ search: query }, tx);
                if (result.isFailure) throw new Error(result.errorValue() as string);
                return result.getValue().data;
            }
        );
    }

    public async getProductVariants(tenantId: string, productId: string, supplierId?: string): Promise<any> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => {
                const result = await this.getProductVariantsUC.execute(productId, supplierId, tx);
                if (result.isFailure) throw new Error(result.errorValue() as string);
                return result.getValue();
            }
        );
    }

    public async getBatches(tenantId: string, supplierId?: string): Promise<any> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => {
                const result = await this.getBatchesUC.execute(supplierId, tx);
                if (result.isFailure) throw new Error(result.errorValue() as string);
                return result.getValue();
            }
        );
    }

    public async getStats(tenantId: string): Promise<any> {
        // Stub for dashboard or admin stats
        // Real implementation would need a dedicated GetProductStatsUseCase
        return { totalProducts: 0, activeProducts: 0, lowStock: 0 };
    }

    public async updateProduct(tenantId: string, id: string, data: UpdateProductDTO): Promise<Result<ProductDTO>> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.updateProductUC.execute({ id, data }, tx)
        );
    }

    public async deleteProduct(tenantId: string, id: string): Promise<Result<void>> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.deleteProductUC.execute(id, tx)
        );
    }
}
