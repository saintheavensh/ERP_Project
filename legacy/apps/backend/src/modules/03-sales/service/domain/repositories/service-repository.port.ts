import { TransactionContext } from "../../../../../shared/types/db-context";
import { ServiceTicket } from "../entities/service.entity";

export interface IServiceRepository {
    findAll(tenantId: string, params: { status?: string | undefined; technicianId?: string | undefined }, tx: TransactionContext): Promise<ServiceTicket[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<ServiceTicket | null>;
    findLastServiceNo(tenantId: string, prefix: string, tx: TransactionContext): Promise<{ no: string } | null>;
    getCountsByStatus(tenantId: string, tx: TransactionContext): Promise<Array<{ status: string; count: number }>>;
    getTechnicianStats(tenantId: string, technicianId: string, start: Date, end: Date, tx: TransactionContext): Promise<ServiceTicket[]>;
    create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }>;
    update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<void>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
    logActivity(tenantId: string, params: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        description: string;
        oldValue?: any;
        newValue?: any;
    }, tx: TransactionContext): Promise<void>;
    getTimeline(tenantId: string, entityId: string, tx: TransactionContext): Promise<any[]>;
}
