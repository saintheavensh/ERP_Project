import { api } from "$lib/shared/lib/api-client";

export type PaymentMethod = {
    id: string;
    name: string;
    type: "cash" | "transfer" | "qris" | "debit" | "credit" | "other" | "custom";
    isDefault: boolean;
    isActive: boolean;
    icon?: string;
    accountNumber?: string;
    accountHolder?: string;
    accountId?: string; // Links to accounting account
    requiresProof?: boolean;
    variants?: PaymentMethodVariant[];
    feeConfig?: {
        enabled: boolean;
        type: "percent" | "fixed";
        value: number;
    };
};

export type PaymentMethodVariant = {
    id: string;
    name: string; // e.g. "BCA", "Mandiri" for type transfer
    accountNumber?: string;
    accountHolder?: string;
    accountId?: string;
    isDefault?: boolean;
};

export class PaymentService {
    static async getAll(): Promise<PaymentMethod[]> {
        const response = await api.get<PaymentMethod[]>("payments/methods");
        return (response.data as any).data;
    }

    static async getEnabledMethods(): Promise<PaymentMethod[]> {
        const response = await api.get<PaymentMethod[]>("payments/methods?enabled=true");
        return (response.data as any).data;
    }

    static async create(data: Partial<PaymentMethod>): Promise<PaymentMethod> {
        const response = await api.post<PaymentMethod>("payments/methods", data);
        return (response.data as any).data;
    }

    static async update(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
        const response = await api.put<PaymentMethod>(`payments/methods/${id}`, data);
        return (response.data as any).data;
    }

    static async delete(id: string): Promise<void> {
        await api.delete(`payments/methods/${id}`);
    }

    static async setDefault(id: string): Promise<PaymentMethod> {
        const response = await api.post<PaymentMethod>(`payments/methods/${id}/default`, {});
        return (response.data as any).data;
    }
}
