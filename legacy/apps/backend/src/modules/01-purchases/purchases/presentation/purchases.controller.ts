import { Context } from "hono";
import { purchasesService, PurchasesService } from "../purchases-container";
import { PurchaseOrder } from "../domain/entities/purchase.entity";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class PurchasesController {
    constructor(private readonly service: PurchasesService = purchasesService) { }

    async getAll(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const { search, startDate, endDate, mine, limit, status } = c.req.query();
            let userId = undefined;

            if (mine === "true") {
                if (user) userId = user.id;
            }

            const list = await this.service.getAll(tenantId, {
                search,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                userId,
                status,
                limit: limit ? parseInt(limit) : undefined
            });
            // Convert domain entities to snapshots for response
            const snapshots = list.map((p: PurchaseOrder) => p.toSnapshot());
            return apiSuccess(c, snapshots, "Purchases retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to retrieve purchases", 500);
        }
    }

    async getLowStockSummary(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const result = await this.service.getLowStockSummary(tenantId);
            return apiSuccess(c, result, "Low stock summary retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to retrieve low stock summary", 500);
        }
    }

    async createOrder(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = (c.req as any).valid("json");
            if (user) {
                data.userId = user.id;
            }
            const result = await this.service.createOrder(tenantId, data);
            return apiSuccess(c, result, "Order created successfully", 201);
        } catch (e: any) {
            console.error("[PURCHASES_CONTROLLER] createOrder failed:", e);
            return apiError(c, e, e.message || "Failed to create order", 400);
        }
    }

    async getById(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const id = c.req.param("id");
            const purchase = await this.service.getById(tenantId, id);
            if (!purchase) return apiError(c, null, "Purchase not found", 404);
            return apiSuccess(c, (purchase as PurchaseOrder).toSnapshot());
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to retrieve purchase", 500);
        }
    }

    async deletePurchase(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const id = c.req.param("id");
            await this.service.deletePurchase(tenantId, id);
            return apiSuccess(c, null, "Purchase deleted successfully");
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to delete purchase", 500);
        }
    }

    async cancelOrder(c: Context) {
        try {
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            const tenantId = user.tenantId || "default";
            const id = c.req.param("id");
            const body = await (c.req as any).json().catch(() => ({}));
            const reason = body.reason;

            const result = await this.service.cancelOrder(tenantId, id, user.id, reason);
            return apiSuccess(c, result, "Purchase Order cancelled successfully");
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to cancel order", 400);
        }
    }

    async receiveGoods(c: Context) {
        try {
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            const tenantId = user.tenantId || "default";
            const id = c.req.param("id");
            const { items } = (c.req as any).valid("json");

            const result = await this.service.receiveGoods(tenantId, id, user.id, items);
            return apiSuccess(c, result, "Goods receipt logged successfully");
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to log goods receipt", 400);
        }
    }

    async verifyGoods(c: Context) {
        try {
            const user = c.get("user");
            if (!user) return apiError(c, null, "Unauthorized", 401);
            const tenantId = user.tenantId || "default";
            const id = c.req.param("id");
            const body = await c.req.json();

            const result = await this.service.verifyAndComplete(tenantId, id, user.id, body.items, body);
            return apiSuccess(c, result, "Purchase verified and stocked successfully");
        } catch (e: any) {
            return apiError(c, e, e.message || "Failed to verify purchase", 400);
        }
    }
}
