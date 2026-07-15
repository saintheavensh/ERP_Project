import { TransactionContext } from "../../../../../shared/types/db-context";
import { Account, JournalEntry, JournalLine } from "../entities/ledger.entity";

export interface IAccountRepository {
    findAll(tenantId: string, filters: { typeId?: string | undefined }, tx: TransactionContext): Promise<Account[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<Account | null>;
    findByCode(tenantId: string, code: string, tx: TransactionContext): Promise<Account | null>;
    findTypes(tenantId: string, tx: TransactionContext): Promise<any[]>;
    findTypeById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null>;
    create(tenantId: string, data: Partial<Account>, tx: TransactionContext): Promise<{ id: string }>;
    update(tenantId: string, id: string, data: Partial<Account>, tx: TransactionContext): Promise<void>;
    incrementBalance(tenantId: string, id: string, amount: number, tx: TransactionContext): Promise<void>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
}

export interface IJournalRepository {
    findAll(tenantId: string, filters: any, tx: TransactionContext): Promise<JournalEntry[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<JournalEntry | null>;
    countToday(tenantId: string, prefix: string, tx: TransactionContext): Promise<number>;
    create(tenantId: string, data: Partial<JournalEntry>, tx: TransactionContext): Promise<void>;
    createLine(tenantId: string, data: Partial<JournalLine>, tx: TransactionContext): Promise<void>;
    update(tenantId: string, id: string, data: Partial<JournalEntry>, tx: TransactionContext): Promise<void>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
    deleteByReference(tenantId: string, type: string, id: string, tx: TransactionContext): Promise<void>;
}
