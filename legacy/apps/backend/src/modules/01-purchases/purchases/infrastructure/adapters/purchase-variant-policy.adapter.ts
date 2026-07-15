import { products, categoryVariants } from "../../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { IPurchaseVariantPolicyGateway } from "../../domain/purchase-repository.port";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class PurchaseVariantPolicyAdapter implements IPurchaseVariantPolicyGateway {
    async ensureVariantAllowedForSupplier(
        tenantId: string,
        params: { productId: string; variantName: string; supplierId: string },
        tx: TransactionContext
    ): Promise<void> {
        const product = await tx.query.products.findFirst({
            where: and(
                eq(products.id, params.productId),
                eq(products.tenantId, tenantId)
            ),
            columns: { categoryId: true }
        });

        if (!product?.categoryId) {
            return;
        }

        const templates = await tx.query.categoryVariants.findMany({
            where: and(
                eq(categoryVariants.tenantId, tenantId),
                eq(categoryVariants.categoryId, product.categoryId),
                eq(categoryVariants.name, params.variantName)
            )
        });

        if (templates.length === 0) {
            return;
        }

        const isAllowed = templates.some((t: any) =>
            t.supplierId === null || t.supplierId === params.supplierId
        );

        if (!isAllowed) {
            throw new Error(`Varian '${params.variantName}' tidak tersedia untuk supplier ini.`);
        }
    }
}

