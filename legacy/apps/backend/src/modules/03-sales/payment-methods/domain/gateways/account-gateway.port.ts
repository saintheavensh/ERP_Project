import { TransactionContext } from "../../../../../shared/types/db-context";

export interface IAccountGateway {
    /**
     * Ensures an account exists in COA for this payment method/variant.
     */
    ensureAccount(tenantId: string, name: string, type: string, tx: TransactionContext, providedAccountId?: string | undefined): Promise<string>;
}
