import { api } from '$lib/shared/lib/api-client';
import type { ApiResponse } from "@repo/shared";
import type { Product, ProductFilters, ProductResponse } from '../types/products.types';

class ProductsService {
    async getProducts(filters?: ProductFilters): Promise<ProductResponse> {
        const response = await api.get<ApiResponse<ProductResponse>>('/products', { params: filters });
        return response.data.data!;
    }

    async getProduct(id: string): Promise<Product> {
        const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
        return response.data.data!;
    }

    async createProduct(data: Partial<Product>): Promise<Product> {
        const response = await api.post<ApiResponse<Product>>('/products', data);
        return response.data.data!;
    }

    async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
        const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
        return response.data.data!;
    }

    async deleteProduct(id: string): Promise<void> {
        await api.delete(`/products/${id}`);
    }

    async bulkUpdate(ids: string[], data: any): Promise<void> {
        await api.post('/products/bulk', { ids, ...data });
    }

    // Warehouse specific
    async getStockByLocation(): Promise<any[]> {
        const response = await api.get<ApiResponse<any[]>>('/products/stock-by-location');
        return response.data.data!;
    }

    async printLabel(id: string): Promise<Blob> {
        const response = await api.get(`/products/${id}/label`, { responseType: 'blob' });
        return response.data;
    }

    // Teknisi specific
    async getSpareparts(): Promise<Product[]> {
        const response = await api.get<ApiResponse<Product[]>>('/products/spareparts');
        return response.data.data!;
    }

    async requestPart(productId: string, quantity: number): Promise<void> {
        await api.post('/products/request', { productId, quantity });
    }
}

export const productsService = new ProductsService();
