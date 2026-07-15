import { Context } from "hono";
import { reportsService, ReportsService } from "../reports-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class ReportsController {
    constructor(
        private readonly service: ReportsService = reportsService
    ) { }

    async getSummary(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const summary = await this.service.getSalesSummary(tenantId, { startDate, endDate });
            return apiSuccess(c, summary, "Sales summary retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve sales summary");
        }
    }

    async getTransactions(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const transactions = await this.service.getTransactions(tenantId, { startDate, endDate });
            return apiSuccess(c, transactions, "Transactions retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve transactions");
        }
    }

    async getServiceStats(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const stats = await this.service.getServiceStats(tenantId, { startDate, endDate });
            return apiSuccess(c, stats, "Service stats retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve service stats");
        }
    }

    async getServiceTransactions(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const transactions = await this.service.getServiceTransactions(tenantId, { startDate, endDate });
            return apiSuccess(c, transactions, "Service transactions retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve service transactions");
        }
    }

    async getPurchasesSummary(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const summary = await this.service.getPurchasesSummary(tenantId, { startDate, endDate });
            return apiSuccess(c, summary, "Purchases summary retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve purchases summary");
        }
    }

    async getPurchaseTransactions(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const transactions = await this.service.getPurchaseTransactions(tenantId, { startDate, endDate });
            return apiSuccess(c, transactions, "Purchase transactions retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve purchase transactions");
        }
    }

    async getTechnicianStats(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const stats = await this.service.getTechnicianStats(tenantId, { startDate, endDate });
            return apiSuccess(c, stats, "Technician stats retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve technician stats");
        }
    }

    async getPartsUsageReport(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const report = await this.service.getPartsUsageReport(tenantId, { startDate, endDate });
            return apiSuccess(c, report, "Parts usage report retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve parts usage report");
        }
    }

    async getActivityLogs(c: Context) {
        try {
            const { startDate, endDate, userId, action, entityType, limit } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const logs = await this.service.getActivityLogs(tenantId, {
                startDate,
                endDate,
                userId,
                action,
                entityType,
                limit: limit ? parseInt(limit) : undefined
            });
            return apiSuccess(c, logs, "Activity logs retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve activity logs");
        }
    }

    async getProfitAndLoss(c: Context) {
        try {
            const { startDate, endDate, commissionModel } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const data = await this.service.getProfitAndLoss(tenantId, {
                startDate,
                endDate,
                commissionModel: commissionModel as any
            });
            return apiSuccess(c, data, "Profit and loss report retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve profit and loss report");
        }
    }

    async getStockValueReport(c: Context) {
        try {
            const tenantId = c.get("user")?.tenantId || "default";
            const data = await this.service.getStockValueReport(tenantId);
            return apiSuccess(c, data, "Stock value report retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve stock value report");
        }
    }

    async getStockAdjustments(c: Context) {
        try {
            const tenantId = c.get("user")?.tenantId || "default";
            const data = await this.service.getStockAdjustments(tenantId);
            return apiSuccess(c, data, "Stock adjustments retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve stock adjustments");
        }
    }

    async getKasirDailyReport(c: Context) {
        try {
            const { startDate, endDate } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const data = await this.service.getKasirDailyReport(tenantId, { startDate, endDate });
            return apiSuccess(c, data, "Daily cashier report retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve daily cashier report");
        }
    }

    async getLowStockReport(c: Context) {
        try {
            const { threshold } = c.req.query();
            const tenantId = c.get("user")?.tenantId || "default";
            const data = await this.service.getLowStockReport(tenantId, threshold ? parseInt(threshold) : undefined);
            return apiSuccess(c, data, "Low stock report retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve low stock report");
        }
    }
}
