import { vi, describe, it, expect, beforeEach } from "vitest";
import { StockMutationGatewayAdapter } from "../infrastructure/adapters/stock-mutation-gateway.adapter";

describe("StockMutationGatewayAdapter.assertStockConsistency", () => {
    let adapter: StockMutationGatewayAdapter;

    beforeEach(() => {
        adapter = new StockMutationGatewayAdapter();
    });

    it("does not throw when product.stock equals sum(batches.current_stock)", async () => {
        const productId = "P1";
        const mockTx = {
            select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn()
                        .mockResolvedValueOnce([{ stock: 10 }])
                        .mockResolvedValueOnce([{ sum: 10 }])
                })
            })
        } as any;
        await expect(adapter.assertStockConsistency([productId], mockTx)).resolves.toBeUndefined();
    });

    it("throws when product.stock does not equal sum(batches.current_stock)", async () => {
        const productId = "P1";
        const mockTx = {
            select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn()
                        .mockResolvedValueOnce([{ stock: 10 }])
                        .mockResolvedValueOnce([{ sum: 8 }])
                })
            })
        } as any;
        await expect(adapter.assertStockConsistency([productId], mockTx))
            .rejects.toThrow(/Stock consistency failed for product P1: products\.stock=10 !== sum\(batches\.current_stock\)=8/);
    });

    it("checks all given product ids", async () => {
        const mockWhere = vi.fn()
            .mockResolvedValueOnce([{ stock: 5 }])
            .mockResolvedValueOnce([{ sum: 5 }])
            .mockResolvedValueOnce([{ stock: 3 }])
            .mockResolvedValueOnce([{ sum: 3 }]);
        const mockTx = {
            select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: mockWhere
                })
            })
        } as any;
        await expect(adapter.assertStockConsistency(["P1", "P2"], mockTx)).resolves.toBeUndefined();
        expect(mockWhere).toHaveBeenCalledTimes(4);
    });
});
