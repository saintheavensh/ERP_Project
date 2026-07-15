import { TransactionContext } from "../../../../../shared/types/db-context";
import { PaymentMethod } from "../entities/payment-method.entity";

export interface IPaymentMethodRepository {
    findAll(tenantId: string, tx: TransactionContext): Promise<PaymentMethod[]>;
    findEnabled(tenantId: string, tx: TransactionContext): Promise<PaymentMethod[]>;
    findById(tenantId: string, id: string, tx: TransactionContext): Promise<PaymentMethod | null>;
    create(tenantId: string, data: any, tx: TransactionContext): Promise<PaymentMethod>;
    update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<PaymentMethod>;

    // Variants
    createVariant(tenantId: string, data: any, tx: TransactionContext): Promise<void>;
    updateVariant(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<void>;
    findVariantById(tenantId: string, id: string, tx: TransactionContext): Promise<any>;
}
