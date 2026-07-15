import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivateProductUseCase } from "../use-cases/ActivateProductUseCase";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Result } from "../../../../../shared/core/Result";
import { Product } from "../../domain/entities/Product.entity";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { Price } from "../../domain/value-objects/Price.vo";
import { Status } from "../../domain/value-objects/ProductStatus.vo";

describe("ActivateProductUseCase", () => {
    let useCase: ActivateProductUseCase;
    let mockRepo: IProductRepository;

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
        useCase = new ActivateProductUseCase(mockRepo, mockLoggerFactory);
    });

    it("should activate product successfully", async () => {
        const product = Product.create({
            sku: Sku.create("SKU-1").getValue(),
            name: "Test",
            price: Price.create(100).getValue(),
            categoryId: "1"
        }).getValue();

        expect(product.status.value).toBe(Status.DRAFT);
        (mockRepo.findById as any).mockResolvedValue(Result.ok(product));
        (mockRepo.save as any).mockResolvedValue(Result.ok());

        const result = await useCase.execute("prod-1", mockTx);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().status).toBe(Status.ACTIVE);
        expect(mockRepo.save).toHaveBeenCalled();
    });
});
