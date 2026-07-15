import { TransactionContext } from "../../../shared/types/db-context";
import {
    AccountRepositoryAdapter,
    JournalRepositoryAdapter,
    CashRegisterRepositoryAdapter,
    AssetRepositoryAdapter,
    RevenueTargetRepositoryAdapter,
    PurchasePaymentRepositoryAdapter,
    CommissionPaymentRepositoryAdapter
} from "./infrastructure";
import {
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    GetAccountTreeUseCase,
    CreateJournalUseCase,
    OpenRegisterUseCase,
    CloseRegisterUseCase,
    RecordCashExpenseUseCase,
    RecordCashTransactionUseCase,
    CreateAssetUseCase
} from "./application";

// Adapters
const accountRepository = new AccountRepositoryAdapter();
const journalRepository = new JournalRepositoryAdapter();
const registerRepository = new CashRegisterRepositoryAdapter();
const assetRepository = new AssetRepositoryAdapter();
const targetRepository = new RevenueTargetRepositoryAdapter();
const paymentRepository = new PurchasePaymentRepositoryAdapter();
const commissionRepository = new CommissionPaymentRepositoryAdapter();

// Use Cases
const createAccountUC = new CreateAccountUseCase(accountRepository);
const updateAccountUC = new UpdateAccountUseCase(accountRepository);
const deleteAccountUC = new DeleteAccountUseCase(accountRepository);
const getAccountTreeUC = new GetAccountTreeUseCase(accountRepository);
const createJournalUC = new CreateJournalUseCase(journalRepository, accountRepository);

const openRegisterUC = new OpenRegisterUseCase(registerRepository);
const closeRegisterUC = new CloseRegisterUseCase(registerRepository);
const recordExpenseUC = new RecordCashExpenseUseCase(registerRepository, createJournalUC);
const recordTransactionUC = new RecordCashTransactionUseCase(registerRepository);
const createAssetUC = new CreateAssetUseCase(assetRepository, createJournalUC);

/**
 * AccountingService — Facade for external and presentation layers.
 */
export class AccountingService {
    // Accounts
    async getAccountTypes(tenantId: string, tx: TransactionContext) { return await accountRepository.findTypes(tenantId, tx); }
    async getAllAccounts(tenantId: string, filters: any, tx: TransactionContext) { return await accountRepository.findAll(tenantId, filters, tx); }
    async getAccountTree(tenantId: string, filters: { typeId?: string }, tx: TransactionContext) { return await getAccountTreeUC.execute(tenantId, tx, filters); }
    async getAccountById(tenantId: string, id: string, tx: TransactionContext) { return await accountRepository.findById(tenantId, id, tx); }
    async createAccount(tenantId: string, input: any, tx: TransactionContext, userId?: string) { return await createAccountUC.execute(tenantId, input, tx, userId); }
    async updateAccount(tenantId: string, id: string, input: any, tx: TransactionContext, userId?: string) { return await updateAccountUC.execute(tenantId, id, input, tx, userId); }
    async deleteAccount(tenantId: string, id: string, tx: TransactionContext, userId?: string) { return await deleteAccountUC.execute(tenantId, id, tx, userId); }

    // Journals
    async createJournal(tenantId: string, input: any, userId?: string, tx?: TransactionContext): Promise<string> { return await createJournalUC.execute(tenantId, input, tx!, userId); }
    async getAllJournals(tenantId: string, filters: any, tx?: TransactionContext) { return await journalRepository.findAll(tenantId, filters, tx!); }
    async getJournalById(tenantId: string, id: string, tx?: TransactionContext) { return await journalRepository.findById(tenantId, id, tx!); }

    // Cash Register
    async getCurrentRegister(tenantId: string, tx: TransactionContext) { return await registerRepository.getCurrent(tenantId, tx); }
    async isRegisterOpen(tenantId: string, tx: TransactionContext) { return (await registerRepository.getCurrent(tenantId, tx)) !== null; }
    async openRegister(tenantId: string, openingBalance: number, userId: string, tx: TransactionContext) { return await openRegisterUC.execute(tenantId, openingBalance, userId, tx); }
    async closeRegister(tenantId: string, actualClosing: number, notes: string | undefined, userId: string, tx: TransactionContext, reservation?: any) {
        return await closeRegisterUC.execute(tenantId, { actualClosing, notes, reservation }, userId, tx);
    }
    async recordCashExpense(tenantId: string, amount: number, category: string, description: string, userId: string, userRoles: string[], tx: TransactionContext) {
        return await recordExpenseUC.execute(tenantId, { amount, category, description, userRoles }, userId, tx);
    }
    async recordCashTransaction(tenantId: string, input: any, tx: TransactionContext) { return await recordTransactionUC.execute(tenantId, input, tx); }
    async getRegisterHistory(tenantId: string, filters: any, tx: TransactionContext) {
        const { limit = 50, offset = 0 } = filters;
        return await registerRepository.listHistory(tenantId, limit, offset, tx);
    }
    async getRegisterSummary(tenantId: string, registerId: string, tx: TransactionContext) { return await registerRepository.getSummary(tenantId, registerId, tx); }
    async getTodayRegisterProgress(tenantId: string, tx: TransactionContext) { return await registerRepository.getTodayProgress(tenantId, tx); }

    // Assets
    async createAsset(tenantId: string, input: any, tx: TransactionContext, userId?: string) { return await createAssetUC.execute(tenantId, input, userId || "", tx); }
    async getAllAssets(tenantId: string, tx: TransactionContext) { return await assetRepository.findAll(tenantId, tx); }
    async getAssetById(tenantId: string, id: string, tx: TransactionContext) { return await assetRepository.findById(tenantId, id, tx); }

    // Revenue Targets
    async getRevenueTarget(tenantId: string, month: string, tx: TransactionContext) { return await targetRepository.findByMonth(tenantId, month, tx); }
    async upsertRevenueTarget(tenantId: string, month: string, data: any, tx: TransactionContext) { return await targetRepository.upsert(tenantId, month, data, tx); }

    // Payments (Internal access for legacy services)
    get paymentRepository() { return paymentRepository; }
    get commissionRepository() { return commissionRepository; }
}

/** Singleton instance */
export const accountingService = new AccountingService();
export {
    createAccountUC,
    updateAccountUC,
    deleteAccountUC,
    getAccountTreeUC,
    createJournalUC,
    openRegisterUC,
    closeRegisterUC,
    recordExpenseUC,
    recordTransactionUC,
    createAssetUC
};
