import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IReportRepository {
    getSalesData(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]>;
    getTransactions(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]>;
    getServices(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]>;
    getServiceTransactions(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]>;
    getPurchases(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]>;
    getTechnicians(tenantId: string, tx: TransactionContext): Promise<any[]>;
    getServicesWithTechnicians(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]>;
    getActivityLogs(tenantId: string, conditions: any[], tx: TransactionContext, limit?: number | undefined): Promise<any[]>;
    getOperationalCosts(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]>;
    getCategoriesWithStock(tenantId: string, tx: TransactionContext): Promise<any[]>;
    getLowStockItems(tenantId: string, threshold: number, tx: TransactionContext): Promise<any[]>;
    getSalesPayments(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]>;
}
