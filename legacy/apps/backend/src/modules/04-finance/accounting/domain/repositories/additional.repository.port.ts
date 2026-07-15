import { TransactionContext } from "../../../../../shared/types/db-context";
import { CashRegister, CashTransaction } from "../entities/cash-register.entity";
import { FixedAsset, DepreciationEntry } from "../entities/asset.entity";

export interface ICashRegisterRepository {
    getCurrent(tenantId: string, tx: TransactionContext): Promise<CashRegister | null>;
    getById(tenantId: string, id: string, tx: TransactionContext): Promise<CashRegister | null>;
    create(tenantId: string, data: Partial<CashRegister>, tx: TransactionContext): Promise<{ id: string }>;
    update(tenantId: string, id: string, data: Partial<CashRegister>, tx: TransactionContext): Promise<void>;
    listHistory(tenantId: string, limit: number, offset: number, tx: TransactionContext): Promise<CashRegister[]>;

    createTransaction(tenantId: string, data: Partial<CashTransaction>, tx: TransactionContext): Promise<void>;
    getTransactions(tenantId: string, registerId: string, tx: TransactionContext): Promise<CashTransaction[]>;
    getSummary(tenantId: string, registerId: string, tx: TransactionContext): Promise<any>;
    getTodayProgress(tenantId: string, tx: TransactionContext): Promise<any>;
}

export interface IAssetRepository {
    findAll(tenantId: string, tx: TransactionContext): Promise<FixedAsset[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<FixedAsset | null>;
    create(tenantId: string, data: Partial<FixedAsset>, tx: TransactionContext): Promise<{ id: string }>;
    update(tenantId: string, id: string, data: Partial<FixedAsset>, tx: TransactionContext): Promise<void>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;

    createDepreciation(tenantId: string, data: Partial<DepreciationEntry>, tx: TransactionContext): Promise<void>;
    getDepreciationHistory(tenantId: string, assetId: string, tx: TransactionContext): Promise<DepreciationEntry[]>;
}

export interface IRevenueTargetRepository {
    findByMonth(tenantId: string, month: string, tx: TransactionContext): Promise<any | null>;
    upsert(tenantId: string, month: string, data: any, tx: TransactionContext): Promise<void>;
}

export interface IPurchasePaymentRepository {
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null>;
    create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }>;
    getTotalPaid(tenantId: string, purchaseId: string, tx: TransactionContext): Promise<number>;
    findHistoryByPurchaseId(tenantId: string, purchaseId: string, tx: TransactionContext): Promise<any[]>;
    findPurchaseById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null>;
}

export interface ICommissionPaymentRepository {
    create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }>;
    findHistory(tenantId: string, tx: TransactionContext, technicianId?: string | undefined, period?: string | undefined): Promise<any[]>;
    getPaidServiceIds(tenantId: string, period: string, tx: TransactionContext): Promise<Set<string>>;
}
