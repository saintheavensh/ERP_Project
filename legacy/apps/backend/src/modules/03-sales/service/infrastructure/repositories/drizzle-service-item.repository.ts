import { eq, and } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { serviceItems } from "../schema/ServiceSchema";
import { IServiceItemRepository } from "../../domain/repositories/service-item-repository.port";

export class DrizzleServiceItemRepository implements IServiceItemRepository {
    async findByServiceId(tenantId: string, serviceId: string, tx: TransactionContext): Promise<any[]> {
        return tx.select().from(serviceItems).where(and(eq(serviceItems.tenantId, tenantId), eq(serviceItems.serviceId, serviceId)));
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null> {
        const rows = await tx.select().from(serviceItems).where(and(eq(serviceItems.tenantId, tenantId), eq(serviceItems.id, id)));
        return rows[0] || null;
    }

    async create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }> {
        const rows = await tx.insert(serviceItems).values({ ...data, tenantId }).returning({ id: serviceItems.id });
        return { id: rows[0].id };
    }

    async update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<void> {
        await tx.update(serviceItems).set(data).where(and(eq(serviceItems.tenantId, tenantId), eq(serviceItems.id, id)));
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(serviceItems).where(and(eq(serviceItems.tenantId, tenantId), eq(serviceItems.id, id)));
    }
}
