import { api } from "$lib/shared/lib/api-client";
import type { Sale, SaleItem, ApiResponse, PaymentMethod } from "@repo/shared";

/** Input for creating a sale */
interface CreateSaleInput {
    memberId?: string;
    customerName?: string;
    userId: string;
    notes?: string;
    discountAmount?: number;
    subtotal?: number;
    tax?: number;
    taxRate?: number;
    taxInclusive?: boolean;
    serviceFee?: number;
    items: {
        productId: string;
        variant: string;
        qty: number;
        price: number;
    }[];
    payments: {
        method: string;
        methodId?: string;
        variantId?: string;
        variantName?: string;
        amount: number;
        reference?: string;
    }[];
}

/** Response from creating a sale */
interface CreateSaleResponse {
    message: string;
    id: string;
    change: number;
}

export const SalesService = {
    create: async (data: CreateSaleInput): Promise<CreateSaleResponse> => {
        const res = await api.post<ApiResponse<CreateSaleResponse>>("/sales", data);
        return res.data.data!;
    },
    getAll: async (params?: Record<string, string>): Promise<Sale[]> => {
        const query = new URLSearchParams(params).toString();
        const res = await api.get<ApiResponse<Sale[]>>(`/sales?${query}`);
        return res.data?.data ?? [];
    },
    getOne: async (id: string): Promise<Sale> => {
        const res = await api.get<ApiResponse<Sale>>(`/sales/${id}`);
        return res.data?.data!;
    }
};
