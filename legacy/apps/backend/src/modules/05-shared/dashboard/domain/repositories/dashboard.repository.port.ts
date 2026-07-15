import { DBContext } from "../../../../../shared/types/db-context";

export interface IDashboardRepository {
    getActiveServicesCount(tenantId: string, tx: DBContext): Promise<number>;
    getReadyPickupCount(tenantId: string, tx: DBContext): Promise<number>;
    getLowStockCount(tenantId: string, tx: DBContext): Promise<number>;
    getPendingVerificationsCount(tenantId: string, tx: DBContext): Promise<number>;
    getTopProducts(tenantId: string, limit: number, tx: DBContext): Promise<any[]>;
    getRecentActivities(tenantId: string, limit: number, tx: DBContext): Promise<any[]>;
    getRecentServices(tenantId: string, limit: number, tx: DBContext): Promise<any[]>;
    getUrgentServices(tenantId: string, limit: number, tx: DBContext): Promise<any[]>;
    getTechnicianJobs(tenantId: string, technicianId: string, tx: DBContext): Promise<any[]>;
    getTechnicianQueue(tenantId: string, limit: number, tx: DBContext): Promise<any[]>;
    getTechnicianStats(tenantId: string, technicianId: string, startOfDay: Date, tx: DBContext): Promise<{ completedToday: number; inProgress: number }>;
    getCashierStats(tenantId: string, startOfDay: Date, tx: DBContext): Promise<any>;
    getWarehouseStats(tenantId: string, tx: DBContext): Promise<any>;
    getIncomingOrders(tenantId: string, limit: number, tx: DBContext): Promise<any[]>;
    getLowStockProducts(tenantId: string, limit: number, tx: DBContext): Promise<any[]>;
    getProcurementTasks(tenantId: string, limit: number, tx: DBContext): Promise<any[]>;
}
