import { StockMutationGatewayAdapter } from "./infrastructure/adapters/stock-mutation-gateway.adapter";
import { StockOpnameRepositoryAdapter } from "./infrastructure/adapters/stock-opname-repository.adapter";
import { ActivityLoggerAdapter } from "./infrastructure/adapters/activity-logger.adapter";
import { BatchRepositoryAdapter } from "./infrastructure/adapters/batch-repository.adapter";
import { GamblingRepositoryAdapter } from "./infrastructure/adapters/gambling-repository.adapter";
import { KanibalRepositoryAdapter } from "./infrastructure/adapters/kanibal-repository.adapter";

import { DeductStockFIFOUseCase } from "./application/use-cases/deduct-stock-fifo.use-case";
import { AddStockFromPurchaseUseCase } from "./application/use-cases/add-stock-from-purchase.use-case";
import { ReverseStockUseCase } from "./application/use-cases/reverse-stock.use-case";
import { GetLastBatchUseCase } from "./application/use-cases/get-last-batch.use-case";
import { ReduceBatchStockUseCase } from "./application/use-cases/reduce-batch-stock.use-case";
import { RecordDeadPhonePurchaseUseCase } from "./application/use-cases/record-dead-phone-purchase.use-case";
import { RecordTestLogUseCase } from "./application/use-cases/record-test-log.use-case";
import { HarvestPartUseCase } from "./application/use-cases/harvest-part.use-case";
import { ForfeitServiceDeviceUseCase } from "./application/use-cases/forfeit-service-device.use-case";

import { CreateOpnameSessionUseCase } from "./application/use-cases/create-opname-session.use-case";
import { GetOpnameSessionsUseCase } from "./application/use-cases/get-opname-sessions.use-case";
import { GetOpnameSessionDetailsUseCase } from "./application/use-cases/get-opname-session-details.use-case";
import { UpdateOpnameItemUseCase } from "./application/use-cases/update-opname-item.use-case";
import { FinalizeOpnameSessionUseCase } from "./application/use-cases/finalize-opname-session.use-case";
import { CancelOpnameSessionUseCase } from "./application/use-cases/cancel-opname-session.use-case";
import { GetAdjustmentHistoryUseCase } from "./application/use-cases/get-adjustment-history.use-case";

import { InventoryTransactionAuthority } from "./application/services/inventory-transaction-authority";
import { db } from "@shared/infrastructure/database/client";

// Adapters
const stockGateway = new StockMutationGatewayAdapter();
const stockOpnameRepo = new StockOpnameRepositoryAdapter();
const activityLogger = new ActivityLoggerAdapter();
const batchRepository = new BatchRepositoryAdapter();
const gamblingRepository = new GamblingRepositoryAdapter();
const kanibalRepository = new KanibalRepositoryAdapter();
// InventoryTransactionAuthority expects NodePgDatabase<typeof schema>.
// The global db client satisfies this type at runtime.
export const inventoryAuthority = new InventoryTransactionAuthority(db as ConstructorParameters<typeof InventoryTransactionAuthority>[0]);

// Use Cases
const deductStockFIFOUC = new DeductStockFIFOUseCase(stockGateway);
const addStockFromPurchaseUC = new AddStockFromPurchaseUseCase(stockGateway);
const reverseStockUC = new ReverseStockUseCase(stockGateway);
const getLastBatchUC = new GetLastBatchUseCase(batchRepository);
const reduceBatchStockUC = new ReduceBatchStockUseCase(stockGateway, batchRepository);
const recordDeadPhoneUC = new RecordDeadPhonePurchaseUseCase(gamblingRepository);
const recordTestLogUC = new RecordTestLogUseCase(gamblingRepository);
const harvestPartUC = new HarvestPartUseCase(gamblingRepository, kanibalRepository, stockGateway);
const forfeitServiceDeviceUC = new ForfeitServiceDeviceUseCase(kanibalRepository);

const createOpnameSessionUC = new CreateOpnameSessionUseCase(stockOpnameRepo, activityLogger);
const getOpnameSessionsUC = new GetOpnameSessionsUseCase(stockOpnameRepo);
const getOpnameSessionDetailsUC = new GetOpnameSessionDetailsUseCase(stockOpnameRepo);
const updateOpnameItemUC = new UpdateOpnameItemUseCase(stockOpnameRepo);
const finalizeOpnameSessionUC = new FinalizeOpnameSessionUseCase(stockOpnameRepo, activityLogger);
const cancelOpnameSessionUC = new CancelOpnameSessionUseCase(stockOpnameRepo, activityLogger);
const getAdjustmentHistoryUC = new GetAdjustmentHistoryUseCase(stockOpnameRepo);

import { InventoryService } from "./application/services/inventory.service";
import { StockOpnameService } from "./application/services/stock-opname.service";

// Service Facades
export const inventoryService = new InventoryService(
    deductStockFIFOUC,
    addStockFromPurchaseUC,
    reverseStockUC,
    getLastBatchUC,
    reduceBatchStockUC,
    batchRepository,
    recordDeadPhoneUC,
    recordTestLogUC,
    harvestPartUC,
    forfeitServiceDeviceUC,
    gamblingRepository,
    kanibalRepository,
    () => require("../products/products-container").productsService,
    inventoryAuthority
);

export const stockOpnameService = new StockOpnameService(
    inventoryAuthority,
    createOpnameSessionUC,
    getOpnameSessionsUC,
    getOpnameSessionDetailsUC,
    updateOpnameItemUC,
    finalizeOpnameSessionUC,
    cancelOpnameSessionUC,
    getAdjustmentHistoryUC
);

export const inventoryApplicationService = inventoryService;
export const stockOpnameApplicationService = stockOpnameService;
