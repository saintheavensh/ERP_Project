/**
 * Pure domain logic for stock calculations.
 * No infrastructure or database dependencies.
 */

export interface BatchLike {
    id: string;
    currentStock: number;
    buyPrice: number;
    variantId: string | null;
}

export interface Allocation {
    batchId: string;
    variantId: string | null;
    quantity: number;
    buyPrice: number;
}

export class StockCalculator {
    /**
     * Calculates stock deduction using FIFO (First-In-First-Out).
     * Returns allocations and the total COGS (Cost of Goods Sold).
     */
    static calculateFIFO(
        requestedQty: number,
        batches: BatchLike[]
    ): { allocations: Allocation[]; totalCogs: number; remainingQty: number } {
        const allocations: Allocation[] = [];
        let totalCogs = 0;
        let remainingToDeduct = requestedQty;

        for (const batch of batches) {
            if (remainingToDeduct <= 0) break;
            if (batch.currentStock <= 0) continue;

            const deduct = Math.min(batch.currentStock, remainingToDeduct);

            allocations.push({
                batchId: batch.id,
                variantId: batch.variantId,
                quantity: deduct,
                buyPrice: batch.buyPrice
            });

            totalCogs += deduct * batch.buyPrice;
            remainingToDeduct -= deduct;
        }

        return {
            allocations,
            totalCogs,
            remainingQty: remainingToDeduct
        };
    }

    /**
     * Groups raw batches into opname items (one per product+variant).
     * Pure domain logic for inventory calculation.
     */
    static groupBatchesIntoOpnameItems(
        sessionId: string,
        batches: Array<{ productId: string; variantId?: string | null; currentStock: number; variant?: string | null }>
    ) {
        const groups: Record<string, { productId: string; variantName: string; systemStock: number }> = {};

        for (const b of batches) {
            const variantName = b.variant || "Standard";
            const key = `${b.productId}-${variantName}`;
            if (!groups[key]) {
                groups[key] = { productId: b.productId, variantName, systemStock: 0 };
            }
            groups[key].systemStock += b.currentStock;
        }

        return Object.values(groups).map((g) => ({
            sessionId,
            productId: g.productId,
            variantName: g.variantName,
            systemStock: g.systemStock
        }));
    }
}
