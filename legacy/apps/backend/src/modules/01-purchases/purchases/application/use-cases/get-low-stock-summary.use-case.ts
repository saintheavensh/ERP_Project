import { TransactionContext } from "../../../../../shared/types/db-context";
import { products, suppliers, supplierCategories } from "../../../../../shared/infrastructure/database/schema";
import { sql, eq } from "drizzle-orm";
import { InventoryService } from "../../../../02-inventory/inventory/application/services/inventory.service";

export interface LowStockSuggestionGroup {
    supplierId: string;
    supplierName: string;
    items: {
        productId: string;
        productName: string;
        variant: string;
        currentStock: number;
        minStock: number;
        suggestedQty: number;
        lastBuyPrice: number;
    }[];
}

export class GetLowStockSummaryUseCase {
    constructor(private inventoryService: InventoryService) { }

    async execute(tenantId: string, tx: TransactionContext): Promise<LowStockSuggestionGroup[]> {
        // 1. Get Low Stock Products
        const lowStockProducts = await tx.query.products.findMany({
            where: sql`${products.stock} <= ${products.minimumStock}`,
            with: {
                category: true
            }
        });

        if (lowStockProducts.length === 0) return [];

        const suggestionsMap = new Map<string, LowStockSuggestionGroup>();

        for (const p of lowStockProducts) {
            let supplierId = "UNKNOWN";
            let supplierName = "Unknown Supplier";

            // Try to find last batch via inventory gate
            const lastBatch = await this.inventoryService.getLastBatchByProduct(p.id, tx);

            if (lastBatch && lastBatch.supplierId) {
                const sup = await tx.query.suppliers.findFirst({
                    where: eq(suppliers.id, lastBatch.supplierId),
                    columns: { name: true }
                });
                supplierId = lastBatch.supplierId;
                supplierName = sup?.name || "Unknown";
            } else if (p.categoryId) {
                // Try to find via category-supplier link
                const supCat = await tx.query.supplierCategories.findFirst({
                    where: eq(supplierCategories.categoryId, p.categoryId),
                    with: { supplier: true }
                });
                if (supCat) {
                    supplierId = supCat.supplierId;
                    supplierName = supCat.supplier.name;
                }
            }

            if (!suggestionsMap.has(supplierId)) {
                suggestionsMap.set(supplierId, {
                    supplierId,
                    supplierName,
                    items: []
                });
            }

            const group = suggestionsMap.get(supplierId)!;

            // Suggest quantity: Max(10, MinStock * 2) - CurrentStock
            const target = Math.max(10, (p.minimumStock || 5) * 2);
            const qty = Math.max(1, target - (p.stock || 0));

            group.items.push({
                productId: p.id,
                productName: p.name,
                variant: "Original",
                currentStock: p.stock || 0,
                minStock: p.minimumStock || 0,
                suggestedQty: qty,
                lastBuyPrice: lastBatch?.buyPrice || 0
            });
        }

        return Array.from(suggestionsMap.values());
    }
}
