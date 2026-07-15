import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { accounts, journals, journalLines, accountTypes } from "../../../../../shared/infrastructure/database/schema";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { IAccountRepository, IJournalRepository, Account, JournalEntry, JournalLine } from "../../domain";

export class AccountRepositoryAdapter implements IAccountRepository {
    async findAll(tenantId: string, filters: { typeId?: string | undefined }, tx: TransactionContext): Promise<Account[]> {
        const conditions: any[] = [eq(accounts.tenantId, tenantId)];
        if (filters.typeId) conditions.push(eq(accounts.typeId, filters.typeId));

        const results = await tx
            .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                typeId: accounts.typeId,
                parentId: accounts.parentId,
                description: accounts.description,
                isActive: accounts.isActive,
                isSystem: accounts.isSystem,
                balance: accounts.balance,
                createdAt: accounts.createdAt,
                updatedAt: accounts.updatedAt,
            })
            .from(accounts)
            .where(and(...conditions))
            .orderBy(accounts.code);

        return results as Account[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<Account | null> {
        const [result] = await tx.select().from(accounts).where(and(eq(accounts.tenantId, tenantId), eq(accounts.id, id)));
        return (result as Account) || null;
    }

    async findByCode(tenantId: string, code: string, tx: TransactionContext): Promise<Account | null> {
        const [result] = await tx.select().from(accounts).where(and(eq(accounts.tenantId, tenantId), eq(accounts.code, code)));
        return (result as Account) || null;
    }

    async findTypes(tenantId: string, tx: TransactionContext): Promise<any[]> {
        return await tx.select().from(accountTypes).where(eq(accountTypes.tenantId, tenantId)).orderBy(accountTypes.id);
    }

    async findTypeById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null> {
        const [result] = await tx.select().from(accountTypes).where(and(eq(accountTypes.tenantId, tenantId), eq(accountTypes.id, id)));
        return result || null;
    }

    async create(tenantId: string, data: Partial<Account>, tx: TransactionContext): Promise<{ id: string }> {
        const [result] = await tx.insert(accounts).values({ ...data, tenantId } as any).returning({ id: accounts.id });
        if (!result) throw new Error("Failed to create account");
        return result;
    }

    async update(tenantId: string, id: string, data: Partial<Account>, tx: TransactionContext): Promise<void> {
        await tx.update(accounts).set(data as any).where(and(eq(accounts.tenantId, tenantId), eq(accounts.id, id)));
    }

    async incrementBalance(tenantId: string, id: string, amount: number, tx: TransactionContext): Promise<void> {
        await tx.update(accounts)
            .set({
                balance: sql`${accounts.balance} + ${amount}`,
                updatedAt: new Date()
            })
            .where(and(eq(accounts.tenantId, tenantId), eq(accounts.id, id)));
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(accounts).where(and(eq(accounts.tenantId, tenantId), eq(accounts.id, id)));
    }
}

export class JournalRepositoryAdapter implements IJournalRepository {
    async findAll(tenantId: string, filters: any, tx: TransactionContext): Promise<JournalEntry[]> {
        let where = and(eq(journals.tenantId, tenantId));
        if (filters.startDate) where = and(where, gte(journals.date, new Date(filters.startDate)));
        if (filters.endDate) where = and(where, lte(journals.date, new Date(filters.endDate)));
        if (filters.status) where = and(where, eq(journals.status, filters.status));

        const results = await tx
            .select()
            .from(journals)
            .where(where)
            .orderBy(desc(journals.date))
            .limit(filters.limit || 50)
            .offset(filters.offset || 0);

        return results as JournalEntry[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<JournalEntry | null> {
        const [journal] = await tx.select().from(journals).where(and(eq(journals.tenantId, tenantId), eq(journals.id, id)));
        if (!journal) return null;

        const lines = await tx
            .select({
                id: journalLines.id,
                journalId: journalLines.journalId,
                accountId: journalLines.accountId,
                debit: journalLines.debit,
                credit: journalLines.credit,
                description: journalLines.description,
            })
            .from(journalLines)
            .where(eq(journalLines.journalId, id));

        return { ...journal, lines } as JournalEntry;
    }

    async countToday(tenantId: string, prefix: string, tx: TransactionContext): Promise<number> {
        const result = await tx
            .select({ count: sql<number>`count(*)` })
            .from(journals)
            .where(and(eq(journals.tenantId, tenantId), sql`${journals.id} LIKE ${prefix + '%'}`));
        return Number(result[0]?.count || 0);
    }

    async create(tenantId: string, data: Partial<JournalEntry>, tx: TransactionContext): Promise<void> {
        await tx.insert(journals).values({ ...data, tenantId } as any);
    }

    async createLine(tenantId: string, data: Partial<JournalLine>, tx: TransactionContext): Promise<void> {
        await tx.insert(journalLines).values({ ...data, tenantId } as any);
    }

    async update(tenantId: string, id: string, data: Partial<JournalEntry>, tx: TransactionContext): Promise<void> {
        await tx.update(journals).set(data as any).where(and(eq(journals.tenantId, tenantId), eq(journals.id, id)));
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(journals).where(and(eq(journals.tenantId, tenantId), eq(journals.id, id)));
    }

    async deleteByReference(tenantId: string, type: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(journals).where(and(eq(journals.tenantId, tenantId), eq(journals.referenceType, type as any), eq(journals.referenceId, id)));
    }
}
