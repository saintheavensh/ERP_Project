import { Context } from "hono";
import { ManageCommissionUseCase } from "../application/use-cases/manage-commission.use-case";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { inventoryAuthority } from "../../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../../shared/types/db-context";

export class CommissionController {
    constructor(private readonly useCase: ManageCommissionUseCase) { }

    async getSettings(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const technicianId = c.req.param("technicianId");
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.getSettings(tenantId, technicianId, tx);
            });
            return apiSuccess(c, result, undefined);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve commission settings");
        }
    }

    async upsertSettings(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const technicianId = c.req.param("technicianId");
            const body = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.upsertSettings(tenantId, technicianId, body, tx);
            });
            return apiSuccess(c, result, "Commission settings updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update commission settings");
        }
    }

    async getSummary(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const technicianId = c.req.param("technicianId");
            const start = c.req.query("startDate");
            const end = c.req.query("endDate");

            const startDate = start ? new Date(start) : undefined;
            const endDate = end ? new Date(end) : undefined;

            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.getSummary(tenantId, technicianId, tx, startDate, endDate);
            });
            return apiSuccess(c, result, undefined);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve commission summary");
        }
    }

    async markAsPaid(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const body = await c.req.json();
            if (!Array.isArray(body.ids)) {
                return apiError(c, "Invalid input, expected an array of 'ids'", "Validation Error", 400);
            }
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.useCase.markAsPaid(tenantId, body.ids, tx);
            });
            return apiSuccess(c, result, "Commissions marked as paid");
        } catch (e: any) {
            return apiError(c, e, "Failed to mark commissions as paid");
        }
    }
}
