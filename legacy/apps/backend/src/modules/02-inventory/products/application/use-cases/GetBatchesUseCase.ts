import { Result } from "../../../../../shared/core/Result";
import { productBatches } from "../../../inventory/infrastructure/schema/BatchSchema";
import { products } from "../../infrastructure/schema/ProductSchema";
import { categories } from "../../../categories/infrastructure/schema/CategorySchema";
import { productVariants } from "../../../inventory/infrastructure/schema/VariantSchema";
import { DrizzleClient } from "../../../../../shared/infrastructure/database/DrizzleClient";
import { eq, and, gt, desc } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "../../types";

import { TransactionContext } from "@shared/types/db-context";

@injectable()
export class GetBatchesUseCase {
    constructor(
        @inject(TYPES.DrizzleClient || Symbol.for("DrizzleClient")) private drizzleClient: DrizzleClient
    ) { }

    async execute(supplierId: string | undefined, tx: TransactionContext): Promise<Result<any[]>> {
        try {
            const results = await tx
                .select({
                    id: productBatches.id,
                    productId: productBatches.productId,
                    supplierId: productBatches.supplierId,
                    variantId: productBatches.variantId,
                    buyPrice: productBatches.buyPrice,
                    currentStock: productBatches.currentStock,
                    warrantyEndDate: productBatches.warrantyEndDate,
                    createdAt: productBatches.createdAt,
                    productName: products.name,
                    categoryName: categories.name,
                    variantName: productVariants.name
                })
                .from(productBatches)
                .leftJoin(products, eq(productBatches.productId, products.id))
                .leftJoin(categories, eq(products.categoryId, categories.id))
                .leftJoin(productVariants, eq(productBatches.variantId, productVariants.id))
                .where(
                    and(
                        gt(productBatches.currentStock, 0),
                        supplierId ? eq(productBatches.supplierId, supplierId) : undefined
                    )
                )
                .orderBy(desc(productBatches.createdAt));

            // Map the output explicitly for frontend consumption
            const batches = results.map(b => ({
                id: b.id,
                productId: b.productId,
                supplierId: b.supplierId,
                variantId: b.variantId,
                currentStock: b.currentStock,
                buyPrice: b.buyPrice,
                warrantyEndDate: b.warrantyEndDate,
                productName: b.productName,
                category: {
                    name: b.categoryName
                },
                variantName: b.variantName,
                // The front end code in purchase-returns/new/page.svelte line 78 looks for `b.variant`
                variant: b.variantName,
                createdAt: b.createdAt
            }));

            return Result.ok(batches);
        } catch (error: any) {
            return Result.fail(`Failed to fetch batches: ${error.message}`);
        }
    }
}
