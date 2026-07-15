import { api } from "$lib/shared/lib/api-client";

export type CashRegisterStatus = {
    isOpen: boolean;
    registerId?: string;
    openingBalance?: number;
    expectedClosing?: number;
    totalSales?: number;
    totalServices?: number;
    totalExpenses?: number;
    transactionCount?: number;
    dailyBreakeven?: number;
    recentTransactions?: {
        id: string;
        transactionType: string;
        amount: number;
        description?: string;
        createdAt: string;
        paymentMethod: string;
    }[];
};

export type RegisterHistoryItem = {
    id: string;
    date: string;
    openedBy: string;
    closedBy?: string;
    openingBalance: number;
    expectedClosing: number;
    actualClosing?: number;
    difference?: number;
    status: "open" | "closed";
    notes?: string;
};

export class CashRegisterService {
    static async getStatus(): Promise<CashRegisterStatus> {
        const res = await api.get("/accounting/register/status");
        return res.data.data;
    }

    static async open(openingBalance: number) {
        const res = await api.post("/accounting/register/open", { openingBalance });
        return res.data.data;
    }

    static async close(data: {
        actualClosing: number;
        notes?: string;
        reserveAmount?: number;
        targetAccountId?: string;
    }) {
        const res = await api.post("/accounting/register/close", data);
        return res.data.data;
    }

    static async recordExpense(data: {
        amount: number;
        category: string;
        description: string;
    }) {
        const res = await api.post("/accounting/register/expense", data);
        return res.data.data;
    }

    static async getHistory(params?: { startDate?: string; endDate?: string; limit?: number }) {
        const res = await api.get("/accounting/register/history", { params });
        return res.data.data;
    }
}
