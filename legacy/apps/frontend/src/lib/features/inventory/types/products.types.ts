export interface Batch {
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate?: string;
    location?: string;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    minStock?: number;
    location?: string;
    image?: string;
    supplier?: string;
    batches?: Batch[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductFilters {
    category?: string;
    supplier?: string;
    lowStock?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

export interface ProductResponse {
    items: Product[];
    total: number;
    page: number;
    limit: number;
}
