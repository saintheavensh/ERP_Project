import { Context } from "hono";
import { purchaseReturnsService, PurchaseReturnsService } from "../purchase-returns-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class PurchaseReturnsController {
    constructor(private readonly service: PurchaseReturnsService = purchaseReturnsService) { }

    async getAll(c: Context) {
        try {
            const data = await this.service.getAll();
            return apiSuccess(c, data, "Purchase returns retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve purchase returns", 500);
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await this.service.getById(id);
            return apiSuccess(c, data, "Purchase return details");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to retrieve purchase return", status);
        }
    }

    async create(c: Context) {
        try {
            const body = await c.req.json();
            const userId = (c.get("jwtPayload") as any)?.id || "system"; // Simplified, usually from middleware

            const data = await this.service.create({
                ...body,
                userId: body.userId || userId
            });

            return apiSuccess(c, data, "Purchase return created", 201);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to create purchase return", status);
        }
    }
}
