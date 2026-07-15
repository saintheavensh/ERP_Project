
import { api } from "$lib/shared/lib/api-client";
import type { ApiResponse } from "@repo/shared";

export const OpnameService = {
    // Stock Opname
    getOpnameSessions: async (): Promise<any[]> => {
        const res = await api.get<ApiResponse<any[]>>("/inventory/opname/sessions");
        return res.data?.data ?? [];
    },
    createOpnameSession: async (data: { notes?: string; categoryId?: string }): Promise<{ id: string }> => {
        const res = await api.post<ApiResponse<{ id: string }>>("/inventory/opname/sessions", data);
        return res.data?.data!;
    },
    getOpnameSessionDetails: async (id: string): Promise<any> => {
        const res = await api.get<ApiResponse<any>>(`/inventory/opname/sessions/${id}`);
        return res.data?.data;
    },
    updateOpnameItem: async (itemId: number, data: { physicalStock: number, reason?: string }): Promise<any> => {
        const res = await api.put<ApiResponse<any>>(`/inventory/opname/items/${itemId}`, data);
        return res.data?.data;
    },
    finalizeOpnameSession: async (id: string): Promise<void> => {
        await api.post(`/inventory/opname/sessions/${id}/finalize`);
    },
    cancelOpnameSession: async (id: string): Promise<void> => {
        await api.post(`/inventory/opname/sessions/${id}/cancel`);
    }
};
