import { TransactionContext } from "../../../../../shared/types/db-context";
import { Customer, CustomerSale } from "../entities/customer.entity";

export interface ICustomerRepository {
    findAll(tenantId: string, tx: TransactionContext, query?: string): Promise<Customer[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<Customer | null>;
    findByPhone(tenantId: string, phone: string, tx: TransactionContext): Promise<Customer | null>;
    create(tenantId: string, data: any, tx: TransactionContext): Promise<Customer>;
    update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<Customer>;
    delete(tenantId: string, id: string, tx: TransactionContext): Promise<void>;
    findSales(tenantId: string, memberId: string, tx: TransactionContext): Promise<CustomerSale[]>;
    findUnpaidSales(tenantId: string, memberId: string, tx: TransactionContext): Promise<CustomerSale[]>;
}
