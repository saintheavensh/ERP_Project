import { api } from "$lib/shared/lib/api-client";
import type { ApiResponse } from "@repo/shared";

export const PurchaseService = {
    getAll: async () => {
        const res = await api.get<ApiResponse<any>>("/purchases");
        return res.data.data ?? [];
    },
    create: async (data: any) => {
        const res = await api.post<ApiResponse<any>>("/purchases", data);
        return res.data.data!;
    }
};
