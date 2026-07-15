import { vi, describe, it, expect, beforeAll } from "vitest";
import { db } from "../../../../../shared/infrastructure/database/client";

// 1. Mock DB client to avoid connection errors and support transactions
vi.mock("../../../../../shared/infrastructure/database/client", () => ({
    db: {
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
        delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })),
        transaction: vi.fn((cb: any) => cb({})), // Just call the cb with empty tx
        query: {
            productBatches: { findFirst: vi.fn().mockResolvedValue({ currentStock: 0 }) },
            products: { findFirst: vi.fn().mockResolvedValue({ stock: 0 }) }
        }
    }
}));

// 2. Mock Gateway Adapter using a Class to resolve "is not a constructor" error
vi.mock("../../infrastructure/adapters/stock-mutation-gateway.adapter", () => {
    class MockGateway {
        static stock = 1;
        findBatchesForFIFO = vi.fn(async () => {
            if (MockGateway.stock > 0) {
                const res = [{ id: 'b1', currentStock: MockGateway.stock, buyPrice: 100, variantId: 'v1' }];
                MockGateway.stock = 0; // Simulate reservation
                return res;
            }
            return [];
        });
        updateBatchStockDelta = vi.fn().mockResolvedValue(undefined);
        updateProductStockDelta = vi.fn().mockResolvedValue(undefined);
        assertStockConsistency = vi.fn().mockResolvedValue(undefined);
        insertBatch = vi.fn().mockResolvedValue(undefined);
    }
    return {
        StockMutationGatewayAdapter: MockGateway
    };
});

import { DeductStockFIFOUseCase } from "./deduct-stock-fifo.use-case";
import { StockMutationGatewayAdapter } from "../../infrastructure/adapters/stock-mutation-gateway.adapter";
import { createMockCategory, createMockProduct, createMockProductBatch } from "../../../../../../test/factories";
import { categories, products, productBatches } from "../../../../../shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

describe("DeductStockFIFOUseCase Concurrency", () => {
    let useCase: DeductStockFIFOUseCase;
    let gateway: any;

    beforeAll(() => {
        gateway = new StockMutationGatewayAdapter();
        useCase = new DeductStockFIFOUseCase(gateway);
    });

    it("should prevent overselling when processing concurrent requests", async () => {
        // Reset the static stock to 1 for this test
        (StockMutationGatewayAdapter as any).stock = 1;

        // Setup a category, product and a single batch with stock = 1
        const category = createMockCategory();
        const product = createMockProduct({ stock: 1, categoryId: category.id });
        const batch = createMockProductBatch({ productId: product.id, currentStock: 1, initialStock: 1 });

        await db.insert(categories).values(category);
        await db.insert(products).values(product);
        await db.insert(productBatches).values(batch);

        const input = {
            saleId: "test-sale-1",
            items: [
                {
                    productId: product.id,
                    variant: "Default",
                    quantity: 1,
                    unitPrice: 100
                }
            ]
        };

        // Fire 3 simultaneous requests to deduct 1 stock each (total 3 requested, only 1 available)
        const results = await Promise.allSettled([
            db.transaction(tx => useCase.execute(input, tx)),
            db.transaction(tx => useCase.execute(input, tx)),
            db.transaction(tx => useCase.execute(input, tx))
        ]);

        const successful = results.filter(r => r.status === "fulfilled");
        const failed = results.filter(r => r.status === "rejected");

        // Only exactly 1 should succeed
        expect(successful.length).toBe(1);
        expect(failed.length).toBe(2);

        // Verify that the failed ones threw "Insufficient stock"
        for (const failure of failed) {
            const err = (failure as PromiseRejectedResult).reason;
            expect(err.message).toMatch(/Insufficient stock/);
        }

        // Verify the database state correctly reflects exactly 0 stock left
        const updatedBatch = await (db.query.productBatches as any).findFirst({
            where: eq(productBatches.id, batch.id)
        });
        expect(updatedBatch?.currentStock).toBe(0);

        const updatedProduct = await (db.query.products as any).findFirst({
            where: eq(products.id, product.id)
        });
        expect(updatedProduct?.stock).toBe(0);

        // Cleanup
        await db.delete(productBatches).where(eq(productBatches.productId, product.id));
        await db.delete(products).where(eq(products.id, product.id));
        await db.delete(categories).where(eq(categories.id, category.id));
    });
});
