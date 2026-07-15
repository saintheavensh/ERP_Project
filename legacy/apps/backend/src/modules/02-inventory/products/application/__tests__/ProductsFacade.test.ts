import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductsFacade } from "../facades/ProductsFacade";
import { Result } from "../../../../../shared/core/Result";

describe("ProductsFacade", () => {
    let facade: ProductsFacade;
    let mockInventoryAuthority: any;
    let mockCreateUC: any;
    let mockGetUC: any;
    let mockUpdateUC: any;
    let mockActivateUC: any;
    let mockDeleteUC: any;
    let mockGetProductsUC: any;
    let mockGetVariantsUC: any;
    let mockGetBatchesUC: any;

    const tenantId = "test-tenant";

    beforeEach(() => {
        mockInventoryAuthority = {
            execute: vi.fn().mockImplementation((_ctx: any, fn: any) => fn({ tenantId }))
        };
        mockCreateUC = { execute: vi.fn() };
        mockGetProductsUC = { execute: vi.fn() };
        mockGetUC = { execute: vi.fn() };
        mockGetVariantsUC = { execute: vi.fn() };
        mockGetBatchesUC = { execute: vi.fn() };
        mockUpdateUC = { execute: vi.fn() };
        mockActivateUC = { execute: vi.fn() };
        mockDeleteUC = { execute: vi.fn() };

        facade = new ProductsFacade(
            mockInventoryAuthority,
            mockCreateUC,
            mockGetProductsUC,
            mockGetUC,
            mockGetVariantsUC,
            mockGetBatchesUC,
            mockUpdateUC,
            mockActivateUC,
            mockDeleteUC
        );
    });

    it("should delegate createProduct to use case via authority", async () => {
        const data = { sku: "S1", name: "N1", price: 1, categoryId: "C1" };
        mockCreateUC.execute.mockResolvedValue(Result.ok({ id: "1", ...data }));

        const result = await facade.createProduct(tenantId, data);
        expect(result.isSuccess).toBe(true);
        expect(mockInventoryAuthority.execute).toHaveBeenCalled();
        expect(mockCreateUC.execute).toHaveBeenCalledWith(data, expect.anything());
    });

    it("should delegate getProduct to use case via authority", async () => {
        mockGetUC.execute.mockResolvedValue(Result.ok({ id: "1", name: "P1" }));
        const result = await facade.getProduct(tenantId, "1");
        expect(result.isSuccess).toBe(true);
        expect(mockGetUC.execute).toHaveBeenCalledWith({ id: "1" }, expect.anything());
    });

    it("should delegate updateProduct to use case via authority", async () => {
        const updateData = { name: "New" };
        mockUpdateUC.execute.mockResolvedValue(Result.ok({ id: "1", name: "New" }));
        const result = await facade.updateProduct(tenantId, "1", updateData);
        expect(result.isSuccess).toBe(true);
        expect(mockUpdateUC.execute).toHaveBeenCalledWith({ id: "1", data: updateData }, expect.anything());
    });
});
