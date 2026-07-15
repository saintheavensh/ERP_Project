import { db } from "../../../shared/infrastructure/database/client";
import {
    SaleRepositoryAdapter,
    InventoryGatewayAdapter,
    AccountingGatewayAdapter,
    MemberGatewayAdapter,
    SettingsGatewayAdapter,
    ApprovalGatewayAdapter
} from "./infrastructure";
import { ApprovalCheckService } from "../../04-finance/approvals/domain/services/ApprovalCheckService";
import { DrizzleApprovalRepository } from "../../04-finance/approvals/infrastructure/repositories/DrizzleApprovalRepository";
import { SettingsRepositoryAdapter } from "../../05-shared/settings/infrastructure/repositories/settings.repository.adapter";
import { GetSalesUseCase, GetSaleByIdUseCase, CreateSaleUseCase } from "./application";
import { Sale, CreateSaleInput } from "./domain";

// Fallback Inventory Dependencies to satisfy CreateSaleUseCase
import { DrizzleProductRepository } from "../../02-inventory/products/infrastructure/persistence/DrizzleProductRepository";
import { StockMovementRepositoryAdapter } from "../../02-inventory/inventory/infrastructure/adapters/stock-movement.repository.adapter";
import { GetProductStockUseCase } from "../../02-inventory/inventory/application/use-cases/get-product-stock.use-case";
import { RecordStockMovementUseCase } from "../../02-inventory/inventory/application/use-cases/record-stock-movement.use-case";
import { InventoryTransactionServiceImpl } from "../../02-inventory/inventory/application/services/inventory-transaction.service.impl";
import { DrizzleClient } from "../../../shared/infrastructure/database/DrizzleClient";

// Adapters
const repository = new SaleRepositoryAdapter();
const inventoryGateway = new InventoryGatewayAdapter();
const accountingGateway = new AccountingGatewayAdapter();
const memberGateway = new MemberGatewayAdapter();
const settingsGateway = new SettingsGatewayAdapter();

// Dependency from other modules (Approvals)
const settingsRepo = new SettingsRepositoryAdapter();
const approvalRepo = new DrizzleApprovalRepository();
const approvalCheckService = new ApprovalCheckService(settingsRepo);
const approvalGateway = new ApprovalGatewayAdapter(approvalCheckService, approvalRepo);

// Cross-Module Wiring for CreateSaleUseCase
const productRepo = new DrizzleProductRepository();
const stockMovementRepo = new StockMovementRepositoryAdapter();
const getProductStockUseCase = new GetProductStockUseCase(stockMovementRepo);
const recordStockMovementUseCase = new RecordStockMovementUseCase(stockMovementRepo, productRepo);
const inventoryTransactionService = new InventoryTransactionServiceImpl(inventoryGateway, recordStockMovementUseCase);

import { inventoryAuthority } from "../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../shared/types/db-context";

// Use Cases
const getSalesUC = new GetSalesUseCase(repository);
const getSaleByIdUC = new GetSaleByIdUseCase(repository);
const createSaleUC = new CreateSaleUseCase(
    repository,
    accountingGateway,
    memberGateway,
    settingsGateway,
    approvalGateway,
    getProductStockUseCase,
    productRepo,
    inventoryTransactionService
);

/**
 * SalesService — Facade for external and presentation layers.
 */
export class SalesService {
    async getAll(tenantId: string, query: { startDate?: string; endDate?: string; search?: string; limit?: string }): Promise<Sale[]> {
        return await inventoryAuthority.execute(
            async (tx: TransactionContext) => await getSalesUC.execute(tenantId, query, tx),
            undefined,
            tenantId
        );
    }

    async getById(tenantId: string, id: string): Promise<Sale> {
        return await inventoryAuthority.execute(
            async (tx: TransactionContext) => await getSaleByIdUC.execute(tenantId, id, tx),
            undefined,
            tenantId
        );
    }

    async createSale(tenantId: string, data: CreateSaleInput): Promise<{ message: string; id: string; change: number }> {
        return await inventoryAuthority.execute(
            async (tx: TransactionContext) => await createSaleUC.execute(tenantId, data, tx),
            undefined,
            tenantId
        );
    }
}

/** Singleton instance */
export const salesService = new SalesService();
