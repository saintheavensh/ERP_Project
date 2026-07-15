import { api } from "$lib/shared/lib/api-client";

export class LiabilitiesService {
    static async getSummary() {
        const res = await api.get("/accounting/liabilities/summary");
        return res.data.data;
    }

    static async getSupplierDebts() {
        const res = await api.get("/accounting/liabilities/suppliers");
        return res.data.data;
    }

    static async getExpenseDebts() {
        const res = await api.get("/accounting/liabilities/expenses");
        return res.data.data;
    }

    static async getCommissionDebts(period?: string) {
        let url = "/accounting/liabilities/commissions";
        if (period) url += `?period=${period}`;
        const res = await api.get(url);
        return res.data.data;
    }

    // Payment methods rely on existing services usually, but we might add helper here if needed.
    // Purchase Payment -> SupplierPaymentService
    // Commission Payment -> CommissionPaymentService
    // Expense Payment -> OperationalCostsService directly?

    static async payExpense(id: string, payload: { sourceAccountId: string; expenseAccountId: string; date?: Date; notes?: string }) {
        // OperationalCostsService on backend handles markAsPaid via which endpoint?
        // I haven't created an endpoint for `markAsPaid` yet!
        // I updated `OperationalCostsService` but didn't expose it in a controller.
        // I need to add that to `LiabilitiesController` or `CashRegisterController` (register expense)?
        // Or create a new endpoint in `LiabilitiesController`.

        // Let's assume I will add `POST /accounting/liabilities/expenses/:id/pay` to LiabilitiesController.
        const res = await api.post(`/accounting/liabilities/expenses/${id}/pay`, payload);
        return res.data.data;
    }
}
