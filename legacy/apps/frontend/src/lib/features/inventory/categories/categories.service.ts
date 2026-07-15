
import { api } from "$lib/shared/lib/api-client";
import type { Category, ApiResponse } from "@repo/shared";

/** Input type for creating a category */
export interface CreateCategoryInput {
    name: string;
    description?: string;
    parentId?: string | null;
    variants?: string[];
}

export const CategoriesService = {
    // Categories
    getAll: async (): Promise<Category[]> => {
        const res = await api.get<ApiResponse<Category[]>>("/categories");
        return res.data?.data ?? [];
    },
    create: async (data: CreateCategoryInput): Promise<Category> => {
        const res = await api.post<ApiResponse<Category>>("/categories", data);
        return res.data?.data!;
    },
    update: async (id: string, data: Partial<CreateCategoryInput>): Promise<Category> => {
        const res = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
        return res.data?.data!;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },

    // Category Variants
    addVariantTemplate: async (categoryId: string, name: string, supplierId?: string): Promise<any> => {
        const res = await api.post<ApiResponse<any>>(`/categories/${categoryId}/variants`, { name, supplierId });
        return res.data?.data;
    },
    removeVariantTemplate: async (variantId: number): Promise<void> => {
        await api.delete(`/categories/variants/${variantId}`);
    },

    // Bulk Min Stock (Category related)
    getProductCount: async (categoryId: string): Promise<number> => {
        const res = await api.get<ApiResponse<{ count: number }>>(`/inventory/categories/${categoryId}/product-count`);
        return res.data?.data?.count ?? 0;
    },
    bulkUpdateMinStock: async (categoryId: string, minStock: number): Promise<number> => {
        const res = await api.patch<ApiResponse<{ updatedCount: number }>>("/inventory/bulk-min-stock", { categoryId, minStock });
        return res.data?.data?.updatedCount ?? 0;
    },
};
