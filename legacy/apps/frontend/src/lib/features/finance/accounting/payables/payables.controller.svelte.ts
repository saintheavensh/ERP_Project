import { PayablesService } from "./payables.service";
import { api } from "$lib/shared/lib/api-client";

export class PayablesController {
    loading = $state(true);
    payables = $state<any[]>([]);
    selectedPayable = $state<any | null>(null);
    processingPayment = $state(false);

    showPayDialog = $state(false);
    payAmount = $state(0);
    payMethod = $state("cash");
    payReference = $state("");
    summary = $state<any>(null);

    async init() {
        await this.fetchPayables();
    }

    async fetchPayables() {
        try {
            this.loading = true;
            const [payablesRes, summaryRes] = await Promise.all([
                PayablesService.getAll(),
                api.get("/accounting/payables/summary")
            ]);
            this.payables = payablesRes;
            this.summary = summaryRes.data.data;
        } catch (e) {
            console.error("Failed to fetch payables data", e);
        } finally {
            this.loading = false;
        }
    }

    openPayDialog(item: any) {
        this.selectedPayable = item;
        this.payAmount = item.outstanding;
        this.payMethod = "cash";
        this.payReference = "";
        this.showPayDialog = true;
    }

    async submitPayment() {
        if (!this.selectedPayable) return;

        try {
            await this.handlePayment(
                this.selectedPayable.id,
                this.payAmount,
                "1-1001", // Default to Cash temporarily, need to support selectable account if needed
                this.payReference
            );
            this.showPayDialog = false;
        } catch (e) {
            // Error handled in handlePayment
        }
    }

    async viewPayable(id: string) {
        if (this.selectedPayable?.id === id) {
            this.selectedPayable = null;
            return;
        }

        try {
            this.selectedPayable = await PayablesService.getById(id);
        } catch (e) {
            console.error("Failed to fetch payable details", e);
        }
    }

    async handlePayment(id: string, amount: number, accountId: string, notes: string) {
        try {
            this.processingPayment = true;
            await PayablesService.recordPayment(id, { amount, accountId, notes });
            await this.fetchPayables();
            if (this.selectedPayable?.id === id) {
                await this.viewPayable(id);
            }
        } catch (e) {
            console.error("Failed to record payment", e);
            throw e;
        } finally {
            this.processingPayment = false;
        }
    }
}
