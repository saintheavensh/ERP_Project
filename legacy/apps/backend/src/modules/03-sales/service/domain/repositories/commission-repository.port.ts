import { TransactionContext } from "../../../../../shared/types/db-context";

export interface ICommissionSettingsRepository {
    findByTechnicianId(tenantId: string, technicianId: string, tx: TransactionContext): Promise<any | null>;
    upsert(tenantId: string, data: any, tx: TransactionContext): Promise<void>;
}

export interface ICommissionRepository {
    create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }>;
    findByTechnicianId(tenantId: string, technicianId: string, tx: TransactionContext, startDate?: Date | undefined, endDate?: Date | undefined): Promise<any[]>;
    markAsPaid(tenantId: string, ids: string[], tx: TransactionContext): Promise<void>;
}
