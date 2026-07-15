import { TransactionContext } from "../../../shared/types/db-context";
import { inventoryAuthority } from "../../02-inventory/inventory/inventory-container";
import { ReportRepositoryAdapter } from "./infrastructure";
import {
    GetSalesSummaryUseCase,
    GetTransactionsUseCase,
    GetServiceStatsUseCase,
    GetServiceTransactionsUseCase,
    GetPurchasesSummaryUseCase,
    GetPurchaseTransactionsUseCase,
    GetTechnicianStatsUseCase,
    GetPartsUsageReportUseCase,
    GetActivityLogsUseCase,
    GetProfitAndLossUseCase,
    GetStockValueReportUseCase,
    GetStockAdjustmentsUseCase,
    GetLowStockReportUseCase,
    GetKasirDailyReportUseCase
} from "./application";

// Adapters
const repository = new ReportRepositoryAdapter();

// Use Cases
const getSalesSummaryUC = new GetSalesSummaryUseCase(repository);
const getTransactionsUC = new GetTransactionsUseCase(repository);
const getServiceStatsUC = new GetServiceStatsUseCase(repository);
const getServiceTransactionsUC = new GetServiceTransactionsUseCase(repository);
const getPurchasesSummaryUC = new GetPurchasesSummaryUseCase(repository);
const getPurchaseTransactionsUC = new GetPurchaseTransactionsUseCase(repository);
const getTechnicianStatsUC = new GetTechnicianStatsUseCase(repository);
const getPartsUsageReportUC = new GetPartsUsageReportUseCase(repository);
const getActivityLogsUC = new GetActivityLogsUseCase(repository);
const getProfitAndLossUC = new GetProfitAndLossUseCase(repository);
const getStockValueReportUC = new GetStockValueReportUseCase(repository);
const getStockAdjustmentsUC = new GetStockAdjustmentsUseCase(repository);
const getLowStockReportUC = new GetLowStockReportUseCase(repository);
const getKasirDailyReportUC = new GetKasirDailyReportUseCase(repository);

/**
 * ReportsService — Facade for external and presentation layers.
 */
export class ReportsService {
    async getSalesSummary(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getSalesSummaryUC.execute(tenantId, tx, filters)
        );
    }

    async getTransactions(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getTransactionsUC.execute(tenantId, tx, filters)
        );
    }

    async getServiceStats(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getServiceStatsUC.execute(tenantId, tx, filters)
        );
    }

    async getServiceTransactions(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getServiceTransactionsUC.execute(tenantId, tx, filters)
        );
    }

    async getPurchasesSummary(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getPurchasesSummaryUC.execute(tenantId, tx, filters)
        );
    }

    async getPurchaseTransactions(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getPurchaseTransactionsUC.execute(tenantId, tx, filters)
        );
    }

    async getTechnicianStats(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getTechnicianStatsUC.execute(tenantId, tx, filters)
        );
    }

    async getPartsUsageReport(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getPartsUsageReportUC.execute(tenantId, tx, filters)
        );
    }

    async getActivityLogs(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getActivityLogsUC.execute(tenantId, tx, filters)
        );
    }

    async getProfitAndLoss(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getProfitAndLossUC.execute(tenantId, tx, filters)
        );
    }

    async getStockValueReport(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getStockValueReportUC.execute(tenantId, tx)
        );
    }

    async getStockAdjustments(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getStockAdjustmentsUC.execute(tenantId, tx)
        );
    }

    async getLowStockReport(tenantId: string, threshold?: number) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getLowStockReportUC.execute(tenantId, tx, threshold)
        );
    }

    async getKasirDailyReport(tenantId: string, filters: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getKasirDailyReportUC.execute(tenantId, tx, filters)
        );
    }
}

/** Singleton instance */
export const reportsService = new ReportsService();
