import { TransactionContext } from "../../../../../shared/types/db-context";
import { Sale } from "../entities/sale.entity";

export interface ISaleRepository {
    findAll(tenantId: string, params: { startDate?: Date | undefined; endDate?: Date | undefined; search?: string | undefined; limit?: number | undefined }, tx: TransactionContext): Promise<Sale[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<Sale | null>;
    create(tenantId: string, sale: any, tx: TransactionContext): Promise<void>;
    createItem(tenantId: string, item: any, tx: TransactionContext): Promise<void>;
    createPayment(tenantId: string, payment: any, tx: TransactionContext): Promise<void>;
}
