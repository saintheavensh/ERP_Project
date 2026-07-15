import { TransactionContext } from "../../../../shared/types/db-context";

export type ApprovalType = 'DISCOUNT' | 'REFUND' | 'PURCHASE' | 'VOID' | 'SERVICE_DISCOUNT';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Approval {
    id: string;
    type: ApprovalType;
    entityType: string;
    entityId: string;
    requestedById: string;
    requestedAt: Date;
    status: ApprovalStatus;
    approvedById?: string | undefined;
    approvedAt?: Date | undefined;
    reason?: string | undefined;
    data?: any;
}

export interface IApprovalRepository {
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<Approval | null>;
    findByEntity(tenantId: string, entityType: string, entityId: string, tx: TransactionContext): Promise<Approval[]>;
    save(tenantId: string, approval: Partial<Approval>, tx: TransactionContext): Promise<Approval>;
    update(tenantId: string, id: string, approval: Partial<Approval>, tx: TransactionContext): Promise<Approval>;
    findPending(tenantId: string, tx: TransactionContext): Promise<Approval[]>;
    findHistory(tenantId: string, tx: TransactionContext, filters?: { type?: string | undefined; status?: string | undefined }): Promise<Approval[]>;
    getStats(tenantId: string, tx: TransactionContext): Promise<{ pending: number; approved: number; rejected: number; totalAmount: number }>;
}

