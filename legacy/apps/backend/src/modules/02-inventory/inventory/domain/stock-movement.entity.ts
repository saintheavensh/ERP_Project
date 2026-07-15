/**
 * Domain entity for stock movement audit trail.
 * Enforces an immutable ledger.
 */
export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";
export type StockReferenceType = "PURCHASE" | "SALE" | "MANUAL";

export interface StockMovementEntity {
    id: string;
    productId: string;
    type: StockMovementType;
    quantity: number;
    referenceType: StockReferenceType;
    referenceId: string;
    createdAt: Date;
}
