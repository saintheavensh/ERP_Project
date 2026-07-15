/**
 * Use case: Add stock from a verified purchase.
 * Called by the purchases module during purchase verification.
 */
import type { IStockMutationGateway } from "@domain/stock-mutation-gateway.port";
import type {
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput
} from "@domain/stock.types";
import { supplierBrands } from "@shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import type { TransactionContext } from "@shared/types/db-context";

export class AddStockFromPurchaseUseCase {
    constructor(private readonly stockGateway: IStockMutationGateway) { }

    async execute(
        input: AddStockFromPurchaseVerificationInput,
        tx: TransactionContext,
        tenantId?: string
    ): Promise<AddStockFromPurchaseVerificationOutput> {
        const allocations: AddStockFromPurchaseVerificationOutput["allocations"] = [];

        for (let i = 0; i < input.items.length; i++) {
            const item = input.items[i];
            if (item.qtyReceived <= 0) {
                throw new Error(`qtyReceived must be > 0 for purchase item ${item.purchaseItemId}`);
            }

            const batchId = `B-${Date.now().toString().slice(-6)}-${i}-${Math.floor(Math.random() * 1000)}`;

            let warrantyEndDate: Date | null = null;
            if (item.variantId) {
                const [sb] = await tx.select()
                    .from(supplierBrands)
                    .where(and(
                        eq(supplierBrands.supplierId, input.supplierId),
                        eq(supplierBrands.brandId, item.variantId)
                    ));

                if (sb && sb.warrantyPeriodDays > 0) {
                    warrantyEndDate = new Date();
                    warrantyEndDate.setDate(warrantyEndDate.getDate() + sb.warrantyPeriodDays);
                }
            }

            await this.stockGateway.insertBatch({
                id: batchId,
                productId: item.productId,
                supplierId: input.supplierId,
                variantId: item.variantId,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                initialStock: item.qtyReceived,
                currentStock: item.qtyReceived,
                warrantyEndDate
            }, tx);

            await this.stockGateway.updateProductStockDelta(item.productId, item.qtyReceived, tx);

            allocations.push({ purchaseItemId: item.purchaseItemId, batchId });
        }

        const productIds = [...new Set(input.items.map(i => i.productId))];
        await this.stockGateway.assertStockConsistency(productIds, tx);

        const totalQuantityApplied = input.items.reduce((sum, item) => sum + item.qtyReceived, 0);

        return {
            allocations,
            totalQuantityApplied,
            success: true
        };
    }
}
