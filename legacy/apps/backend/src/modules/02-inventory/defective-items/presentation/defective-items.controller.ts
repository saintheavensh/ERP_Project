import type { Context } from "hono";
import { defectiveItemsApplicationService, DefectiveItemsApplicationService } from "../defective-items-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

function requireTenantId(c: Context): string {
    const user = c.get("user");
    if (!user?.tenantId) {
        throw new Error("TenantId missing from token");
    }
    return user.tenantId as string;
}

export class DefectiveItemsController {
    constructor(
        private readonly service: DefectiveItemsApplicationService = defectiveItemsApplicationService
    ) { }

    async getPending(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const list = await this.service.getPendingItems(tenantId);
            return apiSuccess(c, list, "Pending defective items retrieved successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to retrieve pending defective items");
        }
    }

    async getProcessed(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const list = await this.service.getProcessedItems(tenantId);
            return apiSuccess(c, list, "Processed defective items retrieved successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to retrieve processed defective items");
        }
    }

    async createItem(c: Context) {
        try {
            const tenantId = requireTenantId(c);
            const data = await c.req.json();
            const result = await this.service.addItem(tenantId, data);
            return apiSuccess(c, result, "Defective item added successfully", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to add defective item";
            const status = (e instanceof Error && "status" in e ? (e as Error & { status: number }).status : 400) as import("hono/utils/http-status").ContentfulStatusCode;
            return apiError(c, e, message, status);
        }
    }

    async processReturn(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = requireTenantId(c);
            const { itemIds } = await c.req.json();
            const result = await this.service.processReturn(tenantId, user.id, itemIds);
            return apiSuccess(c, result, "Purchase return created successfully", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to process return";
            const status = (e instanceof Error && "status" in e ? (e as Error & { status: number }).status : 400) as import("hono/utils/http-status").ContentfulStatusCode;
            return apiError(c, e, message, status);
        }
    }
}
