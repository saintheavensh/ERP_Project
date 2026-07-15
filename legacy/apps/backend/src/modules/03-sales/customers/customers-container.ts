import { db } from "../../../shared/infrastructure/database/client";
import { CustomerRepositoryAdapter } from "./infrastructure";
import {
    GetCustomersUseCase,
    GetCustomerByIdUseCase,
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    GetCustomerSalesUseCase,
    GetCustomerUnpaidSalesUseCase,
    ProcessCustomerPaymentUseCase
} from "./application";

// Infrastructure adapters
const repository = new CustomerRepositoryAdapter();

// Use cases
const getCustomersUC = new GetCustomersUseCase(repository);
const getCustomerByIdUC = new GetCustomerByIdUseCase(repository);
const createCustomerUC = new CreateCustomerUseCase(repository);
const updateCustomerUC = new UpdateCustomerUseCase(repository);
const deleteCustomerUC = new DeleteCustomerUseCase(repository);
const getCustomerSalesUC = new GetCustomerSalesUseCase(repository);
const getCustomerUnpaidSalesUC = new GetCustomerUnpaidSalesUseCase(repository);
const processCustomerPaymentUC = new ProcessCustomerPaymentUseCase(repository);

import { inventoryAuthority } from "../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../shared/types/db-context";

/**
 * CustomersService — facade for external and presentation layers.
 */
export class CustomersService {
    async getAll(tenantId: string, query?: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getCustomersUC.execute(tenantId, tx, query)
        );
    }

    async getById(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getCustomerByIdUC.execute(tenantId, id, tx)
        );
    }

    async create(tenantId: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await createCustomerUC.execute(tenantId, data, tx)
        );
    }

    async update(tenantId: string, id: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await updateCustomerUC.execute(tenantId, id, data, tx)
        );
    }

    async delete(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await deleteCustomerUC.execute(tenantId, id, tx)
        );
    }

    async getSales(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getCustomerSalesUC.execute(tenantId, id, tx)
        );
    }

    async getUnpaidSales(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getCustomerUnpaidSalesUC.execute(tenantId, id, tx)
        );
    }

    async processPayment(tenantId: string, dto: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await processCustomerPaymentUC.execute(tenantId, dto, tx)
        );
    }
}

/** Singleton service instance */
export const customersService = new CustomersService();
