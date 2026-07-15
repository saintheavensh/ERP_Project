import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetProductUseCase } from "../use-cases/GetProductUseCase";
import { Result } from "../../../../../shared/core/Result";
import { Product } from "../../domain/entities/Product.entity";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { Price } from "../../domain/value-objects/Price.vo";
import { ProductStatus, Status } from "../../domain/value-objects/ProductStatus.vo";

describe("GetProductUseCase", () => {
    let useCase: GetProductUseCase;
    let mockRepo: any;

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
            findById: vi.fn(),
        };
        useCase = new GetProductUseCase(mockRepo, mockLoggerFactory);
    });

    it("should return a product when it exists", async () => {
        const product = Product.create({
            sku: Sku.create("SKU-1").getValue(),
            name: "Test",
            price: Price.create(100).getValue(),
            status: ProductStatus.create(Status.ACTIVE).getValue(),
            categoryId: "cat-1",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, "1").getValue();

        mockRepo.findById.mockResolvedValue(Result.ok(product));

        const result = await useCase.execute({ id: "1" }, mockTx);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().id).toBe("1");
        expect(mockRepo.findById).toHaveBeenCalledWith("1", mockTx);
    });

    it("should return fail when product does not exist", async () => {
        mockRepo.findById.mockResolvedValue(Result.fail("Not found"));

        const result = await useCase.execute({ id: "999" }, mockTx);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Not found");
    });
});
