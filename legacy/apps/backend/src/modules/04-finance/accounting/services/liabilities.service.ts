import { TransactionContext } from "../../../../shared/types/db-context";
import { purchases, purchasePayments, operationalCosts, suppliers } from "../../../../shared/infrastructure/database/schema";
import { eq, and, sql, not } from "drizzle-orm";
import { CommissionPaymentService } from "./commission-payment.service";
import { accountingService } from "../accounting-container";

export class LiabilitiesService {
    /**
     * Get overall summary of all liabilities
     */
    static async getSummary(tenantId: string, tx: TransactionContext) {
        const supplierSummary = await this.getSupplierSummary(tenantId, tx);
        const expenseSummary = await this.getExpenseSummary(tenantId, tx);
        const commissionSummary = await this.getCommissionSummary(tenantId, tx);

        return {
            totalLiabilities: supplierSummary.total + expenseSummary.total + commissionSummary.total,
            breakdown: {
                suppliers: supplierSummary,
                expenses: expenseSummary,
                commissions: commissionSummary
            }
        };
    }

    /**
     * Get outstanding debts to suppliers (Accounts Payable)
     */
    static async getSupplierDebts(tenantId: string, tx: TransactionContext) {
        // Find purchases that are NOT fully paid
        // Total Amount vs Sum of Payments

        const results = await tx
            .select({
                purchaseId: purchases.id,
                supplierId: purchases.supplierId,
                supplierName: suppliers.name,
                totalAmount: purchases.totalAmount,
                date: purchases.date,
                dueDate: purchases.paymentDueDate,
                paidAmount: sql<number>`COALESCE((SELECT SUM(amount) FROM ${purchasePayments} WHERE ${purchasePayments.purchaseId} = ${purchases.id} AND ${purchasePayments.tenantId} = ${tenantId}), 0)`
            })
            .from(purchases)
            .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
            .where(and(
                eq(purchases.tenantId, tenantId),
                not(eq(purchases.status, "CANCELLED")),
                sql`purchases.total_amount > (SELECT COALESCE(SUM(amount), 0) FROM ${purchasePayments} WHERE ${purchasePayments.purchaseId} = ${purchases.id} AND ${purchasePayments.tenantId} = ${tenantId})`
            ))
            .orderBy(purchases.date);

        return results.map((r: any) => ({
            ...r,
            outstanding: r.totalAmount - r.paidAmount
        }));
    }

    private static async getSupplierSummary(tenantId: string, tx: TransactionContext) {
        const debts = await this.getSupplierDebts(tenantId, tx);
        return {
            total: debts.reduce((s: number, d: any) => s + d.outstanding, 0),
            count: debts.length
        };
    }

    /**
     * Get pending operational expenses
     */
    static async getExpenseDebts(tenantId: string, tx: TransactionContext) {
        return await tx
            .select()
            .from(operationalCosts)
            .where(and(eq(operationalCosts.tenantId, tenantId), eq(operationalCosts.status, "pending")))
            .orderBy(operationalCosts.dueDate);
    }

    private static async getExpenseSummary(tenantId: string, tx: TransactionContext) {
        const expenses = await this.getExpenseDebts(tenantId, tx);
        return {
            total: expenses.reduce((s: number, e: any) => s + e.amount, 0),
            count: expenses.length
        };
    }

    /**
     * Get pending technician commissions
     */
    static async getCommissionDebts(tenantId: string, tx: TransactionContext, period?: string) {
        const currentPeriod = period || new Date().toISOString().substring(0, 7);
        const pending = await CommissionPaymentService.getPendingCommissions(tenantId, tx, currentPeriod);

        return pending.map(p => ({
            technicianId: p.technicianId,
            technicianName: p.technicianName,
            amount: p.totalAmount,
            period: currentPeriod,
            serviceCount: p.services.length
        }));
    }

    private static async getCommissionSummary(tenantId: string, tx: TransactionContext) {
        const currentPeriod = new Date().toISOString().substring(0, 7);
        const pending = await this.getCommissionDebts(tenantId, tx, currentPeriod);
        return {
            total: pending.reduce((s, c) => s + c.amount, 0),
            count: pending.length
        };
    }

    /**
     * Pay an operational expense
     */
    static async payExpense(tenantId: string, tx: TransactionContext, id: string, payload: { sourceAccountId: string; expenseAccountId: string; date?: Date; notes?: string }, userId?: string) {
        const [expense] = await tx
            .select()
            .from(operationalCosts)
            .where(and(eq(operationalCosts.tenantId, tenantId), eq(operationalCosts.id, id)))
            .limit(1);

        if (!expense) throw new Error("Expense not found");
        if (expense.status === "paid") throw new Error("Expense already paid");

        // 1. Create Journal Entry
        await accountingService.createJournal(tenantId, {
            description: `Pembayaran biaya: ${expense.category} - ${expense.description || ""}`,
            referenceType: "operational_expense",
            referenceId: expense.id,
            lines: [
                { accountId: payload.expenseAccountId, debit: expense.amount, credit: 0, description: expense.description },
                { accountId: payload.sourceAccountId, debit: 0, credit: expense.amount, description: "Pembayaran" },
            ],
            isAutoGenerated: true
        }, userId, tx);

        // 2. Update status
        await tx
            .update(operationalCosts)
            .set({
                status: "paid",
                paidAt: payload.date || new Date(),
                // Add notes if table supports it, otherwise skip
            })
            .where(and(eq(operationalCosts.tenantId, tenantId), eq(operationalCosts.id, id)));

        return { success: true };
    }
}
