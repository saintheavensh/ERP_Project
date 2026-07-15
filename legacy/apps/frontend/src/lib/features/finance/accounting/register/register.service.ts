import { api } from "$lib/shared/lib/api-client";

export class RegisterService {
    static async getStatus() {
        const response = await api.get("/accounting/register/status");
        return response.data.data;
    }

    static async open(data: any) {
        const response = await api.post("/accounting/register/open", data);
        return response.data.data;
    }

    static async close(data: any) {
        const response = await api.post("/accounting/register/close", data);
        return response.data.data;
    }
}
