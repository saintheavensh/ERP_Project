import { api } from "$lib/shared/lib/api-client";
import type { Customer, Sale, ApiResponse } from "@repo/shared";

/** Input type for creating a customer */
type CreateCustomerInput = Pick<Customer, "name" | "phone"> & Partial<Pick<Customer, "email" | "address" | "creditLimit" | "discountPercent" | "image">>;

/** Input type for updating a customer */
type UpdateCustomerInput = Partial<CreateCustomerInput>;

export const CustomersService = {
    async getAll(query?: string): Promise<Customer[]> {
        const response = await api.get<ApiResponse<Customer[]>>("/customers", {
            params: { q: query }
        });
        return response.data.data ?? [];
    },

    async getById(id: string): Promise<Customer> {
        const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
        return response.data.data!;
    },

    async create(data: CreateCustomerInput): Promise<Customer> {
        const response = await api.post<ApiResponse<Customer>>("/customers", data);
        return response.data.data!;
    },

    async update(id: string, data: UpdateCustomerInput): Promise<Customer> {
        const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
        return response.data.data!;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/customers/${id}`);
    },

    async payDebt(id: string, amount: number, method: "cash" | "transfer" | "qris" = "cash", notes?: string, saleId?: string, proofImage?: string): Promise<Customer> {
        const response = await api.post<ApiResponse<Customer>>(`/customers/${id}/payment`, {
            amount, method, notes, saleId, proofImage
        });
        return response.data.data!;
    },

    async getSales(id: string): Promise<Sale[]> {
        const response = await api.get<ApiResponse<Sale[]>>(`/customers/${id}/sales`);
        return response.data.data ?? [];
    },

    async getUnpaidSales(id: string): Promise<Sale[]> {
        const response = await api.get<ApiResponse<Sale[]>>(`/customers/${id}/unpaid-sales`);
        return response.data.data ?? [];
    },

    async uploadProof(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post<ApiResponse<{ url: string }>>("/uploads", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data.data!.url;
    }
};
