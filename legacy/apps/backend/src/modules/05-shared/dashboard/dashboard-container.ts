import { DashboardRepositoryAdapter } from "./infrastructure";
import { reportsService } from "../../04-finance/reports/reports-container";
import { settingsService } from "../settings/settings-container";
import { db } from "../../../shared/infrastructure/database/client";
import { SharedTransactionAuthority } from "../application/services/shared-transaction-authority";
import {
    GetDashboardDataUseCase,
    GetRecentActivitiesUseCase,
    GetRecentServicesUseCase,
    GetUrgentServicesUseCase,
    GetTechnicianDashboardUseCase,
    GetCashierDashboardUseCase,
    GetWarehouseDashboardUseCase,
    GetProfitLossUseCase
} from "./application";

// Authority
const authority = new SharedTransactionAuthority(db as any);

// Adapters
const dashboardRepository = new DashboardRepositoryAdapter();

// Use Cases
const getDashboardDataUseCase = new GetDashboardDataUseCase(dashboardRepository, reportsService);
const getRecentActivitiesUseCase = new GetRecentActivitiesUseCase(dashboardRepository);
const getRecentServicesUseCase = new GetRecentServicesUseCase(dashboardRepository);
const getUrgentServicesUseCase = new GetUrgentServicesUseCase(dashboardRepository);
const getTechnicianDashboardUseCase = new GetTechnicianDashboardUseCase(dashboardRepository);
const getCashierDashboardUseCase = new GetCashierDashboardUseCase(dashboardRepository);
const getWarehouseDashboardUseCase = new GetWarehouseDashboardUseCase(dashboardRepository);
const getProfitLossUseCase = new GetProfitLossUseCase(settingsService, reportsService);

/**
 * DashboardFacade — Single entry point for the Dashboard module.
 * Wires internal use cases and provides a clean interface for external layers.
 */
export class DashboardFacade {
    constructor(private readonly authority: SharedTransactionAuthority) { }

    async getDashboardData(tenantId: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getDashboardDataUseCase.execute(tenantId, tx);
        });
    }

    async getRecentActivities(tenantId: string, limit: number) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getRecentActivitiesUseCase.execute(tenantId, limit, tx);
        });
    }

    async getRecentServices(tenantId: string, limit: number) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getRecentServicesUseCase.execute(tenantId, limit, tx);
        });
    }

    async getUrgentServices(tenantId: string, limit: number) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getUrgentServicesUseCase.execute(tenantId, limit, tx);
        });
    }

    async getTechnicianDashboard(tenantId: string, technicianId: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getTechnicianDashboardUseCase.execute(tenantId, technicianId, tx);
        });
    }

    async getCashierDashboard(tenantId: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getCashierDashboardUseCase.execute(tenantId, tx);
        });
    }

    async getWarehouseDashboard(tenantId: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getWarehouseDashboardUseCase.execute(tenantId, tx);
        });
    }

    async getProfitLoss(tenantId: string, startDate?: string, endDate?: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getProfitLossUseCase.execute(tenantId, startDate, endDate, tx);
        });
    }
}

/** Singleton instance */
export const dashboardFacade = new DashboardFacade(authority);
