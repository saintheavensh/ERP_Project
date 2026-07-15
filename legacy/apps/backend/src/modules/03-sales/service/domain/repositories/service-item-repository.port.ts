import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IServiceItemRepository {
    findByServiceId(tenantId: string, serviceId: string, tx: TransactionContext): Promise<any[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null>;
    create(tenantId: string, data: { serviceId: string; serviceTypeId?: string | undefined; technicianId?: string | undefined; description?: string | undefined; estimatedCost?: number | undefined; actualCost?: number | undefined; status?: string | undefined }, tx: TransactionContext): Promise<{ id: string }>;
    update(tenantId: string, id: string, data: Partial<{ serviceTypeId: string; technicianId: string; description: string; estimatedCost: number; actualCost: number; status: string; completedAt: Date }>, tx: TransactionContext): Promise<void>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
}
