import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreatePurchaseUseCase } from "../use-cases/create-purchase.use-case";
import { Result } from "../../../../../shared/core/Result";

describe("CreatePurchaseUseCase", () => {
    let useCase: CreatePurchaseUseCase;
    let mockPurchaseRepo: any;
    let mockSupplierRepo: any;
    let mockProductRepo: any;
    let mockRecordStockMovementUseCase: any;

    beforeEach(() => {
        mockPurchaseRepo = {
            save: vi.fn().mockResolvedValue(undefined)
        };
        mockSupplierRepo = {
            findById: vi.fn().mockResolvedValue({ id: "SUP-123", isActive: true })
        };
        mockProductRepo = {
            findByIdForUpdate: vi.fn().mockResolvedValue(Result.ok({ isActive: true }))
        };
        mockRecordStockMovementUseCase = {
            execute: vi.fn().mockResolvedValue(Result.ok({}))
        };

        useCase = new CreatePurchaseUseCase(
            mockPurchaseRepo,
            mockSupplierRepo,
            mockProductRepo,
            mockRecordStockMovementUseCase
        );
    });

    it("should successfully create a purchase and record IN stock movements", async () => {
        const input = {
            supplierId: "SUP-123",
            userId: "USR-001",
            items: [{ productId: "PRD-999", qtyOrdered: 10, buyPrice: 100, sellPrice: 150 }]
        };

        const mockTx = {
            tenantId: "test-tenant",
            requestId: "test-request",
            startedAt: Date.now()
        } as any;

        const result = await useCase.execute(input, mockTx);

        expect(result.isSuccess).toBe(true);
        expect(mockSupplierRepo.findById).toHaveBeenCalledWith("SUP-123", mockTx);
        expect(mockProductRepo.findByIdForUpdate).toHaveBeenCalledWith("PRD-999", mockTx);
        expect(mockPurchaseRepo.save).toHaveBeenCalled();
        expect(mockRecordStockMovementUseCase.execute).toHaveBeenCalledWith(
            expect.objectContaining({ type: "IN", quantity: 10, referenceType: "PURCHASE" }),
            mockTx
        );
    });

    it("should fail if supplier does not exist or is inactive", async () => {
        mockSupplierRepo.findById.mockResolvedValueOnce(null);
        const mockTx = { tenantId: "test-tenant" } as any;

        const result = await useCase.execute({
            supplierId: "INVALID",
            userId: "USR-001",
            items: []
        }, mockTx);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain("not found or inactive");
    });

    it("should fail if any product does not exist or is inactive", async () => {
        mockProductRepo.findByIdForUpdate.mockResolvedValueOnce(Result.ok({ isActive: false }));
        const mockTx = { tenantId: "test-tenant" } as any;

        const result = await useCase.execute({
            supplierId: "SUP-123",
            userId: "USR-001",
            items: [{ productId: "PRD-INACTIVE", qtyOrdered: 10, buyPrice: 100, sellPrice: 150 }]
        }, mockTx);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain("is inactive and cannot be purchased");
        expect(mockPurchaseRepo.save).not.toHaveBeenCalled();
    });

    it("should fail transaction if product order qty <= 0", async () => {
        const mockTx = { tenantId: "test-tenant" } as any;
        const result = await useCase.execute({
            supplierId: "SUP-123",
            userId: "USR-001",
            items: [{ productId: "PRD-1", qtyOrdered: -5, buyPrice: 100, sellPrice: 150 }]
        }, mockTx);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain("must be > 0");
    });
});
