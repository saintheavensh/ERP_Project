import { api } from "$lib/shared/lib/api-client";
import type { ApiResponse } from "@repo/shared";
import type {
    ServiceTool,
    ServiceToolRequest,
    CreateServiceToolDTO,
    UpdateServiceToolDTO,
    CreateToolRequestDTO,
    ToolCondition,
    RequestStatus
} from "../types/service-tools.types";

export class ServiceToolsAPI {
    // Tools CRUD
    static async getAll(): Promise<ServiceTool[]> {
        const response = await api.get<ApiResponse<ServiceTool[]>>("/service-tools");
        return response.data.data!;
    }

    static async getMyTools(): Promise<ServiceTool[]> {
        const response = await api.get<ApiResponse<ServiceTool[]>>("/service-tools/my");
        return response.data.data!;
    }

    static async create(data: CreateServiceToolDTO): Promise<ServiceTool> {
        const response = await api.post<ApiResponse<ServiceTool>>("/service-tools", data);
        return response.data.data!;
    }

    static async update(id: string, data: UpdateServiceToolDTO): Promise<void> {
        await api.put(`/service-tools/${id}`, data);
    }

    static async updateCondition(id: string, condition: ToolCondition): Promise<void> {
        await api.patch(`/service-tools/${id}/condition`, { condition });
    }

    static async delete(id: string): Promise<void> {
        await api.delete(`/service-tools/${id}`);
    }

    // Requests
    static async createRequest(data: CreateToolRequestDTO): Promise<ServiceToolRequest> {
        const response = await api.post<ApiResponse<ServiceToolRequest>>("/service-tools/requests", data);
        return response.data.data!;
    }

    static async getMyRequests(): Promise<ServiceToolRequest[]> {
        const response = await api.get<ApiResponse<ServiceToolRequest[]>>("/service-tools/requests/my");
        return response.data.data!;
    }

    static async getAllRequests(): Promise<ServiceToolRequest[]> {
        const response = await api.get<ApiResponse<ServiceToolRequest[]>>("/service-tools/requests");
        return response.data.data!;
    }

    static async updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
        await api.patch(`/service-tools/requests/${id}/status`, { status });
    }
}
