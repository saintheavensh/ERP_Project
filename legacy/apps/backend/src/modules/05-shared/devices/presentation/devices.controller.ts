import { Context } from "hono";
import { devicesFacade, DevicesFacade } from "../devices-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class DevicesController {
    constructor(
        private readonly facade: DevicesFacade = devicesFacade
    ) { }

    async scrape(c: Context) {
        try {
            const body = await c.req.json();
            if (!body.url) return apiError(c, "URL is required", "Missing URL", 400);

            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = await this.facade.scrape(body.url);
            return apiSuccess(c, data, "Device data scraped successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to scrape data");
        }
    }

    async scrapeList(c: Context) {
        try {
            const body = await c.req.json();
            if (!body.url) return apiError(c, "URL is required", "Missing URL", 400);

            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const links = await this.facade.getLinks(body.url);
            return apiSuccess(c, links, "List parsed successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to parse list");
        }
    }

    async importUrl(c: Context) {
        try {
            const body = await c.req.json();
            if (!body.url) return apiError(c, "URL is required", "Missing URL", 400);

            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = await this.facade.importFromUrl(tenantId, body.url);
            return apiSuccess(c, data, "Device imported successfully");
        } catch (e: any) {
            // Note: Maintaining original behavior of returning success: false with 200 status on import error if it was intended
            return apiSuccess(c, { error: e.message, success: false }, "Failed to import", 200);
        }
    }

    async getAll(c: Context) {
        try {
            const search = c.req.query("search");
            const brand = c.req.query("brand");
            const limit = parseInt(c.req.query("limit") || "20");
            const offset = parseInt(c.req.query("offset") || "0");
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = await this.facade.getAll(tenantId, { search, limit, offset, brand });
            return apiSuccess(c, data, "Devices retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve devices");
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = await this.facade.getById(tenantId, id);
            if (!data) return apiError(c, null, "Device not found", 404);
            return apiSuccess(c, data, "Device details");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve device");
        }
    }

    async create(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const body = (c.req as any).valid("json");
            const data = await this.facade.create(tenantId, body);
            return apiSuccess(c, data, "Device created", 201);
        } catch (e: any) {
            if (e.message && e.message.includes("Validation") || e.name === "ZodError") {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to create device");
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const body = (c.req as any).valid("json");
            const data = await this.facade.update(tenantId, id, body);
            if (!data) return apiError(c, null, "Device not found", 404);
            return apiSuccess(c, data, "Device updated");
        } catch (e: any) {
            if (e.message && e.message.includes("Validation") || e.name === "ZodError") {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to update device");
        }
    }

    async bulkDelete(c: Context) {
        try {
            const body = await c.req.json();
            if (!body.ids || !Array.isArray(body.ids)) {
                return apiError(c, null, "IDs must be an array", 400);
            }
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = await this.facade.bulkDelete(tenantId, body.ids);
            return apiSuccess(c, data, "Devices deleted");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete devices");
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = await this.facade.delete(tenantId, id);
            if (!data) return apiError(c, null, "Device not found", 404);
            return apiSuccess(c, data, "Device deleted");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete device");
        }
    }

    async getUnlinked(c: Context) {
        try {
            const limit = parseInt(c.req.query("limit") || "50");
            const offset = parseInt(c.req.query("offset") || "0");
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = await this.facade.getUnlinkedProducts(tenantId, limit, offset);
            return apiSuccess(c, data, "Unlinked products retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve unlinked products");
        }
    }

    async sync(c: Context) {
        try {
            const id = c.req.param("id");
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const result = await this.facade.syncCompatibility(tenantId, id);
            return apiSuccess(c, result, "Device compatibility synced");
        } catch (e: any) {
            return apiError(c, e, "Failed to sync");
        }
    }
}
