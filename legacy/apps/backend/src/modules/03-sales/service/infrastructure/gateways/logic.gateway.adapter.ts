import { TransactionContext } from "../../../../../shared/types/db-context";
import { accountingService } from "../../../../04-finance/accounting/accounting-container";
import { productBatches } from "../../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { IAccountingGateway, IInventoryGateway } from "../../domain";

export class AccountingGatewayAdapter implements IAccountingGateway {
    async isRegisterOpen(tenantId: string, tx: TransactionContext): Promise<boolean> {
        return await accountingService.isRegisterOpen(tenantId, tx);
    }

    async recordCashTransaction(tenantId: string, params: {
        transactionType: string;
        transactionId: string;
        amount: number;
        description?: string | null | undefined;
    }, tx: TransactionContext): Promise<void> {
        await accountingService.recordCashTransaction(tenantId, {
            transactionType: params.transactionType as any,
            transactionId: params.transactionId,
            amount: params.amount,
            description: params.description
        }, tx);
    }

    async createJournal(tenantId: string, params: {
        description: string;
        referenceType: string;
        referenceId: string;
        date?: Date | null | undefined;
        lines: Array<{ accountId: string; debit: number; credit: number; description?: string | null | undefined }>;
    }, userId: string, tx: TransactionContext): Promise<void> {
        await accountingService.createJournal(tenantId, {
            description: params.description,
            referenceType: params.referenceType,
            referenceId: params.referenceId,
            date: params.date,
            lines: params.lines
        }, userId, tx);
    }
}

export class InventoryGatewayAdapter implements IInventoryGateway {
    async getBatch(tenantId: string, batchId: string, tx: TransactionContext): Promise<any> {
        const rows = await tx.select()
            .from(productBatches)
            .where(and(eq(productBatches.tenantId, tenantId), eq(productBatches.id, batchId)))
            .for('update');
        return rows[0];
    }

    async updateStock(tenantId: string, batchId: string, delta: number, tx: TransactionContext): Promise<void> {
        const batch = await this.getBatch(tenantId, batchId, tx);
        if (!batch) return;

        await tx.update(productBatches).set({
            currentStock: batch.currentStock + delta,
            updatedAt: new Date()
        }).where(and(eq(productBatches.tenantId, tenantId), eq(productBatches.id, batchId)));
    }
}
