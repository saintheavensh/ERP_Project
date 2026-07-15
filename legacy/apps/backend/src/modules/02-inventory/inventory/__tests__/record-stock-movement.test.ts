import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecordStockMovementUseCase } from "../application/use-cases/record-stock-movement.use-case";
import { Result } from "../../../../shared/core/Result";

describe("RecordStockMovementUseCase", () => {
    let useCase: RecordStockMovementUseCase;
    let mockStockRepo: any;
    let mockProductRepo: any;
    const mockTx = { tenantId: 'test-tenant' } as any;

    beforeEach(() => {
        mockStockRepo = {
            insert: vi.fn(),
            getAggregatedStock: vi.fn()
        };
        mockProductRepo = {
            findByIdForUpdate: vi.fn()
        };
        useCase = new RecordStockMovementUseCase(mockStockRepo, mockProductRepo);
    });

    it("should fail if quantity is 0", async () => {
        const input = {
            productId: "PROD-1",
            type: "IN" as any,
            referenceType: "MANUAL" as any,
            referenceId: "REF-1",
            quantity: 0
        };

        const result = await useCase.execute(input, mockTx);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Quantity cannot be zero");
    });

    it("should fail IN operation if quantity is negative", async () => {
        const input = {
            productId: "PROD-1",
            type: "IN" as any,
            referenceType: "MANUAL" as any,
            referenceId: "REF-1",
            quantity: -5
        };

        const result = await useCase.execute(input, mockTx);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("IN movements must have a quantity > 0");
    });

    it("should fail if product id cannot be locked", async () => {
        const input = {
            productId: "PROD-1",
            type: "IN" as any,
            referenceType: "MANUAL" as any,
            referenceId: "REF-1",
            quantity: 5
        };

        mockProductRepo.findByIdForUpdate.mockResolvedValue(Result.fail('Not found'));

        const result = await useCase.execute(input, mockTx);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Product not found or unable to acquire lock");
    });

    it("should fail OUT operation if stock is insufficient", async () => {
        const input = {
            productId: "PROD-1",
            type: "OUT" as any,
            referenceType: "SALE" as any,
            referenceId: "SALE-1",
            quantity: 10
        };

        mockProductRepo.findByIdForUpdate.mockResolvedValue(Result.ok());
        mockStockRepo.getAggregatedStock.mockResolvedValue(5); // Only 5 in stock

        const result = await useCase.execute(input, mockTx);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Insufficient stock for OUT operation");
    });

    it("should record IN operation successfully", async () => {
        const input = {
            productId: "PROD-1",
            type: "IN" as any,
            referenceType: "PURCHASE" as any,
            referenceId: "PURCH-1",
            quantity: 50
        };

        mockProductRepo.findByIdForUpdate.mockResolvedValue(Result.ok());
        mockStockRepo.insert.mockResolvedValue({ id: "MOV-1", ...input });

        const result = await useCase.execute(input, mockTx);
        expect(result.isSuccess).toBe(true);
        expect(mockStockRepo.insert).toHaveBeenCalledWith({
            productId: "PROD-1",
            type: "IN",
            referenceType: "PURCHASE",
            referenceId: "PURCH-1",
            quantity: 50
        }, mockTx);
    });
});
