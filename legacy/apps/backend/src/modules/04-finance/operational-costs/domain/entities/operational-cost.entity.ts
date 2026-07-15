export type OperationalCostStatus = "paid" | "pending" | "cancelled";

export interface OperationalCost {
    id: string;
    category: string;
    amount: number;
    date: Date;
    description?: string | null | undefined;
    status: OperationalCostStatus;
    dueDate?: Date | null | undefined;
    paidAt?: Date | null | undefined;
    userId?: string | null | undefined;
    createdAt?: Date | null | undefined;
    updatedAt?: Date | null | undefined;
}

export interface CreateOperationalCostInput {
    category: string;
    amount: number;
    date?: string | Date;
    description?: string;
    status?: OperationalCostStatus;
    dueDate?: string | Date;
    sourceAccountId?: string;
    expenseAccountId?: string;
}
