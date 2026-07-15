/**
 * Product DTO
 * Data transfer object for returning product data to the presentation layer.
 */
export interface ProductDTO {
    id: string;
    sku: string;
    name: string;
    price: number; // in cents
    stock: number; // calculated from batches
    minimumStock: number;
    unit: string;
    isActive: boolean;
    status: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
}
