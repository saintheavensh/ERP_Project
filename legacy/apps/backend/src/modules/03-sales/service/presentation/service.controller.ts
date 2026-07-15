import { Context } from "hono";
import { serviceApplicationService, ServiceApplicationService } from "../services-container";
import { PrintService } from "../../../../shared/infrastructure/printing/PrintService";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class ServiceController {
    constructor(
        private readonly service: ServiceApplicationService = serviceApplicationService
    ) { }

    async getAll(c: Context) {
        try {
            const status = c.req.query("status");
            const technicianId = c.req.query("technicianId");
            const tenantId = c.get("user")?.tenantId || "default";

            const params: any = {};
            if (status) params.status = status;
            if (technicianId) params.technicianId = technicianId;

            const list = await this.service.getAll(tenantId, params);
            return apiSuccess(c, list, "Services retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve services");
        }
    }

    async getCounts(c: Context) {
        try {
            const tenantId = c.get("user")?.tenantId || "default";
            const counts = await this.service.getCounts(tenantId);
            return apiSuccess(c, counts, "Service counts retrieved");
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    async getStats(c: Context) {
        try {
            const user = (c as any).get("user");
            const tenantId = user?.tenantId || "default";
            if (user?.role === 'teknisi') {
                const stats = await this.service.getTechnicianDashboardStats(tenantId, user.id);
                return apiSuccess(c, stats, "Dashboard stats retrieved");
            }
            return apiSuccess(c, { message: "Admin stats not fully implemented yet" });
        } catch (e: any) {
            return apiError(c, e);
        }
    }

    async getById(c: Context) {
        const id = c.req.param("id");
        try {
            const tenantId = c.get("user")?.tenantId || "default";
            const item = await this.service.getById(tenantId, id);
            return apiSuccess(c, item, "Service retrieved successfully");
        } catch (e: any) {
            const status = (e as any).status || 500;
            return apiError(c, e, e.message || "Failed to retrieve service", status);
        }
    }

    async createService(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = (c as any).get("user");
            const tenantId = user?.tenantId || "default";
            const result = await this.service.createService(tenantId, data, user?.id || "USR-000");
            return apiSuccess(c, result, "Service created successfully", 201);
        } catch (e: any) {
            const status = (e as any).status || 400;
            return apiError(c, e, e.message || "Failed to create service", status);
        }
    }

    async updateStatus(c: Context) {
        const id = c.req.param("id");
        try {
            const data = await c.req.json();
            const user = (c as any).get("user");
            const tenantId = user?.tenantId || "default";
            await this.service.updateStatus(tenantId, id, { ...data, userId: user?.id || data.userId });
            return apiSuccess(c, null, "Status updated successfully");
        } catch (e: any) {
            const status = (e as any).status || 400;
            return apiError(c, e, e.message || "Failed to update status", status);
        }
    }

    async updateDetails(c: Context) {
        const id = c.req.param("id");
        try {
            const body = await c.req.json();
            const user = (c as any).get("user");
            const tenantId = user?.tenantId || "default";
            await this.service.updateDetails(tenantId, id, body, user?.id || "USR-000");
            return apiSuccess(c, null, "Details updated successfully");
        } catch (e: any) {
            const status = (e as any).status || 400;
            return apiError(c, e, e.message || "Failed to update details", status);
        }
    }

    async deleteService(c: Context) {
        const id = c.req.param("id");
        try {
            const tenantId = c.get("user")?.tenantId || "default";
            await this.service.delete(tenantId, id);
            return apiSuccess(c, null, "Service deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete service", 500);
        }
    }

    async printService(c: Context) {
        const id = c.req.param("id");
        try {
            const tenantId = c.get("user")?.tenantId || "default";
            const item = await this.service.getById(tenantId, id);

            const printer = new PrintService();
            const result = await printer.printServiceNote(item as any);
            if (!result.success) {
                return apiError(c, result.error, "Print failed", 500);
            }
            return apiSuccess(c, null, "Print command sent to server printer");
        } catch (e: any) {
            return apiError(c, String(e), "Print failed", 500);
        }
    }

    async patchService(c: Context) {
        const id = c.req.param("id");
        try {
            const body = await c.req.json();
            const tenantId = c.get("user")?.tenantId || "default";
            const result = await this.service.patchService(tenantId, id, body);
            return apiSuccess(c, result, "Service updated successfully");
        } catch (e: any) {
            const status = (e as any).status || 400;
            return apiError(c, e, "Failed to update service", status);
        }
    }

    async assignTechnician(c: Context) {
        const id = c.req.param("id");
        try {
            const body = await c.req.json();
            const user = (c as any).get("user");
            const tenantId = user?.tenantId || "default";
            if (!body.technicianId) return apiError(c, "Technician ID required", "Validation Error", 400);

            const result = await this.service.assignTechnician(tenantId, id, body.technicianId, user?.id || "USR-000");
            return apiSuccess(c, result, "Technician assigned successfully");
        } catch (e: any) {
            const status = (e as any).status || 400;
            return apiError(c, e, "Failed to assign technician", status);
        }
    }
}
