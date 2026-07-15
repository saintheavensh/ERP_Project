/**
 * Update Product DTO
 * Optional fields for updating a product.
 */
export interface UpdateProductDTO {
    name?: string;
    price?: number; // in cents
    status?: string;
    categoryId?: string;
}
