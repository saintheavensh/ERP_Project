import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IAccountingGateway {
    createJournal(tenantId: string, params: {
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
    }, userId: string, tx: TransactionContext): Promise<void>;
}
