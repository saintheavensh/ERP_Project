
import { api } from "$lib/shared/lib/api-client";
import type { Supplier, Category, ApiResponse } from "@repo/shared";

/** Input type for creating a supplier */
export interface CreateSupplierInput {
    name: string;
    contact?: string;
    phone?: string;
    address?: string;
    image?: string;
}

export const SuppliersService = {
    getAll: async (): Promise<Supplier[]> => {
        const res = await api.get<ApiResponse<Supplier[]>>("/suppliers");
        return res.data?.data ?? [];
    },
    create: async (data: CreateSupplierInput): Promise<Supplier> => {
        const res = await api.post<ApiResponse<Supplier>>("/suppliers", data);
        return res.data?.data!;
    },
    update: async (id: string, data: Partial<CreateSupplierInput>): Promise<Supplier> => {
        const res = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
        return res.data?.data!;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/suppliers/${id}`);
    },
    getCategories: async (supplierId: string): Promise<Category[]> => {
        const res = await api.get<ApiResponse<Category[]>>(`/suppliers/${supplierId}/categories`);
        return res.data?.data ?? [];
    },
    linkCategory: async (supplierId: string, categoryId: string): Promise<void> => {
        await api.post(`/suppliers/${supplierId}/categories`, { categoryId });
    },
    unlinkCategory: async (supplierId: string, categoryId: string): Promise<void> => {
        await api.delete(`/suppliers/${supplierId}/categories/${categoryId}`);
    },
    getVariants: async (supplierId: string): Promise<any[]> => {
        const res = await api.get<ApiResponse<any[]>>(`/inventory/suppliers/${supplierId}/variants`);
        return res.data?.data ?? [];
    },
};
