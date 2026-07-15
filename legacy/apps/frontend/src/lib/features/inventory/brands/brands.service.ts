import { api } from "$lib/shared/lib/api-client";
import type { ApiResponse } from "@repo/shared";

export interface Brand {
    id: string; // "samsung"
    name: string; // "Samsung Electronics"
    logo?: string;
    createdAt?: string;
}

export const BrandsService = {
    getAll: async () => {
        const res = await api.get<ApiResponse<Brand[]>>("/brands");
        return res.data.data ?? [];
    },

    create: async (data: { id: string; name: string; logo?: string }) => {
        const res = await api.post<ApiResponse<Brand>>("/brands", data);
        return res.data.data!;
    },

    update: async (id: string, data: { name?: string; logo?: string }) => {
        const res = await api.patch<ApiResponse<Brand>>(`/brands/${id}`, data);
        return res.data.data!;
    },

    delete: async (id: string) => {
        const res = await api.delete<ApiResponse<{ deleted: boolean }>>(`/brands/${id}`);
        return res.data.data;
    }
};
