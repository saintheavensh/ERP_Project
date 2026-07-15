import { eq, and } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { serviceParts } from "../schema/ServiceSchema";
import { IServicePartRepository } from "../../domain/repositories/service-part-repository.port";

export class DrizzleServicePartRepository implements IServicePartRepository {
    async findByServiceItemId(tenantId: string, serviceItemId: string, tx: TransactionContext): Promise<any[]> {
        return tx.select().from(serviceParts).where(and(eq(serviceParts.tenantId, tenantId), eq(serviceParts.serviceItemId, serviceItemId)));
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null> {
        const rows = await tx.select().from(serviceParts).where(and(eq(serviceParts.tenantId, tenantId), eq(serviceParts.id, id)));
        return rows[0] || null;
    }

    async create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }> {
        const rows = await tx.insert(serviceParts).values({ ...data, tenantId }).returning({ id: serviceParts.id });
        return { id: rows[0].id };
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(serviceParts).where(and(eq(serviceParts.tenantId, tenantId), eq(serviceParts.id, id)));
    }
}
