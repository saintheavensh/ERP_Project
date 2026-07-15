/**
 * PurchaseCompleted Event
 * Payload: 
 * - purchaseId: string
 * - items: PurchaseItemSnapshot[]
 * - totalAmount: number
 * - timestamp: Date
 */
export const PURCHASE_COMPLETED = "PurchaseCompleted";

/**
 * PurchaseCancelled Event
 * Payload:
 * - purchaseId: string
 * - timestamp: Date
 */
export const PURCHASE_CANCELLED = "PurchaseCancelled";
