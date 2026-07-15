import { api } from "$lib/shared/lib/api-client";

export class PayablesService {
    static async getAll() {
        const response = await api.get("/accounting/payables");
        return response.data.data;
    }

    static async getById(id: string) {
        const response = await api.get(`/accounting/payables/${id}`);
        return response.data.data;
    }

    static async recordPayment(id: string, data: any) {
        const response = await api.post(`/accounting/payables/${id}/payments`, data);
        return response.data.data;
    }
}
