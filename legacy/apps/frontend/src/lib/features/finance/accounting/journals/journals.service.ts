import { api } from "$lib/shared/lib/api-client";

export class JournalsService {
    static async getAll() {
        const response = await api.get("/accounting/journals");
        return response.data.data;
    }

    static async getById(id: string) {
        const response = await api.get(`/accounting/journals/${id}`);
        return response.data.data;
    }
}
