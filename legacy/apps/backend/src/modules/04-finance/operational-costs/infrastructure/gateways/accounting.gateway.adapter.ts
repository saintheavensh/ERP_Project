import { TransactionContext } from "../../../../../shared/types/db-context";
import { accountingService } from "../../../accounting/accounting-container";
import { IAccountingGateway } from "../../domain";

export class AccountingGatewayAdapter implements IAccountingGateway {
    async createJournal(tenantId: string, params: {
        description: string;
        referenceType: string;
        referenceId: string;
        date?: Date | null | undefined;
        lines: Array<{
            accountId: string;
            debit: number;
            credit: number;
            description?: string | null | undefined;
        }>;
    }, userId: string, tx: TransactionContext): Promise<void> {
        await accountingService.createJournal(tenantId, {
            ...params
        }, userId, tx);
    }
}
