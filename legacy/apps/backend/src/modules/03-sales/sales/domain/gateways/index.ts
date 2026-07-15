import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IInventoryGateway {
    deductStockFIFO(tenantId: string, params: {
        saleId: string;
        items: {
            productId: string;
            variant: string;
            quantity: number;
            unitPrice: number;
        }[];
    }, tx: TransactionContext): Promise<{ allocations: any[]; cogsAmount: number }>;
}

export interface IAccountingGateway {
    isRegisterOpen(tenantId: string, tx: TransactionContext): Promise<boolean>;
    recordCashTransaction(tenantId: string, params: {
        transactionType: string;
        transactionId: string;
        amount: number;
        description: string;
    }, tx: TransactionContext): Promise<void>;
    createJournal(tenantId: string, params: {
        description: string;
        referenceType: string;
        referenceId: string;
        lines: Array<{ accountId: string; debit: number; credit: number; description: string }>;
    }, userId: string, tx: TransactionContext): Promise<void>;
}

export interface IMemberGateway {
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<any>;
    updateDebt(tenantId: string, id: string, delta: number, tx: TransactionContext): Promise<void>;
}

export interface ISettingsGateway {
    getPaymentMethods(tenantId: string, tx: TransactionContext): Promise<any>;
}

export interface IApprovalGateway {
    needsApproval(type: 'DISCOUNT' | 'VOID' | 'REFUND', amount: number, data?: any): Promise<boolean>;
    isApproved(tenantId: string, approvalId: string, entityType: string, tx: TransactionContext, entityId?: string | undefined): Promise<boolean>;
}
