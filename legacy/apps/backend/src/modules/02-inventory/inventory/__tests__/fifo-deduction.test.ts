import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { DeductStockFIFOUseCase } from "../application/use-cases/deduct-stock-fifo.use-case";
import type { IStockMutationGateway } from "../domain/stock-mutation-gateway.port";
import type { DeductStockFIFOInput } from "../domain/stock.types";

describe("FIFO across 2 batches (Use Case)", () => {
    let useCase: DeductStockFIFOUseCase;
    let mockGateway: Mocked<IStockMutationGateway>;
    let mockTx: any = {};

    beforeEach(() => {
        mockGateway = {
            findBatchesForFIFO: vi.fn(),
            updateBatchStockDelta: vi.fn(),
            updateProductStockDelta: vi.fn(),
            insertBatch: vi.fn(),
            assertStockConsistency: vi.fn()
        } as any;

        useCase = new DeductStockFIFOUseCase(mockGateway);
    });

    it("drains oldest batch first, then spills to newer batch", async () => {
        const input: DeductStockFIFOInput = {
            saleId: "SALE-001",
            items: [
                { productId: "P1", variant: "Original", quantity: 5, unitPrice: 2000 }
            ]
        };

        // Mock 2 batches for the product
        mockGateway.findBatchesForFIFO.mockResolvedValue([
            { id: "B-OLD", currentStock: 3, buyPrice: 1000, variantId: "V1" },
            { id: "B-NEW", currentStock: 10, buyPrice: 1500, variantId: "V1" }
        ]);

        const result = await useCase.execute(input, mockTx);

        // Should produce 2 allocations: 3 from B-OLD, 2 from B-NEW
        expect(result.allocations).toHaveLength(2);

        // Assertions for allocations
        expect(result.allocations[0]).toMatchObject({ batchId: "B-OLD", quantity: 3, buyPrice: 1000 });
        expect(result.allocations[1]).toMatchObject({ batchId: "B-NEW", quantity: 2, buyPrice: 1500 });

        // Assertions for gateway calls
        expect(mockGateway.updateBatchStockDelta).toHaveBeenCalledWith("B-OLD", -3, mockTx);
        expect(mockGateway.updateBatchStockDelta).toHaveBeenCalledWith("B-NEW", -2, mockTx);
        expect(mockGateway.updateProductStockDelta).toHaveBeenCalledWith("P1", -5, mockTx);
    });

    it("calculates COGS correctly from mixed buy prices", async () => {
        const input: DeductStockFIFOInput = {
            saleId: "SALE-002",
            items: [
                { productId: "P1", variant: "Original", quantity: 5, unitPrice: 2000 }
            ]
        };

        mockGateway.findBatchesForFIFO.mockResolvedValue([
            { id: "B-OLD", currentStock: 3, buyPrice: 1000, variantId: "V1" },
            { id: "B-NEW", currentStock: 10, buyPrice: 1500, variantId: "V1" }
        ]);

        const result = await useCase.execute(input, mockTx);

        // COGS = (3 * 1000) + (2 * 1500) = 3000 + 3000 = 6000
        expect(result.cogsAmount).toBe(6000);
    });

    it("calls assertStockConsistency after deduction", async () => {
        const input: DeductStockFIFOInput = {
            saleId: "SALE-003",
            items: [
                { productId: "P1", variant: "Original", quantity: 2, unitPrice: 2000 }
            ]
        };

        mockGateway.findBatchesForFIFO.mockResolvedValue([
            { id: "B-OLD", currentStock: 10, buyPrice: 1000, variantId: "V1" }
        ]);

        await useCase.execute(input, mockTx);

        expect(mockGateway.assertStockConsistency).toHaveBeenCalledWith(["P1"], mockTx);
    });

    it("throws when requested quantity exceeds total stock across batches", async () => {
        const input: DeductStockFIFOInput = {
            saleId: "SALE-004",
            items: [
                { productId: "P1", variant: "Original", quantity: 20, unitPrice: 2000 }
            ]
        };

        mockGateway.findBatchesForFIFO.mockResolvedValue([
            { id: "B-OLD", currentStock: 5, buyPrice: 1000, variantId: "V1" }
        ]);

        await expect(useCase.execute(input, mockTx))
            .rejects.toThrow(/Insufficient stock/);
    });
});
