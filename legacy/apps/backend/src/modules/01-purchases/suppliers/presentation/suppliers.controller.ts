import { Context } from "hono";
import { suppliersFacade, SuppliersFacade } from "../suppliers-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class SuppliersController {
    constructor(
        private readonly facade: SuppliersFacade = suppliersFacade
    ) { }

    async getAll(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const list = await this.facade.getAll(tenantId);
            return apiSuccess(c, list, "Suppliers retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve suppliers", 500);
        }
    }

    async getLinkedCategories(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const list = await this.facade.getLinkedCategories(tenantId, id);
            return apiSuccess(c, list, "Supplier categories retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve supplier categories", 500);
        }
    }

    async create(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const data = (c.req as any).valid("json");
            const result = await this.facade.create(tenantId, data);
            return apiSuccess(c, result, "Supplier created successfully", 201);
        } catch (e: any) {
            if (e.message && e.message.includes("Validation") || e.name === "ZodError") {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to create supplier", 500);
        }
    }

    async update(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            await this.facade.update(tenantId, id, data);
            return apiSuccess(c, null, "Supplier updated successfully");
        } catch (e: any) {
            if (e.message && e.message.includes("Validation") || e.name === "ZodError") {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to update supplier", 500);
        }
    }

    async delete(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            await this.facade.delete(tenantId, id);
            return apiSuccess(c, null, "Supplier deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete supplier", 400);
        }
    }

    async linkCategory(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const { categoryId } = (c.req as any).valid("json");
            await this.facade.linkCategory(tenantId, id, categoryId);
            return apiSuccess(c, null, "Category linked successfully");
        } catch (e) {
            return apiError(c, e, "Failed to link category", 500);
        }
    }

    async unlinkCategory(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const categoryId = c.req.param("categoryId");
            await this.facade.unlinkCategory(tenantId, id, categoryId);
            return apiSuccess(c, null, "Category unlinked successfully");
        } catch (e) {
            return apiError(c, e, "Failed to unlink category", 500);
        }
    }

    async getMappedProductVariants(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const supplierId = c.req.param("id");
            const list = await this.facade.getMappedProductVariants(tenantId, supplierId);
            return apiSuccess(c, list, "Mapped product variants retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve mapped product variants", 500);
        }
    }

    async mapProductVariant(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const supplierId = c.req.param("id");
            const body = (c.req as any).valid("json");
            await this.facade.mapProductVariant(tenantId, supplierId, body.productId, body.variantId);
            return apiSuccess(c, null, "Product variant mapped successfully");
        } catch (e) {
            return apiError(c, e, "Failed to map product variant", 500);
        }
    }

    async unmapProductVariant(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const supplierId = c.req.param("id");
            const productId = c.req.param("productId");
            // variantId is optional. If provided via query params or another path param we can extract it.
            // Let's assume it can be in the body or query params if multiple variants share the same product ID.
            // Alternatively require body using DELETE, or just read from query e.g. ?variantId=123
            const variantId = c.req.query("variantId");

            await this.facade.unmapProductVariant(tenantId, supplierId, productId, variantId);
            return apiSuccess(c, null, "Product variant unmapped successfully");
        } catch (e) {
            return apiError(c, e, "Failed to unmap product variant", 500);
        }
    }
}
