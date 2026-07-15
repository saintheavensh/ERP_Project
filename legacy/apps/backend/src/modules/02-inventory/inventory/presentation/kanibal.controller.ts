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

// List forfeited devices
app.get("/forfeited-devices", async (c) => {
    try {
        const tenantId = requireTenantId(c);
        const list = await inventoryService.getForfeitedDevices(tenantId);
        return apiSuccess(c, list, "Forfeited devices retrieved successfully");
    } catch (e: unknown) {
        return apiError(c, e, "Failed to retrieve forfeited devices");
    }
});

// Forfeit a device from a service
app.post("/forfeit", async (c) => {
    try {
        const tenantId = requireTenantId(c);
        const body = await c.req.json();
        const result = await inventoryService.forfeitServiceDevice(body, tenantId);
        return apiSuccess(c, result, "Device forfeited successfully", 201);
    } catch (e: unknown) {
        return apiError(c, e, "Failed to forfeit device");
    }
});

// Harvest a part from a device
app.post("/harvest", async (c) => {
    try {
        const tenantId = requireTenantId(c);
        const body = await c.req.json();
        const result = await inventoryService.harvestPart(body, tenantId);
        return apiSuccess(c, result, "Part harvested successfully", 201);
    } catch (e: unknown) {
        return apiError(c, e, "Failed to harvest part");
    }
});

export default app;
