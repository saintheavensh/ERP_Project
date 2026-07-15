import { describe, it, expect, vi, beforeEach } from "vitest";
import { DrizzleProductRepository } from "../persistence/DrizzleProductRepository";
import { products } from "../schema/ProductSchema";
import { Product } from "../../domain/entities/Product.entity";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { Price } from "../../domain/value-objects/Price.vo";
import { Status } from "../../domain/value-objects/ProductStatus.vo";
import { Result } from "../../../../../shared/core/Result";

describe("DrizzleProductRepository", () => {
    let repository: DrizzleProductRepository;
    let mockDrizzle: any;

    beforeEach(() => {
        mockDrizzle = {
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            offset: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            onConflictDoUpdate: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
        };
        repository = new DrizzleProductRepository();
    });

    it("should find product by id", async () => {
        const rawRow = {
            id: "1",
            sku: "SKU-1",
            name: "Test",
            price: 100,
            status: "ACTIVE",
            categoryId: "cat-1",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockDrizzle.groupBy.mockResolvedValue([rawRow]);

        const result = await repository.findById("1", mockDrizzle);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue().id).toBe("1");
        expect(mockDrizzle.select).toHaveBeenCalled();
    });

    it("should return fail if product not found", async () => {
        mockDrizzle.groupBy.mockResolvedValue([]);

        const result = await repository.findById("999", mockDrizzle);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
    });
});
