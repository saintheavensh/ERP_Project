import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IAccountingGateway {
    isRegisterOpen(tenantId: string, tx: TransactionContext): Promise<boolean>;
    recordCashTransaction(tenantId: string, params: {
        transactionType: string;
        transactionId: string;
        amount: number;
        description?: string | null | undefined;
    }, tx: TransactionContext): Promise<void>;
    createJournal(tenantId: string, params: {
        description: string;
        referenceType: string;
        referenceId: string;
        date?: Date | null | undefined;
        lines: Array<{ accountId: string; debit: number; credit: number; description?: string | null | undefined }>;
    }, userId: string, tx: TransactionContext): Promise<void>;
}

export interface IInventoryGateway {
    updateStock(tenantId: string, batchId: string, delta: number, tx: TransactionContext): Promise<void>;
    getBatch(tenantId: string, batchId: string, tx: TransactionContext): Promise<any>;
}

export interface INotificationGateway {
    technicianAssigned(tenantId: string, technicianId: string, serviceNo: string, serviceId: string): Promise<void>;
    serviceStatusChanged(tenantId: string, userId: string, serviceNo: string, status: string, serviceId: string): Promise<void>;
    sendWhatsApp(tenantId: string, type: "new" | "status" | "complete", serviceData: any, extra: any): Promise<void>;
}

export interface ISettingsGateway {
    getWarrantyDays(tenantId: string, label: string, tx: TransactionContext): Promise<number>;
    getServiceSettings(tenantId: string, tx: TransactionContext): Promise<any>;
}

export interface IUserGateway {
    getTechnician(tenantId: string, id: string, tx: TransactionContext): Promise<any>;
}
