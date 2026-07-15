import { TransactionContext } from "../../../../../shared/types/db-context";
import { serviceTypes } from "../schema/ServiceSchema";
import { IServiceTypeRepository } from "../../domain/repositories/service-type-repository.port";
import { eq, and } from "drizzle-orm";

export class DrizzleServiceTypeRepository implements IServiceTypeRepository {
    async findAll(tenantId: string, tx: TransactionContext, categoryId?: string | undefined): Promise<any[]> {
        if (categoryId) {
            return tx.select().from(serviceTypes).where(and(eq(serviceTypes.tenantId, tenantId), eq(serviceTypes.categoryId, categoryId)));
        }
        return tx.select().from(serviceTypes).where(eq(serviceTypes.tenantId, tenantId));
    }
    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null> {
        const rows = await tx.select().from(serviceTypes).where(and(eq(serviceTypes.tenantId, tenantId), eq(serviceTypes.id, id)));
        return rows[0] || null;
    }
    async create(tenantId: string, data: { categoryId: string; name: string; weight: number; defaultPrice?: number | undefined; commissionPercent?: number | undefined; warrantyDays?: number | undefined; isActive?: boolean | undefined }, tx: TransactionContext): Promise<{ id: string }> {
        const insertedData: any = { ...data, tenantId };
        if (insertedData.commissionPercent !== undefined) {
            insertedData.commissionPercent = insertedData.commissionPercent !== null ? String(insertedData.commissionPercent) : null;
        }
        const rows = await tx.insert(serviceTypes).values(insertedData).returning({ id: serviceTypes.id });
        return { id: rows[0].id };
    }
    async update(tenantId: string, id: string, data: Partial<{ name: string; weight: number; defaultPrice: number; commissionPercent: number; warrantyDays: number; isActive: boolean }>, tx: TransactionContext): Promise<void> {
        const updateData: any = { ...data };
        if (updateData.commissionPercent !== undefined) {
            updateData.commissionPercent = updateData.commissionPercent !== null ? String(updateData.commissionPercent) : null;
        }
        await tx.update(serviceTypes).set(updateData).where(and(eq(serviceTypes.tenantId, tenantId), eq(serviceTypes.id, id)));
    }
    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(serviceTypes).where(and(eq(serviceTypes.tenantId, tenantId), eq(serviceTypes.id, id)));
    }
}
