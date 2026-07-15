/**
 * Barrel export for the Inventory domain layer.
 * Only stock-related types remain after catalog extraction to products module.
 */

// Stock domain types
export type { ProductRef } from "./product-ref.type";
export type { StockMovementEntity } from "./stock-movement.entity";

// Stock types
export type {
    DeductStockFIFOInput,
    DeductStockFIFOOutput,
    DeductStockFIFOItem,
    DeductStockFIFOAllocation,
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput,
    AddStockFromPurchaseVerificationItem,
    AddStockFromPurchaseVerificationAllocation,
    ReverseStockItem,
    ReverseStockInput
} from "./stock.types";

// Port interfaces (stock only)
export type { IStockMutationGateway } from "./stock-mutation-gateway.port";
export type { IBatchRepository, ProductBatchEntity } from "./batch-repository.port";
export type { IActivityLogger, ActivityLogEntry } from "./activity-logger.port";
export type {
    IStockOpnameRepository,
    OpnameSessionEntity,
    OpnameItemEntity,
    OpnameBatchEntity,
    AdjustmentHistoryRow,
    InsertSessionData,
    InsertItemData
} from "./stock-opname-repository.port";
export * from './product-ref.type';
export * from './product-ref.type';
