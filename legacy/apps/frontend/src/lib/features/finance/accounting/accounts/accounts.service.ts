import { api } from "$lib/shared/lib/api-client";

export class AccountsService {
    static async getAll() {
        const response = await api.get("/accounting/accounts");
        return response.data.data;
    }

    static async getTree() {
        const response = await api.get("/accounting/accounts/tree");
        return response.data.data;
    }

    static async getTypes() {
        const response = await api.get("/accounting/accounts/types");
        return response.data.data;
    }

    static async create(data: any) {
        const response = await api.post("/accounting/accounts", data);
        return response.data.data;
    }

    static async transfer(data: any) {
        const response = await api.post("/accounting/accounts/transfer", data);
        return response.data.data;
    }

    static async setOpeningBalance(id: string, amount: number) {
        const response = await api.post(`/accounting/accounts/${id}/opening-balance`, { amount });
        return response.data.data;
    }

    static async update(id: string, data: any) {
        const response = await api.patch(`/accounting/accounts/${id}`, data);
        return response.data.data;
    }

    static async delete(id: string) {
        const response = await api.delete(`/accounting/accounts/${id}`);
        return response.data.data;
    }
}
