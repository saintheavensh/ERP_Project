/**
 * Re-export shared types
 */
export type { Sale, SaleItem, PaymentMethod } from "@repo/shared";

/**
 * Cart item in the sales flow
 */
export interface CartItem {
    productId: string;
    productName: string;
    variant: string;
    qty: number;
    price: number;
    maxQty: number;
}

/**
 * Payment entry during checkout
 */
export interface PaymentEntry {
    method: string;
    methodId?: string;
    variantId?: string;
    variantName?: string;
    amount: number;
    reference?: string;
}

/**
 * Input for creating a sale
 */
export interface CreateSaleInput {
    memberId?: string;
    customerName?: string;
    userId: string;
    notes?: string;
    discountAmount?: number;
    items: {
        productId: string;
        variant: string;
        qty: number;
        price: number;
    }[];
    payments: PaymentEntry[];
}

/**
 * Response from creating a sale
 */
export interface CreateSaleResponse {
    message: string;
    id: string;
    change: number;
}

/**
 * Product for display in sales catalog
 */
export interface SalesProduct {
    id: string;
    name: string;
    sku: string;
    categoryId: string;
    brandId?: string;
    categoryName?: string;
    brandName?: string;
    variants: SalesProductVariant[];
}

/**
 * Product variant for sales
 */
export interface SalesProductVariant {
    name: string;
    price: number;
    stock: number;
}
