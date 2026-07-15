import { api } from "$lib/shared/lib/api-client";

export class AssetsService {
    static async getAll() {
        const response = await api.get("/accounting/assets");
        return response.data.data;
    }

    static async create(data: any) {
        const response = await api.post("/accounting/assets", data);
        return response.data.data;
    }

    static async update(id: string, data: any) {
        const response = await api.patch(`/accounting/assets/${id}`, data);
        return response.data.data;
    }

    static async delete(id: string) {
        const response = await api.delete(`/accounting/assets/${id}`);
        return response.data.data;
    }

    static async processDepreciation(period: string) {
        const response = await api.post(
            "/accounting/assets/depreciation/process-all",
            { period }
        );
        return response.data.data;
    }
}
