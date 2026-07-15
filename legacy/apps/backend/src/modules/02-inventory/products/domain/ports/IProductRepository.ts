import { Result } from "../../../../../shared/core/Result";
import { Product } from "../entities/Product.entity";
import { Sku } from "../value-objects/Sku.vo";
import { PaginationParams, PaginatedResult } from "../../../../../shared/application/pagination/Pagination";
import { TransactionContext } from "../../../../../shared/types/db-context";

/**
 * IProductRepository
 * Port for product persistence operations.
 */
export interface IProductRepository {
    /**
     * Finds a product by its unique identifier.
     */
    findById(id: string, tx: TransactionContext): Promise<Result<Product>>;

    /**
     * Finds a product by its unique identifier and places a row-level lock.
     */
    findByIdForUpdate(id: string, tx: TransactionContext): Promise<Result<Product>>;

    /**
     * Finds a product by its SKU.
     */
    findBySku(sku: Sku, tx: TransactionContext): Promise<Result<Product>>;

    /**
     * Saves or updates a product.
     */
    save(product: Product, tx: TransactionContext): Promise<Result<void>>;

    /**
     * Deletes a product by its ID.
     */
    delete(id: string, tx: TransactionContext): Promise<Result<boolean>>;

    /**
     * Returns all active products.
     */
    findActive(tx: TransactionContext): Promise<Result<Product[]>>;

    // Paginated methods
    findAllPaginated(params: PaginationParams, tx: TransactionContext): Promise<Result<PaginatedResult<Product>>>;
    findByCategoryPaginated(categoryId: string, params: PaginationParams, tx: TransactionContext): Promise<Result<PaginatedResult<Product>>>;
    searchProducts(query: string, params: PaginationParams, tx: TransactionContext): Promise<Result<PaginatedResult<Product>>>;
}
