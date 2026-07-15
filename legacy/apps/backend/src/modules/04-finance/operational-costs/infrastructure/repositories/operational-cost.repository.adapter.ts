import { eq, desc, and } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { operationalCosts } from "../../../../../shared/infrastructure/database/schema";
import { IOperationalCostRepository, OperationalCost } from "../../domain";

export class OperationalCostRepositoryAdapter implements IOperationalCostRepository {
    async findAll(tenantId: string, tx: TransactionContext, limit: number = 100): Promise<OperationalCost[]> {
        const results = await tx.select()
            .from(operationalCosts)
            .where(eq(operationalCosts.tenantId, tenantId))
            .orderBy(desc(operationalCosts.date))
            .limit(limit);
        return results as OperationalCost[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<OperationalCost | null> {
        const [result] = await tx.select()
            .from(operationalCosts)
            .where(and(eq(operationalCosts.tenantId, tenantId), eq(operationalCosts.id, id)));
        return (result as OperationalCost) || null;
    }

    async create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }> {
        const [result] = await tx.insert(operationalCosts).values({ ...data, tenantId }).returning({ id: operationalCosts.id });
        if (!result) throw new Error("Failed to create operational cost");
        return { id: result.id.toString() };
    }

    async update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<void> {
        await tx.update(operationalCosts)
            .set(data)
            .where(and(eq(operationalCosts.tenantId, tenantId), eq(operationalCosts.id, id)));
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(operationalCosts).where(and(eq(operationalCosts.tenantId, tenantId), eq(operationalCosts.id, id)));
    }
}
