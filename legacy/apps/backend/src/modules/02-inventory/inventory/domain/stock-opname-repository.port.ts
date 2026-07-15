import { TransactionContext } from "../../../../shared/types/db-context";

/**
 * Port for stock opname persistence. Keeps the stock opname use case independent of DB.
 */

// --- Domain DTOs for Stock Opname ---

export type OpnameStatus = "draft" | "completed" | "cancelled";

export interface OpnameSessionEntity {
    id: string;
    userId: string;
    notes: string | null;
    status: OpnameStatus | null;
    createdAt: Date | null;
    completedAt: Date | null;
    user?: unknown;
}

export interface OpnameItemEntity {
    id: number;
    sessionId: string;
    productId: string;
    variantName: string;
    systemStock: number;
    physicalStock: number | null;
    adjustmentReason?: string | null;
    difference: number;
    product?: unknown;
}

export interface OpnameBatchEntity {
    id: string;
    productId: string;
    variantId: string | null;
    variant?: string | null;
    buyPrice: number;
    currentStock: number;
    createdAt: Date | null;
}

export interface AdjustmentHistoryRow {
    id: number;
    sessionId: string;
    productId: string;
    productName: string;
    variantName: string;
    systemStock: number;
    physicalStock: number | null;
    difference: number;
    reason: string | null;
    completedAt: Date | null;
    userId: string;
    userName: string;
}

export interface InsertSessionData {
    id: string;
    userId: string;
    notes?: string;
    status: OpnameStatus;
}

export interface InsertItemData {
    sessionId: string;
    productId: string;
    variantName: string;
    systemStock: number;
}

// --- Port Interface ---

export interface IStockOpnameRepository {
    /** Insert a new opname session row. */
    insertSession(tenantId: string, data: InsertSessionData, tx: TransactionContext): Promise<void>;

    /** Update session status (and optionally completedAt). */
    updateSessionStatus(tenantId: string, id: string, status: OpnameStatus, completedAt: Date | undefined, tx: TransactionContext): Promise<void>;

    /** Bulk-insert opname items for a session. */
    insertItems(tenantId: string, items: InsertItemData[], tx: TransactionContext): Promise<void>;

    /** Update an opname item's physical stock and reason. */
    updateItem(tenantId: string, itemId: number, physicalStock: number, reason: string | undefined, tx: TransactionContext): Promise<OpnameItemEntity | null>;

    /** Get all sessions ordered by creation desc. */
    findSessions(tenantId: string, tx: TransactionContext): Promise<OpnameSessionEntity[]>;

    /** Get a session by ID (without items). */
    findSessionById(tenantId: string, id: string, tx: TransactionContext): Promise<OpnameSessionEntity | null>;

    /** Get all items for a session, with product details and computed difference. */
    findItemsBySession(tenantId: string, sessionId: string, tx: TransactionContext): Promise<OpnameItemEntity[]>;

    /** Get product IDs that belong to a category. */
    findProductIdsByCategory(tenantId: string, categoryId: string, tx: TransactionContext): Promise<string[]>;

    /** Get batches, optionally filtered by product IDs. */
    findAllBatches(tenantId: string, productIds: string[] | undefined, tx: TransactionContext): Promise<OpnameBatchEntity[]>;

    /** Find batches for a product, optionally filtered by variant name. */
    findBatchesByProductAndVariant(
        tenantId: string,
        productId: string,
        variantName: string | null,
        tx: TransactionContext
    ): Promise<OpnameBatchEntity[]>;

    /** Resolve a variant name to a variant ID for a given product. */
    resolveVariantId(tenantId: string, productId: string, variantName: string, tx: TransactionContext): Promise<string | null>;

    /** Update a single batch's stock. */
    updateBatchStock(tenantId: string, batchId: string, newStock: number, tx: TransactionContext): Promise<void>;

    /** Adjust parent product stock by a delta. */
    updateProductStockDelta(tenantId: string, productId: string, delta: number, tx: TransactionContext): Promise<void>;

    /** Get adjustment history rows for completed sessions with differences. */
    getAdjustmentHistoryRows(tenantId: string, tx: TransactionContext): Promise<AdjustmentHistoryRow[]>;
}
