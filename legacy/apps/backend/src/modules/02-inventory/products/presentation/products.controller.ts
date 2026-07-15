/**
 * Products controller — handles HTTP requests and delegates to ProductsService (Facade).
 * Injected via constructor (DI pattern).
 */
import type { Context } from "hono";
import { productsService } from "../products-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { logger } from "@shared/logging/AppLogger";
import type { CreateProductDTO } from "../application/dtos/CreateProductDTO";
import type { UpdateProductDTO } from "../application/dtos/UpdateProductDTO";

function requireTenantId(c: Context): string {
    const user = c.get("user");
    if (!user?.tenantId) {
        throw new Error("TenantId missing from token");
    }
    return user.tenantId as string;
}

export class ProductsController {
    constructor(private readonly service: typeof productsService = productsService) { }

    async getAllProducts(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const { search, categoryId, deviceId } = c.req.query();
            const result = await this.service.getAllProducts(tenantId, deviceId, search, categoryId);
            return apiSuccess(c, result.data, "Products retrieved successfully", 200, result.meta);
        } catch (e: unknown) {
            logger.error("ProductsController.getAllProducts Error", { service: "inventory", tenantId: "unknown", requestId: "unknown" }, { error: e });
            return apiError(c, e, "Failed to retrieve products");
        }
    }

    async getProductById(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            const productRes = await this.service.getProduct(tenantId, id);
            if (productRes.isFailure) return apiError(c, null, productRes.errorValue() as string, 404);
            return apiSuccess(c, productRes.getValue());
        } catch (e: unknown) {
            logger.error("ProductsController.getProductById Error", { service: "inventory", tenantId: "unknown", requestId: "unknown" }, { error: e });
            return apiError(c, e, "Failed to retrieve product");
        }
    }

    async createProduct(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const data = (c.req as unknown as { valid(target: string): CreateProductDTO }).valid("json");
            const result = await this.service.createProduct(tenantId, data);
            if (result.isFailure) return apiError(c, null, result.errorValue() as string, 400);
            return c.json(result.getValue(), 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async updateProduct(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            const data = (c.req as unknown as { valid(target: string): UpdateProductDTO }).valid("json");
            const result = await this.service.updateProduct(tenantId, id, data);
            if (result.isFailure) return apiError(c, null, result.errorValue() as string, 400);
            return c.json(result.getValue());
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async deleteProduct(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            const result = await this.service.deleteProduct(tenantId, id);
            if (result.isFailure) return apiError(c, null, result.errorValue() as string, 400);
            return c.json({ message: "deleted" });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async getSupplierVariants(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const supplierId = c.req.param("id");
            const variants = await this.service.getBatches(tenantId, supplierId);
            return c.json(variants);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async createVariant(c: Context) {
        return apiError(c, null, "Not implemented in facade yet", 501);
    }

    async updateVariant(c: Context) {
        return apiError(c, null, "Not implemented in facade yet", 501);
    }

    async getProductVariants(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const productId = c.req.param("id");
            const { supplierId } = c.req.query();
            const variants = await this.service.getProductVariants(tenantId, productId, supplierId);
            return c.json(variants);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async deleteVariant(c: Context) {
        return apiError(c, null, "Not implemented in facade yet", 501);
    }

    async bulkUpdateMinStock(c: Context) {
        return apiError(c, null, "Not implemented in facade yet", 501);
    }

    async getProductCountByCategory(c: Context) {
        return c.json({ count: 0 });
    }

    async getStats(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const stats = await this.service.getStats(tenantId);
            return apiSuccess(c, stats, "Statistics retrieved successfully");
        } catch (e: unknown) {
            logger.error("ProductsController.getStats Error", { service: "inventory", tenantId: "unknown", requestId: "unknown" }, { error: e });
            return apiError(c, e, "Failed to retrieve statistics");
        }
    }

    async searchProduct(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const { q } = c.req.query();
            const results = await this.service.searchProduct(tenantId, q);
            return apiSuccess(c, results);
        } catch (e: unknown) {
            logger.error("ProductsController.searchProduct Error", { service: "inventory", tenantId: "unknown", requestId: "unknown" }, { error: e });
            return apiError(c, e, "Failed to search product");
        }
    }

    async getBatches(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const { supplierId } = c.req.query();
            const batches = await this.service.getBatches(tenantId, supplierId);
            return c.json(batches);
        } catch (e: unknown) {
            logger.error("ProductsController.getBatches Error", { service: "inventory", tenantId: "unknown", requestId: "unknown" }, { error: e });
            const message = e instanceof Error ? e.message : String(e);
            return c.json({ error: message }, 500);
        }
    }

    async printLabel(c: Context) {
        return apiError(c, null, "Not implemented in facade yet", 501);
    }
}
