import { Hono } from "hono";
import { inventoryService } from "../inventory-container";
import { apiSuccess, apiError } from "@shared/application/middlewares/ResponseHelpers";

function requireTenantId(c: { get(key: string): Record<string, unknown> | undefined }): string {
    const user = c.get("user");
    if (!user?.tenantId) {
        throw new Error("TenantId missing from token");
    }
    return user.tenantId as string;
}

const app = new Hono();

// List all dead phones
app.get("/dead-phones", async (c) => {
    try {
        const tenantId = requireTenantId(c);
        const list = await inventoryService.getDeadPhones(tenantId);
        return apiSuccess(c, list, "Dead phones retrieved successfully");
    } catch (e: unknown) {
        return apiError(c, e, "Failed to retrieve dead phones");
    }
});

// Record a new dead phone purchase
app.post("/dead-phones", async (c) => {
    try {
        const tenantId = requireTenantId(c);
        const body = await c.req.json();
        const result = await inventoryService.recordDeadPhonePurchase(body, tenantId);
        return apiSuccess(c, result, "Dead phone purchase recorded", 201);
    } catch (e: unknown) {
        return apiError(c, e, "Failed to record dead phone purchase");
    }
});

// Record a test log for a dead phone
app.post("/test-logs", async (c) => {
    try {
        const tenantId = requireTenantId(c);
        const body = await c.req.json();
        const result = await inventoryService.recordTestLog(body, tenantId);
        return apiSuccess(c, result, "Test log recorded", 201);
    } catch (e: unknown) {
        return apiError(c, e, "Failed to record test log");
    }
});

export default app;
