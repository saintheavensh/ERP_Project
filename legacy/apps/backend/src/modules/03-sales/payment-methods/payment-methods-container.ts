import { db } from "../../../shared/infrastructure/database/client";
import { TransactionContext } from "../../../shared/types/db-context";
import { PaymentMethodRepositoryAdapter, AccountGatewayAdapter } from "./infrastructure";
import {
    GetPaymentMethodsUseCase,
    GetPaymentMethodByIdUseCase,
    CreatePaymentMethodUseCase,
    MutatePaymentMethodUseCase,
    VariantManagementUseCase
} from "./application";
import { PaymentMethod, PaymentMethodInput, PaymentVariantInput } from "./domain";

// Infrastructure adapters
const repository = new PaymentMethodRepositoryAdapter();
const accountGateway = new AccountGatewayAdapter();

// Use cases
const getPaymentMethodsUC = new GetPaymentMethodsUseCase(repository);
const getPaymentMethodByIdUC = new GetPaymentMethodByIdUseCase(repository);
const createPaymentMethodUC = new CreatePaymentMethodUseCase(repository, accountGateway);
const mutatePaymentMethodUC = new MutatePaymentMethodUseCase(repository);
const variantManagementUC = new VariantManagementUseCase(repository, accountGateway);

import { inventoryAuthority } from "../../02-inventory/inventory/inventory-container";

/**
 * PaymentMethodsService — facade for external and presentation layers.
 */
export class PaymentMethodsService {
    async getAll(tenantId: string): Promise<PaymentMethod[]> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getPaymentMethodsUC.execute(tenantId, tx, false)
        );
    }

    async getEnabled(tenantId: string): Promise<PaymentMethod[]> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getPaymentMethodsUC.execute(tenantId, tx, true)
        );
    }

    async getById(tenantId: string, id: string): Promise<PaymentMethod> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getPaymentMethodByIdUC.execute(tenantId, id, tx)
        );
    }

    async create(tenantId: string, input: PaymentMethodInput): Promise<PaymentMethod> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await createPaymentMethodUC.execute(tenantId, input, tx)
        );
    }

    async update(tenantId: string, id: string, data: any): Promise<PaymentMethod> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await mutatePaymentMethodUC.execute(tenantId, id, data, tx)
        );
    }

    async disable(tenantId: string, id: string): Promise<void> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await mutatePaymentMethodUC.disable(tenantId, id, tx)
        );
    }

    async addVariant(tenantId: string, methodId: string, input: PaymentVariantInput): Promise<PaymentMethod> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await variantManagementUC.addVariant(tenantId, methodId, input, tx)
        );
    }

    async updateVariant(tenantId: string, variantId: string, data: any): Promise<void> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await variantManagementUC.updateVariant(tenantId, variantId, data, tx)
        );
    }

    async disableVariant(tenantId: string, variantId: string): Promise<void> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await variantManagementUC.disableVariant(tenantId, variantId, tx)
        );
    }
}

/** Singleton service instance */
export const paymentMethodsService = new PaymentMethodsService();
