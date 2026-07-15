import { api } from "$lib/shared/lib/api-client";
import type { ApiResponse } from "@repo/shared";

export interface OperationalCost {
    id: number;
    category: string;
    amount: number;
    date: string | Date;
    description?: string;
    userId?: string;
    createdAt?: string;
}

export class OperationalCostsService {
    static async getAll() {
        const res = await api.get<ApiResponse<OperationalCost[]>>("/operational-costs");
        return res.data.data || [];
    }
    static async create(data: Partial<OperationalCost>) {
        const res = await api.post<ApiResponse<OperationalCost>>("/operational-costs", data);
        return res.data.data;
    }
    static async delete(id: number) {
        const res = await api.delete<ApiResponse<any>>(`/operational-costs/${id}`);
        return res.data.data;
    }
}
