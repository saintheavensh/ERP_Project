export type ApprovalType = 'DISCOUNT' | 'REFUND' | 'PURCHASE_ORDER' | 'VOID';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Approval {
    id: string;
    type: ApprovalType;
    referenceId: string; // ID of the transaction (sale_id, purchase_id, etc)
    referenceNumber: string; // Human readable (INV-2026-001, PO-001)
    amount: number;
    requestedBy: string;
    requestedByName: string;
    requestedAt: string;
    status: ApprovalStatus;
    reason: string; // Why approval needed (e.g., "Discount 25%")
    notes?: string;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: string;
    rejectedReason?: string;
}

export interface ApprovalStats {
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
}

export interface UpdateApprovalDTO {
    status: ApprovalStatus;
    notes?: string;
    rejectReason?: string;
}
