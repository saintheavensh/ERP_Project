/**
 * Create Product DTO
 * Data required to create a new product.
 */
export interface CreateProductDTO {
    sku: string;
    name: string;
    price: number; // in cents
    categoryId: string;
}
