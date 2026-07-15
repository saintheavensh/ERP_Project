import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteProductUseCase } from "../use-cases/DeleteProductUseCase";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Result } from "../../../../../shared/core/Result";
import { Product } from "../../domain/entities/Product.entity";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { Price } from "../../domain/value-objects/Price.vo";
import { ProductStatus, Status } from "../../domain/value-objects/ProductStatus.vo";

describe("DeleteProductUseCase", () => {
    let useCase: DeleteProductUseCase;
    let mockRepo: IProductRepository;
    let mockInventoryGateway: any;

    const createDummyProduct = (status: Status = Status.DRAFT) => {
        return Product.create({
            sku: Sku.create("SKU-1").getValue(),
            name: "Product",
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
            delete: vi.fn(),
        } as any;
        mockInventoryGateway = {
            hasActiveTransactions: vi.fn(),
        };
        useCase = new DeleteProductUseCase(mockRepo, mockInventoryGateway, mockLoggerFactory);
    });

    it("should delete product successfully if DRAFT and no references", async () => {
        const product = createDummyProduct(Status.DRAFT);
        (mockRepo.findById as any).mockResolvedValue(Result.ok(product));
        (mockInventoryGateway.hasActiveTransactions as any).mockResolvedValue(Result.ok(false));
        (mockRepo.delete as any).mockResolvedValue(Result.ok(true));

        const result = await useCase.execute("prod-1", mockTx);

        expect(result.isSuccess).toBe(true);
        expect(mockRepo.delete).toHaveBeenCalledWith("prod-1", mockTx);
    });

    it("should fail if product is ACTIVE", async () => {
        const product = createDummyProduct(Status.ACTIVE);
        (mockRepo.findById as any).mockResolvedValue(Result.ok(product));

        const result = await useCase.execute("prod-1", mockTx);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("cannot be deleted");
        expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should fail if active inventory records exist", async () => {
        const product = createDummyProduct(Status.DRAFT);
        (mockRepo.findById as any).mockResolvedValue(Result.ok(product));
        (mockInventoryGateway.hasActiveTransactions as any).mockResolvedValue(Result.ok(true));

        const result = await useCase.execute("prod-1", mockTx);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Active inventory records");
        expect(mockRepo.delete).not.toHaveBeenCalled();
    });
});
