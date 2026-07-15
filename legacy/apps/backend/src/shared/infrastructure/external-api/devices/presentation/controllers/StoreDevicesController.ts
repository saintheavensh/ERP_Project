import { Context } from "hono";
import { injectable, inject } from "inversify";
import { TYPES } from "../../../../../core/types";
import { StoreDeviceFacade } from "../../application/facades/StoreDeviceFacade";
import { apiSuccess, apiError } from "../../../../../../shared/application/middlewares/ResponseHelpers";

@injectable()
export class StoreDevicesController {
    constructor(
        @inject(TYPES.StoreDeviceFacade) private readonly facade: StoreDeviceFacade
    ) { }

    async register(c: Context) {
        try {
            const body = await c.req.json();
            const result = await this.facade.register(body);
            if (result.isFailure) return apiError(c, result.errorValue(), "Failed to register device", 400);
            return apiSuccess(c, result.getValue(), "Device registered successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to register device");
        }
    }

    async getStatus(c: Context) {
        try {
            const deviceId = c.req.param("deviceId");
            const result = await this.facade.getStatus(deviceId);
            if (result.isFailure) return apiError(c, result.errorValue(), "Device not found", 404);
            return apiSuccess(c, result.getValue(), "Device status details");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve status");
        }
    }

    async ping(c: Context) {
        try {
            const deviceId = c.req.param("deviceId");
            const result = await this.facade.ping(deviceId);
            if (result.isFailure) return apiError(c, result.errorValue(), "Ping failed", 400);
            return apiSuccess(c, result.getValue(), "Ping successful");
        } catch (e: any) {
            return apiError(c, e, "Failed to ping device");
        }
    }
}
