import { accountingService } from "../accounting-container";
import { TransactionContext } from "../../../../shared/types/db-context";

export type TransactionType = "sale" | "service" | "expense" | "refund" | "adjustment";

export interface RecordTransactionInput {
    transactionType: TransactionType;
    transactionId?: string;
    paymentMethod: string;
    amount: number;
    description?: string;
}

export class CashRegisterService {
    /**
     * Check if register is open
     */
    static async isRegisterOpen(tx: TransactionContext, tenantId: string): Promise<boolean> {
        return await accountingService.isRegisterOpen(tenantId, tx);
    }

    static async open(openingBalance: number, userId: string, tx: TransactionContext, tenantId: string): Promise<string> {
        return await accountingService.openRegister(tenantId, openingBalance, userId, tx);
    }

    static async recordTransaction(input: RecordTransactionInput, tx: TransactionContext, tenantId: string): Promise<void> {
        await accountingService.recordCashTransaction(tenantId, input, tx);
    }

    static async recordExpense(
        amount: number,
        category: string,
        description: string,
        userId: string,
        userRoles: string[],
        tx: TransactionContext,
        tenantId: string
    ) {
        await accountingService.recordCashExpense(tenantId, amount, category, description, userId, userRoles, tx);
    }

    static async getActiveSession(tx: TransactionContext, tenantId: string) {
        return await accountingService.getCurrentRegister(tenantId, tx);
    }

    static async close(actualClosing: number, notes: string, userId: string, reservation: { amount: number, targetAccountId: string, sourceAccountId?: string } | undefined, tx: TransactionContext, tenantId: string): Promise<{ difference: number }> {
        return await accountingService.closeRegister(tenantId, actualClosing, notes, userId, tx, reservation);
    }

    static async getHistory(startDate: string | undefined, endDate: string | undefined, limit: number, tx: TransactionContext, tenantId: string) {
        return await accountingService.getRegisterHistory(tenantId, { startDate, endDate, limit }, tx);
    }

    static async getSummary(registerId: string, tx: TransactionContext, tenantId: string) {
        return await accountingService.getRegisterSummary(tenantId, registerId, tx);
    }

    static async getTodayProgress(tx: TransactionContext, tenantId: string) {
        return await accountingService.getTodayRegisterProgress(tenantId, tx);
    }
}
