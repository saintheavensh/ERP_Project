import { inArray, sum } from "drizzle-orm";
import type { TransactionContext } from "@shared/types/db-context";
import { products, productBatches } from "@shared/infrastructure/database/schema";

export class InventoryValidationException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InventoryValidationException';
    }
}

export async function validateInventoryInvariant(input: any, tx: TransactionContext): Promise<void> {
    if (!input) return;

    const productIds = new Set<string>();

    if (typeof input === 'object') {
        if (typeof input.productId === 'string') {
            productIds.add(input.productId);
        }
        if (Array.isArray(input.items)) {
            for (const item of input.items) {
                if (typeof item.productId === 'string') {
                    productIds.add(item.productId);
                }
            }
        }
        if (typeof input.batchId === 'string' && productIds.size === 0) {
            const batchQuery = await tx.select({ productId: productBatches.productId })
                .from(productBatches)
                .where(inArray(productBatches.id, [input.batchId]));

            if (batchQuery.length > 0 && batchQuery[0].productId) {
                productIds.add(batchQuery[0].productId);
            }
        }
    }

    if (productIds.size === 0) return;

    const ids = Array.from(productIds);

    // 1. Check stock >= 0
    const prodData = await tx.select({
        id: products.id,
        stock: products.stock
    }).from(products).where(inArray(products.id, ids));

    for (const p of prodData) {
        if (p.stock < 0) {
            throw new InventoryValidationException(`Invariant Violation: Product ${p.id} stock cannot be negative (current: ${p.stock})`);
        }
    }

    // 2. Batch quantities consistent (Product stock == sum of batch currentStock)
    const batchSums = await tx.select({
        productId: productBatches.productId,
        total: sum(productBatches.currentStock).mapWith(Number)
    })
        .from(productBatches)
        .where(inArray(productBatches.productId, ids))
        .groupBy(productBatches.productId);

    for (const p of prodData) {
        const bSum = batchSums.find(b => b.productId === p.id)?.total || 0;
        if (p.stock !== bSum) {
            throw new InventoryValidationException(`Invariant Violation: Product ${p.id} stock (${p.stock}) does not match sum of batches (${bSum})`);
        }
    }
}
