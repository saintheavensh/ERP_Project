import { Context, Hono } from "hono";
import { approvalsService, ApprovalsService } from "../approvals-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { inventoryAuthority } from "../../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../../shared/types/db-context";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";

export class ApprovalsController {
    constructor(
        private readonly service: ApprovalsService = approvalsService
    ) { }

    async getPending(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getPending(tenantId, tx);
            });
            return apiSuccess(c, result, "Pending approvals retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve pending approvals");
        }
    }

    async getHistory(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const { type, status } = c.req.query();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                const filters: { type?: string; status?: string } = {};
                if (typeof type === 'string') filters.type = type;
                if (typeof status === 'string') filters.status = status;
                return await this.service.getHistory(tenantId, tx, filters);
            });
            return apiSuccess(c, result, "Approval history retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve approval history");
        }
    }

    async getStats(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getStats(tenantId, tx);
            });
            return apiSuccess(c, result, "Approval stats retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve approval stats");
        }
    }

    async getById(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.getById(tenantId, id, tx);
            });
            if (!result) return apiError(c, null, "Approval not found", 404);
            return apiSuccess(c, result, "Approval detail retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve approval detail");
        }
    }

    async requestApproval(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const body = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.requestApproval(tenantId, body, tx);
            });
            return apiSuccess(c, result, "Approval requested", 201);
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to request approval");
        }
    }

    async approve(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const body = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.approve(tenantId, { approvalId: id, ...body }, tx);
            });
            return apiSuccess(c, result, "Approval approved");
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to approve");
        }
    }

    async reject(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const { reason } = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.service.reject(tenantId, id, reason, tx);
            });
            return apiSuccess(c, result, "Approval rejected");
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to reject");
        }
    }
}

const app = new Hono();
const controller = new ApprovalsController();

app.use("*", authMiddleware);

app.get("/pending", (c) => controller.getPending(c));
app.get("/history", (c) => controller.getHistory(c));
app.get("/stats", (c) => controller.getStats(c));
app.get("/:id", (c) => controller.getById(c));
app.post("/request", (c) => controller.requestApproval(c));
app.post("/:id/approve", (c) => controller.approve(c));
app.post("/:id/reject", (c) => controller.reject(c));

export default app;
