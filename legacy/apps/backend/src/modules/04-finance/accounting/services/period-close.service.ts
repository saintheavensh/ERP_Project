import { periodLocks, sales, purchases, services, operationalCosts } from "../../../../shared/infrastructure/database/schema";
import { TransactionContext } from "../../../../shared/types/db-context";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { AuditService } from "./audit.service";

export class PeriodCloseService {
    /**
     * Check if a period is closed
     */
    static async isPeriodClosed(tenantId: string, period: string, tx: TransactionContext): Promise<boolean> {
        const [lock] = await tx
            .select()
            .from(periodLocks)
            .where(and(eq(periodLocks.tenantId, tenantId), eq(periodLocks.period, period)));

        return lock?.status === "closed";
    }

    /**
     * Validate that a date is not in a closed period
     */
    static async validateNotClosed(tenantId: string, date: Date, tx: TransactionContext): Promise<void> {
        const period = date.toISOString().slice(0, 7); // "2026-01"
        const isClosed = await this.isPeriodClosed(tenantId, period, tx);

        if (isClosed) {
            throw new Error(`Period ${period} is closed. Cannot modify transactions in a closed period.`);
        }
    }

    /**
     * Get all periods with their status
     */
    static async getAllPeriods(tenantId: string, tx: TransactionContext) {
        return tx
            .select()
            .from(periodLocks)
            .where(eq(periodLocks.tenantId, tenantId))
            .orderBy(periodLocks.period);
    }

    /**
     * Close a period
     */
    static async closePeriod(tenantId: string, period: string, userId: string, tx: TransactionContext): Promise<void> {
        // Check if already closed
        const existing = await tx
            .select()
            .from(periodLocks)
            .where(and(eq(periodLocks.tenantId, tenantId), eq(periodLocks.period, period)));

        if (existing.length > 0 && existing[0]?.status === "closed") {
            throw new Error(`Period ${period} is already closed`);
        }

        // Calculate period totals
        const startDate = new Date(`${period}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Sales total
        const salesResult = await tx
            .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
            .from(sales)
            .where(and(
                eq(sales.tenantId, tenantId),
                gte(sales.createdAt, startDate),
                lte(sales.createdAt, endDate),
                eq(sales.paymentStatus, "paid")
            ));

        // Purchases total
        const purchasesResult = await tx
            .select({ total: sql<number>`COALESCE(SUM(${purchases.totalAmount}), 0)` })
            .from(purchases)
            .where(and(
                eq(purchases.tenantId, tenantId),
                gte(purchases.date, startDate),
                lte(purchases.date, endDate)
            ));

        // Services total
        const servicesResult = await tx
            .select({ total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                gte(services.dateOut, startDate),
                lte(services.dateOut, endDate),
                eq(services.status, "diambil")
            ));

        // Expenses total
        const expensesResult = await tx
            .select({ total: sql<number>`COALESCE(SUM(${operationalCosts.amount}), 0)` })
            .from(operationalCosts)
            .where(and(
                eq(operationalCosts.tenantId, tenantId),
                gte(operationalCosts.date, startDate),
                lte(operationalCosts.date, endDate)
            ));

        const totals = {
            salesTotal: salesResult[0]?.total || 0,
            purchasesTotal: purchasesResult[0]?.total || 0,
            servicesTotal: servicesResult[0]?.total || 0,
            expensesTotal: expensesResult[0]?.total || 0,
        };

        if (existing.length > 0) {
            await tx
                .update(periodLocks)
                .set({
                    status: "closed",
                    closedBy: userId,
                    closedAt: new Date(),
                    ...totals,
                })
                .where(and(eq(periodLocks.tenantId, tenantId), eq(periodLocks.period, period)));
        } else {
            await tx.insert(periodLocks).values({
                period,
                status: "closed",
                closedBy: userId,
                closedAt: new Date(),
                tenantId,
                ...totals,
            });
        }

        await AuditService.log(tenantId, {
            userId,
            action: "CLOSE",
            entityType: "period",
            entityId: period,
            tableName: "period_locks",
            newValues: { status: "closed", ...totals },
        }, tx);
    }

    /**
     * Reopen a period (admin only)
     */
    static async reopenPeriod(tenantId: string, period: string, reason: string, userId: string, tx: TransactionContext): Promise<void> {
        const [existing] = await tx
            .select()
            .from(periodLocks)
            .where(and(eq(periodLocks.tenantId, tenantId), eq(periodLocks.period, period)));

        if (!existing || existing.status !== "closed") {
            throw new Error(`Period ${period} is not closed`);
        }

        await tx
            .update(periodLocks)
            .set({
                status: "open",
            })
            .where(and(eq(periodLocks.tenantId, tenantId), eq(periodLocks.period, period)));

        await AuditService.log(tenantId, {
            userId,
            action: "UPDATE",
            entityType: "period",
            entityId: period,
            tableName: "period_locks",
            oldValues: { status: "closed" },
            newValues: { status: "open" },
            reason,
        }, tx);
    }

    /**
     * Get period summary
     */
    static async getPeriodSummary(tenantId: string, period: string, tx: TransactionContext) {
        const [lock] = await tx
            .select()
            .from(periodLocks)
            .where(and(eq(periodLocks.tenantId, tenantId), eq(periodLocks.period, period)));

        if (!lock) {
            return { period, status: "open", hasData: false };
        }

        const netIncome =
            (lock.salesTotal || 0) +
            (lock.servicesTotal || 0) -
            (lock.purchasesTotal || 0) -
            (lock.expensesTotal || 0);

        return {
            period,
            status: lock.status,
            closedAt: lock.closedAt,
            closedBy: lock.closedBy,
            salesTotal: lock.salesTotal,
            servicesTotal: lock.servicesTotal,
            purchasesTotal: lock.purchasesTotal,
            expensesTotal: lock.expensesTotal,
            netIncome,
            hasData: true,
        };
    }
}
