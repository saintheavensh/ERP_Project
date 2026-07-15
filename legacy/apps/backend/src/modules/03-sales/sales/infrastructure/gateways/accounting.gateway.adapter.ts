import { TransactionContext } from "../../../../../shared/types/db-context";
import { accountingService } from "../../../../04-finance/accounting/accounting-container";
import { IAccountingGateway } from "../../domain";

export class AccountingGatewayAdapter implements IAccountingGateway {
    async isRegisterOpen(tenantId: string, tx: TransactionContext): Promise<boolean> {
        return await accountingService.isRegisterOpen(tenantId, tx);
    }

    async recordCashTransaction(tenantId: string, params: {
        transactionType: string;
        transactionId: string;
        amount: number;
        description: string;
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
        lines: Array<{ accountId: string; debit: number; credit: number; description: string }>;
    }, userId: string, tx: TransactionContext): Promise<void> {
        await accountingService.createJournal(tenantId, params, userId, tx);
    }
}
