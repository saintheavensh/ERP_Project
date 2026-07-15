import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryGatewayAdapter } from "../adapters/InventoryGatewayAdapter";
import { Result } from "../../../../../shared/core/Result";

describe("InventoryGatewayAdapter", () => {
    let adapter: InventoryGatewayAdapter;
    let mockFacade: any;

    beforeEach(() => {
        mockFacade = {
            getStockForProduct: vi.fn(),
            hasActiveTransactions: vi.fn(),
        };
        adapter = new InventoryGatewayAdapter(mockFacade);
    });

    it("should get stock level successfully", async () => {
        mockFacade.getStockForProduct.mockResolvedValue(Result.ok(50));

        const result = await adapter.getStockLevel("prod-1", undefined as any);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toBe(50);
        expect(mockFacade.getStockForProduct).toHaveBeenCalledWith("prod-1", undefined);
    });

    it("should handle facade failure in getStockLevel", async () => {
        mockFacade.getStockForProduct.mockResolvedValue(Result.fail("Inventory down"));

        const result = await adapter.getStockLevel("prod-1", undefined as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Inventory down");
    });
});
