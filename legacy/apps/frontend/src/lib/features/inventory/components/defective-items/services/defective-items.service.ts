import { api } from '$lib/shared/lib/api-client';
import type { ApiResponse } from '@repo/shared';
import type { CreateDefectiveItemDTO, DefectiveItem, DefectiveItemPaginationParams } from '../types/defective-items.types';

export const defectiveItemsService = {
    // We map to the distinct endpoints from backend
    getPendingItems: async (params?: DefectiveItemPaginationParams): Promise<DefectiveItem[]> => {
        // Backend doesn't seem to support pagination natively on these endpoints yet, but we'll pass params
        const response = await api.get<ApiResponse<DefectiveItem[]>>('/defective-items/pending', { params });
        return response.data.data || [];
    },

    getProcessedItems: async (params?: DefectiveItemPaginationParams): Promise<DefectiveItem[]> => {
        const response = await api.get<ApiResponse<DefectiveItem[]>>('/defective-items/processed', { params });
        return response.data.data || [];
    },

    createItem: async (data: CreateDefectiveItemDTO): Promise<{ id: string }> => {
        const response = await api.post<ApiResponse<{ id: string }>>('/defective-items', data);
        return response.data.data || { id: '' };
    },

    processReturn: async (id: string, notes?: string): Promise<any> => {
        // Backend takes an array of ids in a single request: { itemIds: string[] }
        const response = await api.post<ApiResponse<any>>(`/defective-items/process-return`, { itemIds: [id], notes });
        return response.data.data;
    },

    // Helper to process multiple returns at once
    processMultipleReturns: async (ids: string[], notes?: string): Promise<any> => {
        const response = await api.post<ApiResponse<any>>(`/defective-items/process-return`, { itemIds: ids, notes });
        return response.data.data;
    }
};
