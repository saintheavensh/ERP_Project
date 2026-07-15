import { Context } from "hono";
import { operationalCostsService, OperationalCostsService } from "../operational-costs-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { inventoryAuthority } from "../../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../../shared/types/db-context";

export class OperationalCostsController {
    constructor(
        private readonly service: OperationalCostsService = operationalCostsService
    ) { }

    async getAll(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const data = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getAll(tenantId, tx);
            });
            return apiSuccess(c, data, "Operational costs retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve operational costs");
        }
    }

    async create(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.create(tenantId, body, tx, userId);
            });
            return apiSuccess(c, result, "Operational cost created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to create operational cost", (e as any).status || 400);
        }
    }

    async delete(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.delete(tenantId, id, tx);
            });
            return apiSuccess(c, result, "Operational cost deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete operational cost");
        }
    }
}
