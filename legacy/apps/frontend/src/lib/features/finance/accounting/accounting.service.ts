import { api } from "$lib/shared/lib/api-client";

export class AccountingService {
    static async getDashboard() {
        const response = await api.get("/accounting/dashboard");
        return response.data.data;
    }
}
