import { Context } from "hono";
import { AddServiceItemUseCase } from "../application/use-cases/add-service-item.use-case";
import { AddServicePartUseCase } from "../application/use-cases/add-service-part.use-case";
import { CompleteServiceItemUseCase } from "../application/use-cases/complete-service-item.use-case";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import { inventoryAuthority } from "../../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../../shared/types/db-context";

export class ServiceItemController {
    constructor(
        private readonly addItemUseCase: AddServiceItemUseCase,
        private readonly addPartUseCase: AddServicePartUseCase,
        private readonly completeItemUseCase: CompleteServiceItemUseCase
    ) { }

    async addItem(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const body = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.addItemUseCase.execute(tenantId, body, tx);
            });
            return apiSuccess(c, result, "Service item added", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to add service item");
        }
    }

    async addPart(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const body = await c.req.json();
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.addPartUseCase.execute(tenantId, { ...body, serviceItemId: id }, tx);
            });
            return apiSuccess(c, result, "Service part added", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to add service part");
        }
    }

    async completeItem(c: Context) {
        try {
            const tenantId = c.get("tenantId");
            const id = c.req.param("id");
            const result = await inventoryAuthority.execute(tenantId, async (tx: TransactionContext) => {
                return await this.completeItemUseCase.execute(tenantId, id, tx);
            });
            return apiSuccess(c, result, "Service item completed");
        } catch (e: any) {
            const status = (e as any).status || 400;
            return apiError(c, e, e.message || "Failed to complete service item", status);
        }
    }
}
