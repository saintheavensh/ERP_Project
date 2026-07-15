import { describe, it, expect, vi } from "vitest";
import { ProductValidationService } from "../services/ProductValidationService";
import { Product } from "../entities/Product.entity";
import { Sku } from "../value-objects/Sku.vo";
import { Price } from "../value-objects/Price.vo";
import { ProductStatus, Status } from "../value-objects/ProductStatus.vo";
import { Result } from "../../../../../shared/core/Result";
import { IInventoryGateway } from "../ports/IInventoryGateway";

describe("ProductValidationService", () => {
    const mockInventoryGateway: IInventoryGateway = {
        getStockLevel: vi.fn(),
        hasActiveTransactions: vi.fn()
    };

    const createValidProduct = (status: Status = Status.ACTIVE) => {
        return Product.create({
            sku: Sku.create("SKU-1").getValue(),
            name: "Test",
            price: Price.create(100).getValue(),
            status: ProductStatus.create(status).getValue(),
            categoryId: "1"
        }).getValue();
    };

    it("should validate product for sale successfully", async () => {
        const service = new ProductValidationService(mockInventoryGateway);
        const product = createValidProduct(Status.ACTIVE);

        (mockInventoryGateway.getStockLevel as any).mockResolvedValue(Result.ok(10));

        const result = await service.validateProductForSale(product, 5);
        expect(result.isSuccess).toBe(true);
    });

    it("should fail if product is not active", async () => {
        const service = new ProductValidationService(mockInventoryGateway);
        const product = createValidProduct(Status.DRAFT);

        const result = await service.validateProductForSale(product, 1);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("is not active for sale");
    });

    it("should fail if stock is insufficient", async () => {
        const service = new ProductValidationService(mockInventoryGateway);
        const product = createValidProduct(Status.ACTIVE);

        (mockInventoryGateway.getStockLevel as any).mockResolvedValue(Result.ok(2));

        const result = await service.validateProductForSale(product, 5);
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Insufficient stock");
    });

    it("should check product references", async () => {
        const service = new ProductValidationService(mockInventoryGateway);

        (mockInventoryGateway.hasActiveTransactions as any).mockResolvedValue(Result.ok(true));

        const result = await service.checkProductReferences("prod-1");
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().hasInventory).toBe(true);
        expect(result.getValue().canBeDeleted).toBe(false);
    });
});
