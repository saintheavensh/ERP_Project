import { api } from '$lib/shared/lib/api-client';
import type { ApiResponse } from "@repo/shared";
import type { Approval, ApprovalStats, UpdateApprovalDTO, ApprovalType, ApprovalStatus } from '../types/approvals.types';

class ApprovalsService {
    async getPendingApprovals(): Promise<Approval[]> {
        const response = await api.get<ApiResponse<Approval[]>>('/approvals/pending');
        return response.data.data!;
    }

    async getApprovalHistory(params?: { type?: ApprovalType | 'ALL'; status?: ApprovalStatus }): Promise<Approval[]> {
        const queryParams = { ...params };
        if (queryParams.type === 'ALL') delete queryParams.type;
        const response = await api.get<ApiResponse<Approval[]>>('/approvals/history', { params: queryParams });
        return response.data.data!;
    }

    async getApprovalStats(): Promise<ApprovalStats> {
        const response = await api.get<ApiResponse<ApprovalStats>>('/approvals/stats');
        return response.data.data!;
    }

    async getApprovalDetail(id: string): Promise<Approval> {
        const response = await api.get<ApiResponse<Approval>>(`/approvals/${id}`);
        return response.data.data!;
    }

    async approve(id: string, notes?: string): Promise<Approval> {
        const response = await api.post<ApiResponse<Approval>>(`/approvals/${id}/approve`, { notes });
        return response.data.data!;
    }

    async reject(id: string, reason: string): Promise<Approval> {
        const response = await api.post<ApiResponse<Approval>>(`/approvals/${id}/reject`, { reason });
        return response.data.data!;
    }
}

export const approvalsService = new ApprovalsService();
