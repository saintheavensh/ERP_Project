import { injectable } from "inversify";
import { eq, sql, ilike, or, and } from "drizzle-orm";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Product } from "../../domain/entities/Product.entity";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { Status } from "../../domain/value-objects/ProductStatus.vo";
import { Result } from "../../../../../shared/core/Result";
import { ProductMapper } from "../../application/mappers/ProductMapper";
import { products } from "../schema/ProductSchema";
import { productBatches } from "../../../inventory/infrastructure/schema/BatchSchema";
import { Pagination, PaginationParams, PaginatedResult } from "../../../../../shared/application/pagination/Pagination";
import { TransactionContext } from "../../../../../shared/types/db-context";

/**
 * DrizzleProductRepository
 * PostgreSQL implementation of the product repository using Drizzle ORM.
 */
@injectable()
export class DrizzleProductRepository implements IProductRepository {
    constructor() { }

    public async findById(id: string, tx: TransactionContext): Promise<Result<Product>> {
        try {
            const rows = await tx
                .select({
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    minimumStock: products.minimumStock,
                    unit: products.unit,
                    isActive: products.isActive,
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(eq(products.id, id))
                .groupBy(products.id);

            if (rows.length === 0) {
                return Result.fail(`Product with id ${id} not found`);
            }
            return ProductMapper.toDomain(rows[0]);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async findByIdForUpdate(id: string, tx: TransactionContext): Promise<Result<Product>> {
        try {
            const rows = await tx
                .select({
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    minimumStock: products.minimumStock,
                    unit: products.unit,
                    isActive: products.isActive,
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(eq(products.id, id))
                .groupBy(products.id)
                .for('update');

            if (rows.length === 0) {
                return Result.fail(`Product with id ${id} not found`);
            }
            return ProductMapper.toDomain(rows[0]);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async findBySku(sku: Sku, tx: TransactionContext): Promise<Result<Product>> {
        try {
            const rows = await tx
                .select({
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    minimumStock: products.minimumStock,
                    unit: products.unit,
                    isActive: products.isActive,
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(eq(products.sku, sku.value))
                .groupBy(products.id);

            if (rows.length === 0) {
                return Result.fail(`Product with sku ${sku.value} not found`);
            }
            return ProductMapper.toDomain(rows[0]);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async save(product: Product, tx: TransactionContext): Promise<Result<void>> {
        const row = ProductMapper.toPersistence(product);

        try {
            await tx.insert(products).values(row)
                .onConflictDoUpdate({
                    target: products.id,
                    set: {
                        sku: row.sku,
                        name: row.name,
                        minimumStock: row.minimumStock,
                        unit: row.unit,
                        isActive: row.isActive,
                        categoryId: row.categoryId,
                        updatedAt: new Date()
                    }
                });

            return Result.ok();
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async delete(id: string, tx: TransactionContext): Promise<Result<boolean>> {
        try {
            await tx.delete(products).where(eq(products.id, id));
            return Result.ok(true);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async findActive(tx: TransactionContext): Promise<Result<Product[]>> {
        try {
            const rows = await tx
                .select({
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    minimumStock: products.minimumStock,
                    unit: products.unit,
                    isActive: products.isActive,
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .groupBy(products.id);

            const productEntities: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    productEntities.push(productResult.getValue());
                }
            }
            return Result.ok(productEntities);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async findAllPaginated(params: PaginationParams, tx: TransactionContext): Promise<Result<PaginatedResult<Product>>> {
        const pagination = Pagination.fromQuery(params);
        const sqlParams = Pagination.toSql(pagination);

        try {
            const countResult = await tx.select({ count: sql<number>`count(*)` }).from(products);
            const total = Number(countResult[0].count);

            const sortCol = (products as any)[pagination.sortBy as string] || products.createdAt;

            const rows = await tx
                .select({
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    minimumStock: products.minimumStock,
                    unit: products.unit,
                    isActive: products.isActive,
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .groupBy(products.id)
                .limit(sqlParams.limit)
                .offset(sqlParams.offset)
                .orderBy(
                    pagination.sortOrder === 'asc'
                        ? sortCol
                        : sql`${sortCol} DESC`
                );

            const domainProducts: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    domainProducts.push(productResult.getValue());
                }
            }

            const result = Pagination.createResult(domainProducts, total, pagination);
            return Result.ok(result);
        } catch (error: any) {
            return Result.fail(`Failed to fetch paginated products: ${error.message}`);
        }
    }

    public async findByCategoryPaginated(categoryId: string, params: PaginationParams, tx: TransactionContext): Promise<Result<PaginatedResult<Product>>> {
        const pagination = Pagination.fromQuery(params);
        const sqlParams = Pagination.toSql(pagination);

        try {
            const countResult = await tx.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.categoryId, categoryId));
            const total = Number(countResult[0].count);

            const sortCol = (products as any)[pagination.sortBy as string] || products.createdAt;

            const rows = await tx
                .select({
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    minimumStock: products.minimumStock,
                    unit: products.unit,
                    isActive: products.isActive,
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(eq(products.categoryId, categoryId))
                .groupBy(products.id)
                .limit(sqlParams.limit)
                .offset(sqlParams.offset)
                .orderBy(
                    pagination.sortOrder === 'asc'
                        ? sortCol
                        : sql`${sortCol} DESC`
                );

            const domainProducts: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    domainProducts.push(productResult.getValue());
                }
            }

            const result = Pagination.createResult(domainProducts, total, pagination);
            return Result.ok(result);
        } catch (error: any) {
            return Result.fail(`Failed to fetch category products: ${error.message}`);
        }
    }

    public async searchProducts(query: string, params: PaginationParams, tx: TransactionContext): Promise<Result<PaginatedResult<Product>>> {
        const pagination = Pagination.fromQuery(params);
        const sqlParams = Pagination.toSql(pagination);

        try {
            const searchCondition = or(
                ilike(products.name, `%${query}%`),
                ilike(products.sku, `%${query}%`)
            );

            const countResult = await tx.select({ count: sql<number>`count(*)` }).from(products).where(searchCondition!);
            const total = Number(countResult[0].count);

            const sortCol = (products as any)[pagination.sortBy as string] || products.createdAt;

            const rows = await tx
                .select({
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    minimumStock: products.minimumStock,
                    unit: products.unit,
                    isActive: products.isActive,
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(searchCondition!)
                .groupBy(products.id)
                .limit(sqlParams.limit)
                .offset(sqlParams.offset)
                .orderBy(
                    pagination.sortOrder === 'asc'
                        ? sortCol
                        : sql`${sortCol} DESC`
                );

            const domainProducts: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    domainProducts.push(productResult.getValue());
                }
            }

            const result = Pagination.createResult(domainProducts, total, pagination);
            return Result.ok(result);
        } catch (error: any) {
            return Result.fail(`Failed to search products: ${error.message}`);
        }
    }
}
