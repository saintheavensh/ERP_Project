import type { TransactionContext } from "../../../../../shared/types/db-context";

export interface ICategoryGateway {
    categoryExists(categoryId: string, tx: TransactionContext): Promise<boolean>;
}
