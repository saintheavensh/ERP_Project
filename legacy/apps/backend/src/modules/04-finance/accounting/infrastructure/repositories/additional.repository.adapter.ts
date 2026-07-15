import { eq, sql, desc, and } from "drizzle-orm";
import {
    cashRegisters,
    cashRegisterTransactions,
    assets,
    assetDepreciationLogs,
    revenueTargets,
    purchasePayments,
    commissionPayments,
    purchases,
} from "../../../../../shared/infrastructure/database/schema";
import { TransactionContext } from "../../../../../shared/types/db-context";
import {
    ICashRegisterRepository,
    IAssetRepository,
    IRevenueTargetRepository,
    IPurchasePaymentRepository,
    ICommissionPaymentRepository,
    CashRegister,
    CashTransaction,
    FixedAsset,
    DepreciationEntry
} from "../../domain";

export class CashRegisterRepositoryAdapter implements ICashRegisterRepository {
    async getCurrent(tenantId: string, tx: TransactionContext): Promise<CashRegister | null> {
        const [result] = await tx.select().from(cashRegisters).where(and(eq(cashRegisters.tenantId, tenantId), eq(cashRegisters.status, "open"))).limit(1);
        return (result as CashRegister) || null;
    }

    async getById(tenantId: string, id: string, tx: TransactionContext): Promise<CashRegister | null> {
        const [result] = await tx.select().from(cashRegisters).where(and(eq(cashRegisters.tenantId, tenantId), eq(cashRegisters.id, id)));
        return (result as CashRegister) || null;
    }

    async create(tenantId: string, data: Partial<CashRegister>, tx: TransactionContext): Promise<{ id: string }> {
        const [result] = await tx.insert(cashRegisters).values({ ...data, tenantId } as any).returning({ id: cashRegisters.id });
        if (!result) throw new Error("Failed to create cash register");
        return result;
    }

    async update(tenantId: string, id: string, data: Partial<CashRegister>, tx: TransactionContext): Promise<void> {
        await tx.update(cashRegisters).set(data as any).where(and(eq(cashRegisters.tenantId, tenantId), eq(cashRegisters.id, id)));
    }

    async listHistory(tenantId: string, limit: number, offset: number, tx: TransactionContext): Promise<CashRegister[]> {
        return await tx.select().from(cashRegisters).where(eq(cashRegisters.tenantId, tenantId)).orderBy(desc(cashRegisters.openedAt)).limit(limit).offset(offset) as CashRegister[];
    }

    async createTransaction(tenantId: string, data: Partial<CashTransaction>, tx: TransactionContext): Promise<void> {
        const { type, ...rest } = data as any;
        await tx.insert(cashRegisterTransactions).values({
            ...rest,
            tenantId,
            transactionType: type,
        });
    }

    async getTransactions(tenantId: string, registerId: string, tx: TransactionContext): Promise<CashTransaction[]> {
        const results = await tx.select().from(cashRegisterTransactions).where(and(eq(cashRegisterTransactions.tenantId, tenantId), eq(cashRegisterTransactions.registerId, registerId)));
        return results.map((r: any) => ({ ...r, type: r.transactionType })) as CashTransaction[];
    }

    async getSummary(tenantId: string, registerId: string, tx: TransactionContext): Promise<any> {
        const transactions = await this.getTransactions(tenantId, registerId, tx);
        const summary: any = {
            sale: { count: 0, total: 0 },
            service: { count: 0, total: 0 },
            expense: { count: 0, total: 0 },
            refund: { count: 0, total: 0 },
            adjustment: { count: 0, total: 0 },
        };

        for (const txn of transactions) {
            const type = txn.type as any;
            if (summary[type]) {
                summary[type].count++;
                summary[type].total += txn.amount;
            }
        }

        return {
            transactionCount: transactions.length,
            byType: summary,
            totalIn: transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            totalOut: transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
        };
    }

    async getTodayProgress(tenantId: string, tx: TransactionContext): Promise<any> {
        const register = await this.getCurrent(tenantId, tx);
        if (!register) {
            return { isOpen: false, progress: 0, totalSales: 0, totalServices: 0 };
        }

        const summary = await this.getSummary(tenantId, register.id, tx);
        const recentTransactions = await tx
            .select()
            .from(cashRegisterTransactions)
            .where(and(eq(cashRegisterTransactions.tenantId, tenantId), eq(cashRegisterTransactions.registerId, register.id)))
            .orderBy(desc(cashRegisterTransactions.createdAt))
            .limit(10);

        return {
            isOpen: true,
            registerId: register.id,
            openingBalance: register.openingBalance,
            expectedClosing: register.expectedClosing,
            totalSales: summary.byType.sale.total,
            totalServices: summary.byType.service.total,
            totalExpenses: Math.abs(summary.byType.expense.total),
            transactionCount: summary.transactionCount,
            recentTransactions
        };
    }
}

export class AssetRepositoryAdapter implements IAssetRepository {
    async findAll(tenantId: string, tx: TransactionContext): Promise<FixedAsset[]> {
        return await tx.select().from(assets).where(eq(assets.tenantId, tenantId)) as FixedAsset[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<FixedAsset | null> {
        const [result] = await tx.select().from(assets).where(and(eq(assets.tenantId, tenantId), eq(assets.id, id)));
        return (result as FixedAsset) || null;
    }

    async create(tenantId: string, data: Partial<FixedAsset>, tx: TransactionContext): Promise<{ id: string }> {
        const [result] = await tx.insert(assets).values({ ...data, tenantId } as any).returning({ id: assets.id });
        if (!result) throw new Error("Failed to create asset");
        return result;
    }

    async update(tenantId: string, id: string, data: Partial<FixedAsset>, tx: TransactionContext): Promise<void> {
        await tx.update(assets).set(data as any).where(and(eq(assets.tenantId, tenantId), eq(assets.id, id)));
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(assets).where(and(eq(assets.tenantId, tenantId), eq(assets.id, id)));
    }

    async createDepreciation(tenantId: string, data: Partial<DepreciationEntry>, tx: TransactionContext): Promise<void> {
        await tx.insert(assetDepreciationLogs).values({ ...data, tenantId } as any);
    }

    async getDepreciationHistory(tenantId: string, assetId: string, tx: TransactionContext): Promise<DepreciationEntry[]> {
        return await tx.select().from(assetDepreciationLogs).where(and(eq(assetDepreciationLogs.tenantId, tenantId), eq(assetDepreciationLogs.assetId, assetId))) as DepreciationEntry[];
    }
}

export class RevenueTargetRepositoryAdapter implements IRevenueTargetRepository {
    async findByMonth(tenantId: string, month: string, tx: TransactionContext): Promise<any | null> {
        const [result] = await tx.select().from(revenueTargets).where(and(eq(revenueTargets.tenantId, tenantId), eq(revenueTargets.month, month)));
        return result || null;
    }

    async upsert(tenantId: string, month: string, data: any, tx: TransactionContext): Promise<void> {
        const existing = await this.findByMonth(tenantId, month, tx);
        if (existing) {
            await tx.update(revenueTargets).set(data).where(and(eq(revenueTargets.tenantId, tenantId), eq(revenueTargets.month, month)));
        } else {
            await tx.insert(revenueTargets).values({ ...data, month, tenantId });
        }
    }
}

export class PurchasePaymentRepositoryAdapter implements IPurchasePaymentRepository {
    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null> {
        const [result] = await tx.select().from(purchasePayments).where(and(eq(purchasePayments.tenantId, tenantId), eq(purchasePayments.id, id)));
        return result || null;
    }

    async create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }> {
        const [result] = await tx.insert(purchasePayments).values({ ...data, tenantId }).returning({ id: purchasePayments.id });
        if (!result) throw new Error("Failed to create purchase payment");
        return result;
    }

    async getTotalPaid(tenantId: string, purchaseId: string, tx: TransactionContext): Promise<number> {
        const [result] = await tx.select({
            total: sql<number>`sum(${purchasePayments.amount})`
        }).from(purchasePayments).where(and(eq(purchasePayments.tenantId, tenantId), eq(purchasePayments.purchaseId, purchaseId)));
        return Number(result?.total) || 0;
    }

    async findHistoryByPurchaseId(tenantId: string, purchaseId: string, tx: TransactionContext): Promise<any[]> {
        return await tx.select().from(purchasePayments).where(and(eq(purchasePayments.tenantId, tenantId), eq(purchasePayments.purchaseId, purchaseId))).orderBy(desc(purchasePayments.createdAt));
    }

    async findPurchaseById(tenantId: string, id: string, tx: TransactionContext): Promise<any | null> {
        const [result] = await tx.select().from(purchases).where(and(eq(purchases.tenantId, tenantId), eq(purchases.id, id)));
        return result || null;
    }
}

export class CommissionPaymentRepositoryAdapter implements ICommissionPaymentRepository {
    async create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }> {
        const [result] = await tx.insert(commissionPayments).values({ ...data, tenantId }).returning({ id: commissionPayments.id });
        if (!result) throw new Error("Failed to create commission payment");
        return result;
    }

    async findHistory(tenantId: string, tx: TransactionContext, technicianId?: string | undefined, period?: string | undefined): Promise<any[]> {
        const conditions: any[] = [eq(commissionPayments.tenantId, tenantId)];
        if (technicianId) conditions.push(eq(commissionPayments.technicianId, technicianId));
        if (period) conditions.push(eq(commissionPayments.period, period));

        return await tx.select().from(commissionPayments).where(and(...conditions)).orderBy(desc(commissionPayments.paidAt));
    }

    async getPaidServiceIds(tenantId: string, period: string, tx: TransactionContext): Promise<Set<string>> {
        const results = await tx.select({ serviceIds: commissionPayments.serviceIds })
            .from(commissionPayments)
            .where(and(eq(commissionPayments.tenantId, tenantId), eq(commissionPayments.period, period)));

        const paidServiceIds = new Set<string>();
        for (const row of results) {
            const ids = row.serviceIds as string[];
            if (ids) {
                ids.forEach(id => paidServiceIds.add(id));
            }
        }
        return paidServiceIds;
    }
}
