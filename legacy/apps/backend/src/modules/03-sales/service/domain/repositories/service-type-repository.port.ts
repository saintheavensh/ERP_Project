import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IServiceTypeRepository {
    findAll(tenantId: string, tx: TransactionContext, categoryId?: string | undefined): Promise<any[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null>;
    create(tenantId: string, data: { categoryId: string; name: string; weight: number; defaultPrice?: number | undefined; commissionPercent?: number | undefined; warrantyDays?: number | undefined; isActive?: boolean | undefined }, tx: TransactionContext): Promise<{ id: string }>;
    update(tenantId: string, id: string, data: Partial<{ name: string; weight: number; defaultPrice: number; commissionPercent: number; warrantyDays: number; isActive: boolean }>, tx: TransactionContext): Promise<void>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
}
