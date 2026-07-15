/**
 * Types for centralized stock operations (single gate).
 * @see docs/ref.md
 */

export interface DeductStockFIFOItem {
    productId: string;
    variant: string;
    quantity: number;
    unitPrice: number;
}

export interface DeductStockFIFOInput {
    saleId: string;
    items: DeductStockFIFOItem[];
}

export interface DeductStockFIFOAllocation {
    productId: string;
    variantId: string | null;
    variantName: string;
    batchId: string;
    quantity: number;
    buyPrice: number;
}

export interface DeductStockFIFOOutput {
    allocations: DeductStockFIFOAllocation[];
    cogsAmount: number;
}

// --- PR-2: Stock IN (Purchase verification) ---

export interface AddStockFromPurchaseVerificationItem {
    purchaseItemId: string;
    productId: string;
    variantId: string | null;
    buyPrice: number;
    sellPrice: number;
    qtyReceived: number;
}

export interface AddStockFromPurchaseVerificationInput {
    purchaseId: string;
    supplierId: string;
    items: AddStockFromPurchaseVerificationItem[];
}

export interface AddStockFromPurchaseVerificationAllocation {
    purchaseItemId: string;
    batchId: string;
}

export interface AddStockFromPurchaseVerificationOutput {
    allocations: AddStockFromPurchaseVerificationAllocation[];
    totalQuantityApplied: number;
    success: boolean;
}

// --- Stock reversal (Purchase deletion) ---

export interface ReverseStockItem {
    productId: string;
    batchId: string | null;
    qtyReceived: number;
}

export interface ReverseStockInput {
    purchaseId: string;
    items: ReverseStockItem[];
}
