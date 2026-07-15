export type CashRegisterStatus = "open" | "closed";

export interface CashRegister {
    id: string; // Changed from number to string (UUID in schema)
    openedAt: Date;
    openedBy: string;
    openingBalance: number;
    closedAt?: Date | null | undefined;
    closedBy?: string | null | undefined;
    expectedClosing?: number | null | undefined;
    actualClosing?: number | null | undefined;
    difference?: number | null | undefined;
    status: CashRegisterStatus;
    notes?: string | null | undefined;
}

export type TransactionType = "sale" | "expense" | "deposit" | "withdrawal" | "service" | "refund" | "adjustment";

export interface CashTransaction {
    id: string; // Changed from number to string (UUID in schema)
    registerId: string;
    type: TransactionType;
    amount: number;
    description: string;
    referenceType?: string | null | undefined;
    referenceId?: string | null | undefined;
    createdAt: Date;
}
