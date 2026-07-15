import type { Context } from "hono";
import { categoriesFacade } from "../categories-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

function requireTenantId(c: Context): string {
    const user = c.get("user");
    if (!user?.tenantId) {
        throw new Error("TenantId missing from token");
    }
    return user.tenantId as string;
}

export class CategoriesController {
    async getAll(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const list = await categoriesFacade.getAll(tenantId);
            return apiSuccess(c, list, "Categories retrieved successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to retrieve categories", 500);
        }
    }

    async create(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const data = (c.req as unknown as { valid(target: string): unknown }).valid("json");
            const result = await categoriesFacade.create(tenantId, data);
            return apiSuccess(c, result, "Category created successfully", 201);
        } catch (e: unknown) {
            return apiError(c, e, "Failed to create category", 500);
        }
    }

    async update(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            const data = (c.req as unknown as { valid(target: string): unknown }).valid("json");
            await categoriesFacade.update(tenantId, id, data);
            return apiSuccess(c, null, "Category updated successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to update category", 500);
        }
    }

    async delete(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const id = c.req.param("id");
            await categoriesFacade.delete(tenantId, id);
            return apiSuccess(c, null, "Category deleted successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to delete category", 400);
        }
    }

    async addVariantTemplate(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const categoryId = c.req.param("id");
            const { name, supplierId } = (c.req as unknown as { valid(target: string): { name: string; supplierId: string } }).valid("json");
            const result = await categoriesFacade.addVariantTemplate(tenantId, categoryId, name, supplierId);
            return apiSuccess(c, result, "Variant template added");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to add variant template", 500);
        }
    }

    async removeVariantTemplate(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const variantId = c.req.param("variantId");
            await categoriesFacade.removeVariantTemplate(tenantId, variantId);
            return apiSuccess(c, null, "Variant template removed");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to remove variant template", 500);
        }
    }
}
