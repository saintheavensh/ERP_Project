import { Context } from "hono";
import { CategoryManagementUseCase } from "../application/use-cases/category-management.use-case";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { inventoryAuthority } from "../../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../../shared/types/db-context";

export class ServiceCategoryController {
    constructor(private readonly useCase: CategoryManagementUseCase) { }

    async getAll(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const list = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.getAll(tenantId, tx);
            });
            return apiSuccess(c, list, "Categories retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve categories");
        }
    }

    async getById(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const item = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.getById(tenantId, id, tx);
            });
            if (!item) return apiError(c, "Category not found", "Not Found", 404);
            return apiSuccess(c, item, "Category retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve category");
        }
    }

    async create(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const body = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.create(tenantId, body, tx);
            });
            return apiSuccess(c, result, "Category created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create category");
        }
    }

    async update(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const body = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.update(tenantId, id, body, tx);
            });
            return apiSuccess(c, result, "Category updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update category");
        }
    }

    async delete(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.delete(tenantId, id, tx);
            });
            return apiSuccess(c, null, "Category deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete category");
        }
    }
}
