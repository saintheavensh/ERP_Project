import { toast } from "svelte-sonner";
import { formatCurrency } from "$lib/shared/lib/utils";
import type { PaymentMethod } from "$lib/features/finance/shared/payment.service";
import type { PaymentItem } from "./sales.controller.svelte";
import type { CartManager } from "./cart.model.svelte";
import { CashRegisterService } from "$lib/features/accounting/services/cash-register.service";

export class PaymentManager {
    cart: CartManager;

    selectedCustomerId = $state("");
    customerOpen = $state(false);
    customerNameManual = $state("Walk-in Consumen");
    notes = $state("");
    availableMethods = $state<PaymentMethod[]>([]);
    payments = $state<PaymentItem[]>([]);
    paymentOpen = $state(false);

    approvalId = $state("");
    showApprovalModal = $state(false);
    pendingApprovalData = $state<any>(null);

    constructor(cart: CartManager) {
        this.cart = cart;
    }

    getSelectedMethod(methodId: string) {
        return this.availableMethods.find((m) => m.id === methodId);
    }

    get transactionFees() {
        return this.payments.reduce((sum, p) => {
            const method = this.getSelectedMethod(p.methodId);
            if (!method?.feeConfig?.enabled || !p.amount) return sum;

            const { type, value } = method.feeConfig;
            if (type === "percent") {
                return sum + p.amount * (value / 100);
            } else {
                return sum + value;
            }
        }, 0);
    }

    get finalTotal() {
        return this.cart.totalWithTax + this.transactionFees;
    }

    get totalPaid() {
        return this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    get change() {
        return Math.max(0, this.totalPaid - this.finalTotal);
    }

    get remaining() {
        return Math.max(0, this.finalTotal - this.totalPaid);
    }

    resetForm() {
        this.selectedCustomerId = "";
        this.customerNameManual = "Walk-in Consumen";
        this.notes = "";
        this.cart.discountAmount = 0;
        this.approvalId = "";
        const defaultMethod =
            this.availableMethods.find((m) => m.type === "cash") ||
            this.availableMethods[0];

        if (defaultMethod) {
            this.payments = [{ methodId: defaultMethod.id, amount: 0 }];
        } else if (this.availableMethods.length > 0) {
            this.payments = [{ methodId: this.availableMethods[0].id, amount: 0 }];
        }
    }

    async openCheckout() {
        try {
            const status = await CashRegisterService.getStatus();
            if (!status.isOpen) {
                toast.error("Register Closed. Please open a session in Kasir Dashboard first.");
                return;
            }
        } catch (e) {
            console.error("Failed to check register status", e);
            toast.error("System Offline: Cannot verify register status");
            return;
        }

        const defaultMethod =
            this.availableMethods.find((m) => m.type === "cash") ||
            this.availableMethods[0];

        this.payments = [
            { methodId: defaultMethod?.id || "", amount: this.cart.totalWithTax },
        ];
        this.paymentOpen = true;
    }

    addPaymentRow() {
        const defaultMethod =
            this.availableMethods.find((m) => m.type === "cash") ||
            this.availableMethods[0];
        this.payments = [
            ...this.payments,
            { methodId: defaultMethod?.id || "", amount: 0 },
        ];
    }

    removePaymentRow(index: number) {
        if (this.payments.length > 1) {
            this.payments = this.payments.filter((_, i) => i !== index);
        }
    }

    handleMethodChange(index: number, newMethodId: string) {
        const method = this.getSelectedMethod(newMethodId);

        if (index === 0 && method?.type === "cash") {
            this.payments = [{ methodId: newMethodId, amount: this.payments[0].amount }];
            return;
        }

        this.payments[index].methodId = newMethodId;
        this.payments[index].variantId = undefined;
    }

    handleVariantChange(index: number, newVariantId: string) {
        this.payments[index].variantId = newVariantId;
    }

    validate(): boolean {
        if (this.cart.items.length === 0) return false;

        if (this.remaining > 0) {
            const hasTempo = this.payments.some((p) => {
                const m = this.getSelectedMethod(p.methodId);
                return (
                    m?.type === "custom" &&
                    (m.name.toLowerCase().includes("tempo") ||
                        m.id === "PM-TEMPO")
                );
            });

            if (!hasTempo) {
                toast.error(`Pembayaran kurang ${formatCurrency(this.remaining)}`);
                return false;
            }
        }

        for (const p of this.payments) {
            const method = this.getSelectedMethod(p.methodId);
            if (method?.type === "transfer" && !p.variantId) {
                toast.error("Mohon pilih Bank untuk metode Transfer");
                return false;
            }
        }

        return true;
    }
}
