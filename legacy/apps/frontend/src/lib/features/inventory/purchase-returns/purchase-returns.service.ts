import { api } from "$lib/shared/lib/api-client";
import type { ApiResponse } from "@repo/shared";

export interface DefectiveItem {
    id: string;
    createdAt: string;
    qty: number;
    reason: string;
    source: string;
    supplierId: string;
    product: { name: string };
    batch: { variant: string | null };
    supplier: { name: string };
}

export interface PurchaseReturn {
    id: string;
    date: string;
    notes: string | null;
    supplier: { name: string };
    items: Array<{
        id: string;
        qty: number;
        product: { name: string };
    }>;
}

export const PurchaseReturnsService = {
    /**
     * Get all defective items in staging area
     */
    getDefectiveItems: async (): Promise<DefectiveItem[]> => {
        const res = await api.get<ApiResponse<DefectiveItem[]>>("/defective-items");
        return res.data?.data ?? [];
    },

    /**
     * Create a purchase return from selected defective items
     */
    createReturn: async (userId: string, itemIds: string[]): Promise<{ returnId: string }> => {
        const res = await api.post<ApiResponse<{ returnId: string }>>("/defective-items/create-return", {
            userId,
            itemIds,
        });
        return res.data?.data ?? { returnId: "" };
    },

    /**
     * Get all purchase returns (history)
     */
    getPurchaseReturns: async (): Promise<PurchaseReturn[]> => {
        const res = await api.get<ApiResponse<PurchaseReturn[]>>("/purchase-returns");
        return res.data?.data ?? [];
    },

    /**
     * Get purchase return by ID
     */
    getPurchaseReturnById: async (id: string): Promise<PurchaseReturn | null> => {
        const res = await api.get<ApiResponse<PurchaseReturn>>(`/purchase-returns/${id}`);
        return res.data?.data ?? null;
    },
};
