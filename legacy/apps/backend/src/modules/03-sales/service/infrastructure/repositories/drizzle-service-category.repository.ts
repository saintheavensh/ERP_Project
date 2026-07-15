import { TransactionContext } from "../../../../../shared/types/db-context";
import { serviceCategories } from "../schema/ServiceSchema";
import { IServiceCategoryRepository } from "../../domain/repositories/service-category-repository.port";
import { eq, and } from "drizzle-orm";

export class DrizzleServiceCategoryRepository implements IServiceCategoryRepository {
    async findAll(tenantId: string, tx: TransactionContext): Promise<any[]> {
        return tx.select().from(serviceCategories).where(eq(serviceCategories.tenantId, tenantId));
    }
    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null> {
        const rows = await tx.select().from(serviceCategories).where(and(eq(serviceCategories.tenantId, tenantId), eq(serviceCategories.id, id)));
        return rows[0] || null;
    }
    async create(tenantId: string, data: { name: string; description?: string | undefined; minWeight?: number | undefined; maxWeight?: number | undefined }, tx: TransactionContext): Promise<{ id: string }> {
        const rows = await tx.insert(serviceCategories).values({ ...data, tenantId }).returning({ id: serviceCategories.id });
        return { id: rows[0].id };
    }
    async update(tenantId: string, id: string, data: Partial<{ name: string; description: string; minWeight: number; maxWeight: number }>, tx: TransactionContext): Promise<void> {
        await tx.update(serviceCategories).set(data).where(and(eq(serviceCategories.tenantId, tenantId), eq(serviceCategories.id, id)));
    }
    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(serviceCategories).where(and(eq(serviceCategories.tenantId, tenantId), eq(serviceCategories.id, id)));
    }
}
