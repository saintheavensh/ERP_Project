import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    CreateSaleUseCase,
    ProductNotFoundError,
    ProductInactiveError,
    InsufficientStockError,
    InvalidQuantityError
} from "../use-cases/create-sale.use-case";
import { Result } from "../../../../../shared/core/Result";

describe("CreateSaleUseCase", () => {
    let useCase: CreateSaleUseCase;
    let mockSaleRepo: any;
    let mockAccountingGateway: any;
    let mockMemberGateway: any;
    let mockSettingsGateway: any;
    let mockApprovalGateway: any;
    let mockDb: any;
    let mockGetProductStockUseCase: any;
    let mockProductRepo: any;
    let mockInventoryTransactionService: any;

    const validInput = {
        userId: "USR-001",
        items: [{ productId: "PRD-001", variant: "default", qty: 2, price: 50000 }],
        payments: [{ method: "cash", methodId: "PM-CASH", amount: 100000 }],
    };

    beforeEach(() => {
        mockSaleRepo = {
            create: vi.fn().mockResolvedValue(undefined),
            createItem: vi.fn().mockResolvedValue(undefined),
            createPayment: vi.fn().mockResolvedValue(undefined),
        };

        mockAccountingGateway = {
            isRegisterOpen: vi.fn().mockResolvedValue(true),
            createJournal: vi.fn().mockResolvedValue(undefined),
            recordCashTransaction: vi.fn().mockResolvedValue(undefined),
        };

        mockMemberGateway = { findById: vi.fn(), updateDebt: vi.fn() };
        mockSettingsGateway = { getPaymentMethods: vi.fn().mockResolvedValue({ methods: [] }) };
        mockApprovalGateway = { needsApproval: vi.fn().mockResolvedValue(false), isApproved: vi.fn() };

        mockDb = { transaction: vi.fn((fn: any) => fn("mock-tx")) };

        mockGetProductStockUseCase = {
            execute: vi.fn().mockResolvedValue(Result.ok(100)),
        };

        mockProductRepo = {
            findById: vi.fn().mockResolvedValue(Result.ok({ isActive: true })),
            findByIdForUpdate: vi.fn().mockResolvedValue(Result.ok({ isActive: true })),
        };

        // InventoryTransactionService mock: replaces direct inventoryGateway + recordStockMovementUseCase
        mockInventoryTransactionService = {
            deductForSale: vi.fn().mockResolvedValue({
                allocations: [{ productId: "PRD-001", batchId: "B-001", variantName: "default", quantity: 2 }],
                totalCOGS: 60000,
            }),
        };

        useCase = new CreateSaleUseCase(
            mockSaleRepo,
            mockAccountingGateway,
            mockMemberGateway,
            mockSettingsGateway,
            mockApprovalGateway,
            mockGetProductStockUseCase as any,
            mockProductRepo,
            mockInventoryTransactionService
        );
    });

    // ─── Success Case ───────────────────────────────────────────────────

    it("should successfully create a sale via InventoryTransactionService", async () => {
        const mockTx = { tenantId: "test-tenant" } as any;
        const result = await useCase.execute(validInput, mockTx);

        expect(result.message).toBe("Sale created");
        expect(result.id).toBeDefined();

        // Verify product validation
        expect(mockProductRepo.findById).toHaveBeenCalledWith("PRD-001", mockTx);

        // Verify row-level lock in transaction
        expect(mockProductRepo.findByIdForUpdate).toHaveBeenCalledWith("PRD-001", mockTx);

        // Verify InventoryTransactionService was called (NOT inventoryGateway directly)
        expect(mockInventoryTransactionService.deductForSale).toHaveBeenCalledWith(
            expect.objectContaining({
                referenceId: expect.any(String),
                items: [{ productId: "PRD-001", variant: "default", quantity: 2 }],
            }),
            mockTx
        );

        // Verify sale + payment + items persisted
        expect(mockSaleRepo.create).toHaveBeenCalled();
        expect(mockSaleRepo.createPayment).toHaveBeenCalled();
        expect(mockSaleRepo.createItem).toHaveBeenCalled();

        // Verify accounting journal created
        expect(mockAccountingGateway.createJournal).toHaveBeenCalled();
    });

    // ─── Insufficient Stock ─────────────────────────────────────────────

    it("should throw InsufficientStockError when pre-check stock is insufficient", async () => {
        mockGetProductStockUseCase.execute.mockResolvedValueOnce(Result.ok(0));
        const mockTx = { tenantId: "test-tenant" } as any;
        await expect(useCase.execute(validInput, mockTx)).rejects.toThrow(InsufficientStockError);
        expect(mockSaleRepo.create).not.toHaveBeenCalled();
    });

    it("should throw InsufficientStockError during revalidation after row-level lock", async () => {
        mockGetProductStockUseCase.execute
            .mockResolvedValueOnce(Result.ok(100))   // pre-check passes
            .mockResolvedValueOnce(Result.ok(1));     // revalidation under lock fails

        const mockTx = { tenantId: "test-tenant" } as any;
        await expect(useCase.execute(validInput, mockTx)).rejects.toThrow(InsufficientStockError);
    });

    // ─── Inactive Product ───────────────────────────────────────────────

    it("should throw ProductInactiveError for inactive product", async () => {
        mockProductRepo.findById.mockResolvedValueOnce(Result.ok({ isActive: false }));

        const mockTx = { tenantId: "test-tenant" } as any;
        await expect(useCase.execute(validInput, mockTx)).rejects.toThrow(ProductInactiveError);
        expect(mockSaleRepo.create).not.toHaveBeenCalled();
    });

    it("should throw ProductInactiveError when product becomes inactive between pre-check and lock", async () => {
        mockProductRepo.findById.mockResolvedValueOnce(Result.ok({ isActive: true }));
        mockProductRepo.findByIdForUpdate.mockResolvedValueOnce(Result.ok({ isActive: false }));

        const mockTx = { tenantId: "test-tenant" } as any;
        await expect(useCase.execute(validInput, mockTx)).rejects.toThrow(ProductInactiveError);
    });

    // ─── Product Not Found ──────────────────────────────────────────────

    it("should throw ProductNotFoundError when product does not exist", async () => {
        mockProductRepo.findById.mockResolvedValueOnce(Result.fail("Not found"));

        const mockTx = { tenantId: "test-tenant" } as any;
        await expect(useCase.execute(validInput, mockTx)).rejects.toThrow(ProductNotFoundError);
        expect(mockSaleRepo.create).not.toHaveBeenCalled();
    });

    // ─── Invalid Quantity ───────────────────────────────────────────────

    it("should throw InvalidQuantityError for qty <= 0", async () => {
        const input = {
            ...validInput,
            items: [{ productId: "PRD-001", variant: "default", qty: 0, price: 50000 }],
        };

        const mockTx = { tenantId: "test-tenant" } as any;
        await expect(useCase.execute(input, mockTx)).rejects.toThrow(InvalidQuantityError);
        expect(mockSaleRepo.create).not.toHaveBeenCalled();
    });

    // ─── Concurrency Simulation ─────────────────────────────────────────

    it("should handle concurrent sales: second sale fails when stock exhausted under lock", async () => {
        const input5 = {
            ...validInput,
            items: [{ productId: "PRD-001", variant: "default", qty: 5, price: 50000 }],
            payments: [{ method: "cash", methodId: "PM-CASH", amount: 250000 }],
        };

        const mockTx = { tenantId: "test-tenant" } as any;
        // First sale succeeds
        const result1 = await useCase.execute(input5, mockTx);
        expect(result1.message).toBe("Sale created");

        // Second sale: pre-check passes but lock revalidation fails
        const mockGetStock2 = {
            execute: vi.fn()
                .mockResolvedValueOnce(Result.ok(5))
                .mockResolvedValueOnce(Result.ok(0)),
        };
        const useCase2 = new CreateSaleUseCase(
            mockSaleRepo, mockAccountingGateway,
            mockMemberGateway, mockSettingsGateway, mockApprovalGateway,
            mockGetStock2 as any, mockProductRepo, mockInventoryTransactionService
        );

        await expect(useCase2.execute(input5, mockTx)).rejects.toThrow(InsufficientStockError);
    });

    // ─── Rollback Test ──────────────────────────────────────────────────

    it("should rollback if InventoryTransactionService.deductForSale fails", async () => {
        mockInventoryTransactionService.deductForSale.mockRejectedValueOnce(
            new Error("FIFO deduction failed")
        );

        mockDb.transaction.mockImplementationOnce(async (fn: any) => {
            try {
                return await fn("mock-tx");
            } catch (e) {
                throw e;
            }
        });

        const mockTx = { tenantId: "test-tenant" } as any;
        await expect(useCase.execute(validInput, mockTx)).rejects.toThrow("FIFO deduction failed");
    });

    // ─── No Direct Gateway/UseCase Calls ────────────────────────────────

    it("should NOT call inventoryGateway or recordStockMovementUseCase directly", async () => {
        // These should not exist as constructor dependencies anymore
        const constructorParams = CreateSaleUseCase.toString();
        expect(constructorParams).not.toContain("inventoryGateway");
        expect(constructorParams).not.toContain("recordStockMovementUseCase");
    });
});
