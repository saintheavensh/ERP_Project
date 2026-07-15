import { Context } from "hono";
import { TypeManagementUseCase } from "../application/use-cases/type-management.use-case";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { inventoryAuthority } from "../../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../../shared/types/db-context";

export class ServiceTypeController {
    constructor(private readonly useCase: TypeManagementUseCase) { }

    async getAll(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const categoryId = c.req.query("categoryId");
            const list = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.getAll(tenantId, tx, categoryId);
            });
            return apiSuccess(c, list, "Types retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve types");
        }
    }

    async getById(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const item = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.getById(tenantId, id, tx);
            });
            if (!item) return apiError(c, "Type not found", "Not Found", 404);
            return apiSuccess(c, item, "Type retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve type");
        }
    }

    async create(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const body = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.create(tenantId, body, tx);
            });
            return apiSuccess(c, result, "Type created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create type");
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
            return apiSuccess(c, result, "Type updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update type");
        }
    }

    async delete(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.delete(tenantId, id, tx);
            });
            return apiSuccess(c, null, "Type deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete type");
        }
    }
}
