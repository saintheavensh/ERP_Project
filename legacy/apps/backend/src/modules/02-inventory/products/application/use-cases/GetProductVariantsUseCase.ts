import { Result } from "../../../../../shared/core/Result";
import { productVariants } from "../../../inventory/infrastructure/schema/VariantSchema";
import { supplierBrands } from "../../../../01-purchases/suppliers/infrastructure/schema/SupplierSchema";
import { DrizzleClient } from "../../../../../shared/infrastructure/database/DrizzleClient";
import { eq, and } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "../../types";

import { TransactionContext } from "@shared/types/db-context";

@injectable()
export class GetProductVariantsUseCase {
    constructor(
        @inject(TYPES.DrizzleClient || Symbol.for("DrizzleClient")) private drizzleClient: DrizzleClient
    ) { }

    async execute(productId: string, supplierId: string | undefined, tx: TransactionContext): Promise<Result<any[]>> {
        try {
            if (supplierId) {
                const results = await tx
                    .select({
                        id: productVariants.id,
                        name: productVariants.name,
                        sku: productVariants.sku,
                        image: productVariants.image,
                        defaultPrice: productVariants.defaultPrice,
                        productId: productVariants.productId,
                        warrantyPeriodDays: supplierBrands.warrantyPeriodDays
                    })
                    .from(productVariants)
                    .leftJoin(
                        supplierBrands,
                        and(
                            eq(supplierBrands.brandId, productVariants.id),
                            eq(supplierBrands.supplierId, supplierId)
                        )
                    )
                    .where(
                        and(
                            eq(productVariants.productId, productId),
                            eq(supplierBrands.supplierId, supplierId)
                        )
                    );
                return Result.ok(results);
            } else {
                const results = await tx
                    .select({
                        id: productVariants.id,
                        name: productVariants.name,
                        sku: productVariants.sku,
                        image: productVariants.image,
                        defaultPrice: productVariants.defaultPrice,
                        productId: productVariants.productId
                    })
                    .from(productVariants)
                    .where(eq(productVariants.productId, productId));
                return Result.ok(results);
            }
        } catch (error: any) {
            return Result.fail(`Failed to fetch product variants: ${error.message}`);
        }
    }
}
