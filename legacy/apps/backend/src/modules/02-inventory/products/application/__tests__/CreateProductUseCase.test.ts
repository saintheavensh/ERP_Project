import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateProductUseCase } from "../use-cases/CreateProductUseCase";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Result } from "../../../../../shared/core/Result";

describe("CreateProductUseCase", () => {
    let useCase: CreateProductUseCase;
    let mockRepo: IProductRepository;

    let mockCategoryGateway: any;
    let mockLoggerFactory: any;
    const mockTx = { tenantId: 'test-tenant' } as any;

    beforeEach(() => {
        mockLoggerFactory = {
            createLogger: vi.fn().mockReturnValue({
                info: vi.fn(),
                error: vi.fn(),
                debug: vi.fn(),
                warn: vi.fn(),
                child: vi.fn().mockReturnThis()
            })
        };
        mockRepo = {
            save: vi.fn(),
            findById: vi.fn(),
            findBySku: vi.fn(),
            delete: vi.fn(),
            findActive: vi.fn(),
        } as any;
        mockCategoryGateway = {
            categoryExists: vi.fn().mockResolvedValue(true)
        };
        useCase = new CreateProductUseCase(mockRepo, mockCategoryGateway, mockLoggerFactory);
    });

    it("should create a product successfully", async () => {
        const input = {
            sku: "SKU-123",
            name: "Test Product",
            price: 1000,
            categoryId: "CAT-1"
        };

        (mockRepo.save as any).mockResolvedValue(Result.ok());
        (mockRepo.findBySku as any).mockResolvedValue(Result.fail('Not found')); // simulate unique

        const result = await useCase.execute(input, mockTx);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().name).toBe("Test Product");
        expect(result.getValue().sku).toBe("SKU-123");
        expect(mockRepo.save).toHaveBeenCalled();
        expect(mockCategoryGateway.categoryExists).toHaveBeenCalledWith("CAT-1", mockTx);
    });

    it("should fail if SKU format is invalid", async () => {
        const input = {
            sku: "", // Invalid SKU
            name: "Test",
            price: 100,
            categoryId: "1"
        };

        const result = await useCase.execute(input, mockTx);
        expect(result.isFailure).toBe(true);
        expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("should fail if price is negative", async () => {
        const input = {
            sku: "SKU-1",
            name: "Test",
            price: -100,
            categoryId: "1"
        };

        const result = await useCase.execute(input, mockTx);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Price amount cannot be negative");
    });
});
