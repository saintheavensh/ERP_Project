import { LiabilitiesService } from "$lib/features/accounting/services/liabilities.service";
import { toast } from "svelte-sonner";
import { api } from "$lib/shared/lib/api-client";

export class LiabilitiesController {
    summary: any = null;
    supplierDebts: any[] = [];
    expenseDebts: any[] = [];
    commissionDebts: any[] = [];
    loading = false;
    error: string | null = null;

    // Filters
    period = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Payment Dialog State
    showPayDialog = false;
    selectedDebt: any = null;
    debtType: "supplier" | "expense" | "commission" = "supplier";

    payAmount = 0;
    payMethod = "cash";
    payReference = "";
    payNotes = "";
    sourceAccountId = "1-1001"; // Default Cash
    isProcessing = false;

    async init() {
        this.loading = true;
        try {
            await Promise.all([
                this.loadSummary(),
                this.loadSupplierDebts(),
                this.loadExpenseDebts(),
                this.loadCommissionDebts()
            ]);
        } catch (e: any) {
            this.error = e.message;
            toast.error("Gagal memuat data liabilities");
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    async loadSummary() {
        try {
            const res = await LiabilitiesService.getSummary();
            this.summary = res.summary;
        } catch (e) { console.error("Summary error", e); }
    }

    async loadSupplierDebts() {
        this.supplierDebts = await LiabilitiesService.getSupplierDebts();
    }

    async loadExpenseDebts() {
        this.expenseDebts = await LiabilitiesService.getExpenseDebts();
    }

    async loadCommissionDebts() {
        this.commissionDebts = await LiabilitiesService.getCommissionDebts(this.period);
    }

    openPayDialog(item: any, type: "supplier" | "expense" | "commission") {
        this.selectedDebt = item;
        this.debtType = type;

        if (type === "supplier") {
            this.payAmount = item.remainingAmount;
        } else if (type === "expense") {
            this.payAmount = item.amount;
        } else if (type === "commission") {
            this.payAmount = item.totalAmount;
        }

        this.payMethod = "cash";
        this.payReference = "";
        this.payNotes = "";
        this.showPayDialog = true;
    }

    async submitPayment() {
        if (!this.selectedDebt) return;
        this.isProcessing = true;
        try {
            if (this.debtType === "supplier") {
                await api.post("/accounting/payables/pay", {
                    purchaseId: this.selectedDebt.id,
                    amount: this.payAmount,
                    method: this.payMethod,
                    reference: this.payReference
                });
            } else if (this.debtType === "expense") {
                await LiabilitiesService.payExpense(this.selectedDebt.id, {
                    sourceAccountId: this.sourceAccountId,
                    expenseAccountId: "6-5000", // Default Operating Expense
                    date: new Date(),
                    notes: this.payNotes || `Payment for expense #${this.selectedDebt.id}`
                });
            } else if (this.debtType === "commission") {
                await api.post("/accounting/commissions/pay", {
                    technicianId: this.selectedDebt.technicianId,
                    period: this.period,
                    serviceIds: (this.selectedDebt.services || []).map((s: any) => s.id),
                    amount: this.payAmount
                });
            }

            toast.success("Pembayaran berhasil");
            this.showPayDialog = false;
            await this.init();
        } catch (e: any) {
            toast.error(e.message || "Pembayaran gagal");
        } finally {
            this.isProcessing = false;
        }
    }

    formatRp(amount: number) {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    }

    formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    }
}
