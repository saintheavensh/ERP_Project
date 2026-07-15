import { api } from "$lib/shared/lib/api-client";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { authStore } from "$lib/shared/lib/auth-store.svelte";

export class PurchaseDetailController {
    id: string;
    purchase = $state<any>(null);
    loading = $state(true);
    error = $state("");

    // Edit State
    isEditing = $state(false);
    editItems = $state<any[]>([]);
    isSubmitting = $state(false);
    isCancelling = $state(false);

    // Verification / Pricing state
    shippingFee = $state(0);
    shippingExpenseAccountId = $state(""); // New: Expense Account for Shipping
    discountAmount = $state(0);
    paymentMethod = $state("transfer");
    amountPaid = $state(0);
    paymentAccountId = $state("");
    paymentProofImage = $state<File | null>(null); // New: Proof Layout
    paymentDueDate = $state<string>(""); // New: Due Date for Debt
    referenceNumber = $state(""); // New: Invoice Number from Supplier

    constructor(id: string) {
        this.id = id;
    }

    get role() {
        return authStore.role;
    }

    // Account Options
    expenseAccounts = $state<any[]>([]);
    paymentAccounts = $state<any[]>([]);

    async load() {
        this.loading = true;
        this.error = "";
        try {
            const [res, expensesRes, assetsRes] = await Promise.all([
                api.get(`/purchases/${this.id}`),
                api.get("/accounting/accounts?typeId=EXPENSE"),
                api.get("/accounting/accounts?typeId=ASSET")
            ]);

            this.purchase = res.data?.data || res.data;
            this.expenseAccounts = expensesRes.data || [];

            // Filter Assets for Cash/Bank (Simple filter based on code or name convention for now)
            // Or just show all Assets allow user to pick. 
            // Better: Filter for "Kas" or "Bank" in name or code starts with "1-1"
            const assets = assetsRes.data || [];
            this.paymentAccounts = assets.filter((a: any) =>
                a.name.toLowerCase().includes("kas") ||
                a.name.toLowerCase().includes("bank") ||
                a.code.startsWith("11") // Standard chart of accounts 11xx is Cash/Bank
            );

            // Initialize edit values
            if (this.purchase) {
                this.editItems = this.purchase.items.map((it: any) => ({
                    productId: it.productId,
                    variant: it.variant,
                    qtyReceived: it.qtyReceived || it.qtyOrdered,
                    buyPrice: it.buyPrice || it.estimatedBuyPrice || 0,
                    sellPrice: it.sellPrice || it.targetSellPrice || 0,
                }));
                this.referenceNumber = this.purchase.referenceNumber || "";
            }
        } catch (e: any) {
            console.error(e);
            this.error = "Gagal memuat detail pembelian";
            toast.error(this.error);
        } finally {
            this.loading = false;
        }
    }

    async handleReceive() {
        this.isSubmitting = true;
        try {
            await api.post(`/purchases/${this.id}/receive`, { items: this.editItems });
            toast.success("Barang berhasil diterima!");
            this.isEditing = false;
            // FIX: Redirect to list after receiving to prevent double submission
            goto("/warehouse/reception");
        } catch (e) {
            toast.error("Gagal memproses penerimaan");
        } finally {
            this.isSubmitting = false;
        }
    }

    async handleVerify() {
        if (this.amountPaid > 0 && !this.paymentMethod) {
            toast.error("Pilih metode pembayaran");
            return;
        }

        if (this.paymentMethod === 'transfer' && this.amountPaid > 0 && !this.paymentProofImage) {
            // Optional: Enforce proof for transfer? User said "Must be proof of transfer"
            // Let's warn but maybe allow if they really want? 
            // Logic: "must be proof of transfer in the form of a photo" -> Strict.
            toast.error("Bukti transfer wajib diupload untuk metode Transfer");
            return;
        }

        // Handle Image Upload if exists
        let proofImageUrl = null;
        if (this.paymentProofImage) {
            const formData = new FormData();
            formData.append("file", this.paymentProofImage);
            try {
                // Assuming generic upload endpoint exists or use specific
                const uploadRes = await api.post("/uploads", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                proofImageUrl = uploadRes.data.data.url; // Response wrapper might have data.url or data.data.url
            } catch (e) {
                toast.error("Gagal upload bukti transfer");
                return;
            }
        }

        if (this.isSubmitting) return;

        this.isSubmitting = true;
        try {
            const res = await api.post(`/purchases/${this.id}/verify`, {
                items: this.editItems,
                shippingFee: this.shippingFee,
                shippingExpenseAccountId: this.shippingExpenseAccountId, // Send ID
                discountAmount: this.discountAmount,
                referenceNumber: this.referenceNumber,
                paymentDueDate: this.paymentDueDate ? new Date(this.paymentDueDate) : null,
                payment: this.amountPaid > 0 ? {
                    method: this.paymentMethod,
                    amount: this.amountPaid,
                    accountId: this.paymentAccountId,
                    proofImage: proofImageUrl
                } : null
            });

            toast.success("PO berhasil diverifikasi dan stok diupdate!");
            this.isEditing = false;
            // Immediate redirect to detail instead of just reloading data
            // This prevents duplicate submissions and feels more professional
            goto(`/manager/purchases/${this.id}`).then(() => {
                location.reload(); // Hard reload to ensure all states are clean
            });
        } catch (e: any) {
            console.error("Verification Error:", e);
            const errorMsg = e.response?.data?.error || e.message || "Gagal memverifikasi PO";
            toast.error(`Error: ${errorMsg}`);
        } finally {
            this.isSubmitting = false;
        }
    }

    async handleCancel() {
        const reason = prompt("Masukkan alasan pembatalan:");
        if (reason === null) return; // User pressed Cancel

        this.isCancelling = true;
        try {
            await api.post(`/purchases/${this.id}/cancel`, { reason });
            toast.success("Purchase Order telah dibatalkan");
            await this.load();
        } catch (e: any) {
            console.error(e);
            toast.error(e.response?.data?.error || "Gagal membatalkan PO");
        } finally {
            this.isCancelling = false;
        }
    }

    async handleDelete() {
        if (!confirm("Apakah Anda yakin ingin menghapus data pembelian ini? Stok akan dikembalikan dan tidak dapat dibatalkan.")) {
            return;
        }
        try {
            await api.delete(`/purchases/${this.id}`);
            toast.success("Pembelian berhasil dihapus");
            goto("/manager/purchases");
        } catch (e) {
            console.error(e);
            toast.error("Gagal menghapus pembelian");
        }
    }

    async printLabel(item: any) {
        try {
            await api.post(`/inventory/print-label`, {
                productName: item.product?.name,
                variantName: item.variant,
                code: item.product?.code || item.productId,
                price: item.sellPrice || item.targetSellPrice,
            });
            toast.success("Label sedang diprint");
        } catch (e) {
            toast.error("Gagal print label");
        }
    }

    // Helpers
    getStatusColor(status: string) {
        switch (status) {
            case "ORDERED":
                return "bg-blue-500";
            case "RECEIVED":
                return "bg-amber-500";
            case "VERIFIED":
                return "bg-green-500";
            case "CANCELLED":
                return "bg-red-500";
            case "DRAFT":
                return "bg-slate-400";
            default:
                return "bg-slate-500";
        }
    }

    formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    formatRp(val: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    }

    get actualItemsTotal() {
        return this.editItems.reduce((sum, item) => {
            const poItem = this.purchase?.items.find((pi: any) => pi.productId === item.productId && pi.variant === (item.variant || null));
            const qty = poItem?.qtyReceived || 0;
            return sum + (qty * item.buyPrice);
        }, 0);
    }

    get grandTotal() {
        return this.actualItemsTotal + this.shippingFee - this.discountAmount;
    }
}
