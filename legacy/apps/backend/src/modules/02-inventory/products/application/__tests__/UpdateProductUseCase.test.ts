import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateProductUseCase } from "../use-cases/UpdateProductUseCase";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Result } from "../../../../../shared/core/Result";
import { Product } from "../../domain/entities/Product.entity";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { Price } from "../../domain/value-objects/Price.vo";
import { ProductStatus, Status } from "../../domain/value-objects/ProductStatus.vo";

describe("UpdateProductUseCase", () => {
    let useCase: UpdateProductUseCase;
    let mockRepo: IProductRepository;

    const createDummyProduct = (status: Status = Status.ACTIVE) => {
        return Product.create({
            sku: Sku.create("SKU-1").getValue(),
            name: "Original",
            price: Price.create(100).getValue(),
            status: ProductStatus.create(status).getValue(),
            categoryId: "1"
        }, "prod-1").getValue();
    };

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
            save: vi.fn(),
        } as any;
        useCase = new UpdateProductUseCase(mockRepo, mockLoggerFactory);
    });

    it("should update name and price successfully", async () => {
        const product = createDummyProduct(Status.ACTIVE);
        (mockRepo.findById as any).mockResolvedValue(Result.ok(product));
        (mockRepo.save as any).mockResolvedValue(Result.ok());

        const result = await useCase.execute({
            id: "prod-1",
            data: { name: "Updated Name", price: 500 }
        }, mockTx);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().name).toBe("Updated Name");
        expect(result.getValue().price).toBe(500);
        expect(mockRepo.save).toHaveBeenCalled();
    });

    it("should fail to update archived product", async () => {
        const product = createDummyProduct(Status.ARCHIVED);
        (mockRepo.findById as any).mockResolvedValue(Result.ok(product));

        const result = await useCase.execute({
            id: "prod-1",
            data: { name: "Try to update" }
        }, mockTx);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Cannot update an archived product");
    });
});
