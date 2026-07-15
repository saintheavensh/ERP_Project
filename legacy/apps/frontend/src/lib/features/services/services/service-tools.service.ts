import { api } from "$lib/shared/lib/api-client";
import type { ApiResponse } from "@repo/shared";

export interface ServiceTool {
    id: string;
    name: string;
    brand?: string;
    qty: number;
    condition: "good" | "damaged" | "lost";
    purchaseDate?: string;
    price?: number;
    notes?: string;
    createdAt?: string;
}

export interface ServiceToolRequest {
    id: string;
    userId: string;
    toolName: string;
    justification: string;
    status: "pending" | "approved" | "rejected";
    createdAt?: string;
}

export class ServiceToolsService {
    static async getAll() {
        const res = await api.get<ApiResponse<ServiceTool[]>>("/service-tools");
        return res.data.data || [];
    }
    static async getMyTools() {
        const res = await api.get<ApiResponse<ServiceTool[]>>("/service-tools/my");
        return res.data.data || [];
    }
    static async create(data: Partial<ServiceTool>) {
        const res = await api.post<ApiResponse<ServiceTool>>("/service-tools", data);
        return res.data.data;
    }
    static async update(id: string, data: Partial<ServiceTool>) {
        const res = await api.put<ApiResponse<ServiceTool>>(`/service-tools/${id}`, data);
        return res.data.data;
    }
    static async updateCondition(id: string, condition: "good" | "damaged" | "lost") {
        const res = await api.patch<ApiResponse<ServiceTool>>(`/service-tools/${id}/condition`, { condition });
        return res.data.data;
    }
    static async delete(id: string) {
        const res = await api.delete<ApiResponse<any>>(`/service-tools/${id}`);
        return res.data.data;
    }

    // Requests
    static async createRequest(data: { toolName: string; justification: string }) {
        const res = await api.post<ApiResponse<ServiceToolRequest>>("/service-tools/requests", data);
        return res.data.data;
    }
    static async getMyRequests() {
        const res = await api.get<ApiResponse<ServiceToolRequest[]>>("/service-tools/requests/my");
        return res.data.data || [];
    }
}
