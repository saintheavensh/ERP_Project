import { describe, it, expect } from "vitest";
import { Product } from "../entities/Product.entity";
import { Price } from "../value-objects/Price.vo";
import { Sku } from "../value-objects/Sku.vo";
import { ProductStatus, Status } from "../value-objects/ProductStatus.vo";

describe("Product Entity", () => {
    const createValidProduct = () => {
        const sku = Sku.create("SKU-12345").getValue();
        const price = Price.create(10000).getValue();
        const categoryId = "CAT-1";
        return Product.create({
            sku,
            name: "Test Product",
            price,
            categoryId
        }).getValue();
    };

    it("should create a product with default DRAFT status", () => {
        const product = createValidProduct();
        expect(product.name).toBe("Test Product");
        expect(product.status.value).toBe(Status.DRAFT);
    });

    it("should fail to create product with empty name", () => {
        const sku = Sku.create("SKU-123").getValue();
        const price = Price.create(100).getValue();
        const result = Product.create({ sku, name: "", price, categoryId: "1" });
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Product name cannot be empty");
    });

    it("should activate a DRAFT product", () => {
        const product = createValidProduct();
        const result = product.activate();
        expect(result.isSuccess).toBe(true);
        expect(product.status.value).toBe(Status.ACTIVE);
    });

    it("should deactivate an ACTIVE product", () => {
        const product = createValidProduct();
        product.activate();
        const result = product.deactivate();
        expect(result.isSuccess).toBe(true);
        expect(product.status.value).toBe(Status.INACTIVE);
    });

    it("should archive a product", () => {
        const product = createValidProduct();
        const result = product.archive();
        expect(result.isSuccess).toBe(true);
        expect(product.status.value).toBe(Status.ARCHIVED);
    });

    it("should not allow transition from ARCHIVED", () => {
        const product = createValidProduct();
        product.archive();
        const result = product.activate();
        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Cannot transition from ARCHIVED");
    });

    it("should update product price", () => {
        const product = createValidProduct();
        const newPrice = Price.create(20000).getValue();
        product.updatePrice(newPrice);
        expect(product.price.amount).toBe(20000);
    });

    it("should check if can be deleted", () => {
        const product = createValidProduct();
        expect(product.canBeDeleted()).toBe(true); // DRAFT can be deleted
        product.activate();
        expect(product.canBeDeleted()).toBe(false); // ACTIVE cannot be deleted
    });
});
