/**
 * Lightweight product reference for the stock domain.
 * Prevents circular dependency: inventory never imports ProductEntity from products.
 */
export type ProductRef = {
    productId: string;
    variantId?: string;
};
