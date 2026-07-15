import { TransactionContext } from "../../../../../shared/types/db-context";

export type DeadPhoneStatus = 'STORED' | 'TESTED' | 'HARVESTED';

export interface DeadPhonePurchase {
    id: string;
    deviceName: string;
    imei?: string;
    purchasePrice: number;
    purchaseDate: Date;
    supplierId?: string;
    suspectedIssue?: string;
    visualCondition?: string;
    status: DeadPhoneStatus;
    storageLocation?: string;
    createdAt?: Date;
}

export interface TestLog {
    id: string;
    deadPhoneId: string;
    testType: string;
    result: string;
    notes?: string;
    testedAt?: Date;
}

export interface GamblingFilters {
    status?: DeadPhoneStatus;
    search?: string;
}

export interface IGamblingRepository {
    savePurchase(purchase: Partial<DeadPhonePurchase>, tx: TransactionContext): Promise<DeadPhonePurchase>;
    saveTestLog(log: Partial<TestLog>, tx: TransactionContext): Promise<TestLog>;
    findById(id: string, tx: TransactionContext): Promise<DeadPhonePurchase | null>;
    findAll(tx: TransactionContext, filters?: GamblingFilters): Promise<DeadPhonePurchase[]>;
    updateStatus(id: string, status: DeadPhoneStatus, tx: TransactionContext): Promise<void>;
}
