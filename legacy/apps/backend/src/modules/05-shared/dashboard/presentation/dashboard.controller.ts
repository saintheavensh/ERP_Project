import { Context } from "hono";
import { dashboardFacade } from "../dashboard-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class DashboardController {
    async getDashboardData(c: Context) {
        try {
            const user = c.get("user");
            const data = await dashboardFacade.getDashboardData(user.tenantId);
            return apiSuccess(c, data, "Dashboard data retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve dashboard data", 500);
        }
    }

    async getRecentActivities(c: Context) {
        try {
            const user = c.get("user");
            const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 10;
            const data = await dashboardFacade.getRecentActivities(user.tenantId, limit);
            return apiSuccess(c, data, "Recent activities retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve recent activities", 500);
        }
    }

    async getRecentServices(c: Context) {
        try {
            const user = c.get("user");
            const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 5;
            const data = await dashboardFacade.getRecentServices(user.tenantId, limit);
            return apiSuccess(c, data, "Recent services retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve recent services", 500);
        }
    }

    async getUrgentServices(c: Context) {
        try {
            const user = c.get("user");
            const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 5;
            const data = await dashboardFacade.getUrgentServices(user.tenantId, limit);
            return apiSuccess(c, data, "Urgent services retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve urgent services", 500);
        }
    }

    async getTechnicianDashboard(c: Context) {
        try {
            const user = c.get("user");
            if (!user) return apiError(c, "Unauthorized", "Unauthorized", 401);
            const data = await dashboardFacade.getTechnicianDashboard(user.tenantId, user.id);
            return apiSuccess(c, data, "Technician dashboard data retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve technician dashboard data", 500);
        }
    }

    async getCashierDashboard(c: Context) {
        try {
            const user = c.get("user");
            const data = await dashboardFacade.getCashierDashboard(user.tenantId);
            return apiSuccess(c, data, "Cashier dashboard data retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve cashier dashboard data", 500);
        }
    }

    async getWarehouseDashboard(c: Context) {
        try {
            const user = c.get("user");
            const data = await dashboardFacade.getWarehouseDashboard(user.tenantId);
            return apiSuccess(c, data, "Warehouse dashboard data retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve warehouse dashboard data", 500);
        }
    }

    async getProfitLoss(c: Context) {
        try {
            const user = c.get("user");
            const startDate = c.req.query("startDate");
            const endDate = c.req.query("endDate");
            const data = await dashboardFacade.getProfitLoss(user.tenantId, startDate || undefined, endDate || undefined);
            return apiSuccess(c, data, "Profit & Loss data retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve profit & loss data", 500);
        }
    }
}
