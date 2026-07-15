import { TransactionContext } from "../../../../shared/types/db-context";
import { operationalCosts, sales, services } from "../../../../shared/infrastructure/database/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { AssetsService } from "./assets.service";
import { accountingService } from "../accounting-container";

export interface SetTargetInput {
    month: string; // "2026-01"
    workingDays: number;
    profitMarginPercent?: number;
}

export class RevenueTargetService {
    /**
     * Get or create target for a month
     */
    static async getOrCreate(tenantId: string, tx: TransactionContext, month: string, userId?: string) {
        let target = await accountingService.getRevenueTarget(tenantId, month, tx);

        if (!target) {
            // Auto-create with default values
            await this.calculateAndSet(tenantId, tx, { month, workingDays: 26 }, userId);
            target = await accountingService.getRevenueTarget(tenantId, month, tx);
        }

        return target;
    }

    /**
     * Get revenue target for a specific month (YYYY-MM)
     */
    static async getByMonth(tenantId: string, month: string, tx: TransactionContext) {
        return await accountingService.getRevenueTarget(tenantId, month, tx);
    }

    /**
     * Create or update revenue target
     */
    static async upsert(tenantId: string, month: string, data: any, tx: TransactionContext, _userId?: string) {
        return await accountingService.upsertRevenueTarget(tenantId, month, data, tx);
    }

    /**
     * Calculate monthly costs and set target
     */
    static async calculateAndSet(tenantId: string, tx: TransactionContext, input: SetTargetInput, userId?: string): Promise<void> {
        const { month, workingDays, profitMarginPercent = 20 } = input;

        // Get operational costs for this month
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const opCosts = await tx
            .select({ total: sql<number>`COALESCE(SUM(${operationalCosts.amount}), 0)` })
            .from(operationalCosts)
            .where(and(
                eq(operationalCosts.tenantId, tenantId),
                gte(operationalCosts.date, startDate),
                lte(operationalCosts.date, endDate)
            ));

        const monthlyOperational = Number(opCosts[0]?.total) || 0;

        // Get total depreciation from active assets
        const monthlyDepreciation = await AssetsService.getTotalMonthlyDepreciation(tenantId, tx);

        // Calculate totals
        const monthlyTotal = monthlyOperational + monthlyDepreciation;
        const dailyBreakeven = Math.ceil(monthlyTotal / workingDays);
        const dailyTarget = Math.ceil(dailyBreakeven * (1 + profitMarginPercent / 100));

        // Upsert target
        await this.upsert(tenantId, month, {
            workingDays,
            monthlyOperational,
            monthlyDepreciation,
            monthlyTotal,
            dailyBreakeven,
            profitMarginPercent,
            dailyTarget,
            createdBy: userId,
        }, tx, userId);
    }

    /**
     * Get today's progress vs target
     */
    static async getTodayProgress(tenantId: string, tx: TransactionContext) {
        const today = new Date();
        const month = today.toISOString().slice(0, 7); // "2026-01"

        const target = await this.getOrCreate(tenantId, tx, month);
        if (!target) {
            return { hasTarget: false };
        }

        // Get today's revenue from sales and services
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // Sales revenue
        const salesResult = await tx
            .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
            .from(sales)
            .where(and(
                eq(sales.tenantId, tenantId),
                gte(sales.createdAt, todayStart),
                lte(sales.createdAt, todayEnd),
                eq(sales.paymentStatus, "paid")
            ));

        // Service revenue (only "diambil" status)
        const serviceResult = await tx
            .select({ total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                gte(services.dateOut, todayStart),
                lte(services.dateOut, todayEnd),
                eq(services.status, "diambil")
            ));

        const todayRevenue = Number(salesResult[0]?.total || 0) + Number(serviceResult[0]?.total || 0);
        const progressPercent = target.dailyTarget > 0
            ? Math.round((todayRevenue / target.dailyTarget) * 100)
            : 0;

        return {
            hasTarget: true,
            month,
            date: today.toISOString().slice(0, 10),
            dailyTarget: target.dailyTarget,
            dailyBreakeven: target.dailyBreakeven,
            todayRevenue,
            progressPercent,
            remaining: Math.max(0, target.dailyTarget - todayRevenue),
            isAboveBreakeven: todayRevenue >= target.dailyBreakeven,
            isAboveTarget: todayRevenue >= target.dailyTarget,
        };
    }

    /**
     * Get monthly progress
     */
    static async getMonthProgress(tenantId: string, tx: TransactionContext, month: string) {
        const target = await this.getOrCreate(tenantId, tx, month);
        if (!target) {
            return { hasTarget: false };
        }

        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Sales revenue for month
        const salesResult = await tx
            .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
            .from(sales)
            .where(and(
                eq(sales.tenantId, tenantId),
                gte(sales.createdAt, startDate),
                lte(sales.createdAt, endDate),
                eq(sales.paymentStatus, "paid")
            ));

        // Service revenue for month
        const serviceResult = await tx
            .select({ total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                gte(services.dateOut, startDate),
                lte(services.dateOut, endDate),
                eq(services.status, "diambil")
            ));

        const monthRevenue = Number(salesResult[0]?.total || 0) + Number(serviceResult[0]?.total || 0);
        const monthTarget = target.dailyTarget * target.workingDays;

        // Calculate working days elapsed
        const today = new Date();
        const isCurrentMonth = month === today.toISOString().slice(0, 7);
        const dayOfMonth = isCurrentMonth ? today.getDate() : new Date(endDate.getTime() - 1).getDate();

        // Simple estimate: assume evenly distributed working days
        const workingDaysElapsed = Math.ceil((dayOfMonth / 30) * target.workingDays);
        const expectedRevenue = target.dailyTarget * workingDaysElapsed;

        return {
            hasTarget: true,
            month,
            monthlyTarget: monthTarget,
            monthlyBreakeven: target.monthlyTotal,
            monthRevenue,
            progressPercent: monthTarget > 0 ? Math.round((monthRevenue / monthTarget) * 100) : 0,
            expectedRevenue,
            vsExpected: monthRevenue - expectedRevenue,
            isOnTrack: monthRevenue >= expectedRevenue,
        };
    }

    /**
     * Update target manually
     */
    static async update(tenantId: string, tx: TransactionContext, month: string, input: Partial<SetTargetInput>, userId?: string): Promise<void> {
        const existing = await this.getOrCreate(tenantId, tx, month, userId);

        await this.calculateAndSet(tenantId, tx, {
            month,
            workingDays: input.workingDays || existing.workingDays,
            profitMarginPercent: input.profitMarginPercent || existing.profitMarginPercent,
        }, userId);
    }
}
