import { Context } from "hono";
import { salesService, SalesService } from "../sales-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class SalesController {
    constructor(private readonly service: SalesService = salesService) { }

    async getAll(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const query = c.req.query();
            const list = await this.service.getAll(tenantId, query as any);
            return apiSuccess(c, list);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve sales", 500);
        }
    }

    async getOne(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const id = c.req.param("id");
            const item = await this.service.getById(tenantId, id);
            return apiSuccess(c, item);
        } catch (e: any) {
            const status = (e as any).status || 500;
            return apiError(c, e, e.message || "Failed to retrieve sale", status);
        }
    }

    async createSale(c: Context) {
        try {
            const user = c.get("user");
            const tenantId = user?.tenantId || "default";
            const data = (c.req as any).valid("json");
            const result = await this.service.createSale(tenantId, data);
            return apiSuccess(c, result, "Sale created successfully", 201);
        } catch (e: any) {
            const status = (e as any).status || 400;
            return apiError(c, e, e.message || "Failed to create sale", status);
        }
    }
}
