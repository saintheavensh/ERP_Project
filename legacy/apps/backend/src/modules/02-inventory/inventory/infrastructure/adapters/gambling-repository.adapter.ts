import { eq, desc } from "drizzle-orm";
import { TransactionContext } from "@shared/types/db-context";
import { deadPhonePurchases, gamblingTestLogs } from "../schema/GamblingSchema";
import { IGamblingRepository, DeadPhonePurchase, DeadPhoneStatus, TestLog, GamblingFilters } from "@domain/repositories/gambling-repository.port";

export class GamblingRepositoryAdapter implements IGamblingRepository {
    async savePurchase(purchase: Partial<DeadPhonePurchase>, tx: TransactionContext): Promise<DeadPhonePurchase> {
        // Drizzle schema .values() expects exact column types; domain Partial differs
        const [result] = await tx.insert(deadPhonePurchases).values(purchase as unknown as typeof deadPhonePurchases.$inferInsert).returning();
        return result as unknown as DeadPhonePurchase;
    }

    async saveTestLog(log: Partial<TestLog>, tx: TransactionContext): Promise<TestLog> {
        const [result] = await tx.insert(gamblingTestLogs).values(log as typeof gamblingTestLogs.$inferInsert).returning();
        return result as unknown as TestLog;
    }

    async findById(id: string, tx: TransactionContext): Promise<DeadPhonePurchase | null> {
        const result = await tx.query.deadPhonePurchases.findFirst({
            where: eq(deadPhonePurchases.id, id)
        });
        return (result as unknown as DeadPhonePurchase) ?? null;
    }

    async findAll(tx: TransactionContext, _filters?: GamblingFilters): Promise<DeadPhonePurchase[]> {
        const rows = await tx.query.deadPhonePurchases.findMany({
            orderBy: [desc(deadPhonePurchases.createdAt)]
        });
        return rows as unknown as DeadPhonePurchase[];
    }

    async updateStatus(id: string, status: DeadPhoneStatus, tx: TransactionContext): Promise<void> {
        await tx.update(deadPhonePurchases)
            .set({ status })
            .where(eq(deadPhonePurchases.id, id));
    }
}
