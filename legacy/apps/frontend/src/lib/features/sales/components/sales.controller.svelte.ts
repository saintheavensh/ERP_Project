import { ProductsService } from "$lib/features/inventory/products/products.service";
import { CategoriesService } from "$lib/features/inventory/categories/categories.service";
import { SalesService } from "$lib/features/sales/components/sales.service";
import { CustomersService } from "$lib/features/sales/components/customers/customers.service";
import { PaymentService, type PaymentMethod } from "$lib/features/finance/shared/payment.service";
import { SettingsService } from "$lib/features/settings/settings.service";
import { formatCurrency } from "$lib/shared/lib/utils";
import { toast } from "svelte-sonner";
import { authStore } from "$lib/shared/lib/auth-store.svelte";
import { CartManager } from "./cart.model.svelte";
import { PaymentManager } from "./payment.model.svelte";
import { ProductManager } from "./product.model.svelte";

export type CartItem = {
    uniqueId: string;
    productId: string;
    name: string;
    variant: string;
    price: number;
    qty: number;
    maxQty: number;
    code?: string;
};

export type PaymentItem = {
    methodId: string;
    variantId?: string;
    amount: number;
    reference?: string;
};

export class SalesController {
    // Sub-systems
    private _cart = new CartManager();
    private _payment = new PaymentManager(this._cart);
    private _productM = new ProductManager();

    // Map state to preserve exact UI binding compatibility
    get cart() { return this._cart.items; }
    set cart(v) { this._cart.items = v; }

    get taxSettings() { return this._cart.taxSettings; }
    set taxSettings(v) { this._cart.taxSettings = v; }

    get discountAmount() { return this._cart.discountAmount; }
    set discountAmount(v) { this._cart.discountAmount = v; }

    get products() { return this._productM.products; }
    set products(v) { this._productM.products = v; }

    get searchTerm() { return this._productM.searchTerm; }
    set searchTerm(v) { this._productM.searchTerm = v; }

    get selectedCategory() { return this._productM.selectedCategory; }
    set selectedCategory(v) { this._productM.selectedCategory = v; }

    get selectedCustomerId() { return this._payment.selectedCustomerId; }
    set selectedCustomerId(v) { this._payment.selectedCustomerId = v; }

    get customerOpen() { return this._payment.customerOpen; }
    set customerOpen(v) { this._payment.customerOpen = v; }

    get customerNameManual() { return this._payment.customerNameManual; }
    set customerNameManual(v) { this._payment.customerNameManual = v; }

    get notes() { return this._payment.notes; }
    set notes(v) { this._payment.notes = v; }

    get availableMethods() { return this._payment.availableMethods; }
    set availableMethods(v) { this._payment.availableMethods = v; }

    get payments() { return this._payment.payments; }
    set payments(v) { this._payment.payments = v; }

    get paymentOpen() { return this._payment.paymentOpen; }
    set paymentOpen(v) { this._payment.paymentOpen = v; }

    get approvalId() { return this._payment.approvalId; }
    set approvalId(v) { this._payment.approvalId = v; }

    get showApprovalModal() { return this._payment.showApprovalModal; }
    set showApprovalModal(v) { this._payment.showApprovalModal = v; }

    get pendingApprovalData() { return this._payment.pendingApprovalData; }
    set pendingApprovalData(v) { this._payment.pendingApprovalData = v; }

    // Direct state
    categories = $state<any[]>([]);
    customers = $state<any[]>([]);
    loading = $state(false);

    constructor() { }

    async init() {
        await Promise.all([
            this.fetchProducts(),
            this.fetchCategories(),
            this.fetchCustomers(),
            this.fetchPaymentMethods(),
            this.fetchSettings()
        ]);
        this.resetPaymentForm();
    }

    async fetchProducts() {
        try {
            this.products = await ProductsService.getAll();
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast.error("Gagal memuat produk");
        }
    }

    async fetchCategories() {
        try {
            this.categories = await CategoriesService.getAll();
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }

    async fetchCustomers() {
        try {
            this.customers = await CustomersService.getAll();
        } catch (error) {
            console.error("Failed to fetch customers", error);
        }
    }

    async fetchPaymentMethods() {
        try {
            this.availableMethods = await PaymentService.getEnabledMethods();
        } catch (error) {
            console.error("Failed to fetch payment methods", error);
        }
    }

    async fetchSettings() {
        try {
            this.taxSettings = await SettingsService.getTaxSettings();
        } catch (error) {
            console.error("Failed to fetch tax settings", error);
        }
    }

    // Derived Logic mappings
    get processedProducts() { return this._productM.processedProducts; }
    get filteredProducts() { return this._productM.filteredProducts; }

    get customerOptions() {
        return this.customers.map((c: any) => ({
            value: c.id,
            label: `${c.name} (${c.phone})`,
        }));
    }

    get subtotal() { return this._cart.subtotal; }
    get taxAmount() { return this._cart.taxAmount; }
    get totalWithTax() { return this._cart.totalWithTax; }
    get transactionFees() { return this._payment.transactionFees; }
    get finalTotal() { return this._payment.finalTotal; }
    get totalAmount() { return this._cart.totalWithTax; }
    get totalPaid() { return this._payment.totalPaid; }
    get change() { return this._payment.change; }
    get remaining() { return this._payment.remaining; }

    // Actions mappings
    getSelectedMethod(methodId: string) { return this._payment.getSelectedMethod(methodId); }
    addToCart(product: any, variant: any) { this._cart.addToCart(product, variant); }
    removeFromCart(index: number) { this._cart.removeFromCart(index); }
    updateQty(index: number, delta: number) { this._cart.updateQty(index, delta); }

    resetPaymentForm() { this._payment.resetForm(); }
    async openCheckout() { return this._payment.openCheckout(); }
    addPaymentRow() { this._payment.addPaymentRow(); }
    removePaymentRow(index: number) { this._payment.removePaymentRow(index); }
    handleMethodChange(index: number, newMethodId: string) { this._payment.handleMethodChange(index, newMethodId); }
    handleVariantChange(index: number, newVariantId: string) { this._payment.handleVariantChange(index, newVariantId); }

    async processCheckout() {
        if (!this._payment.validate()) return;

        const selectedCustomer = this.customers.find(
            (c: any) => c.id === this.selectedCustomerId,
        );
        const name = selectedCustomer
            ? selectedCustomer.name
            : this.customerNameManual || "Walk-in Consumen";

        const payload = {
            memberId: this.selectedCustomerId || undefined,
            customerName: name,
            payments: this.payments.map((p) => {
                const method = this.getSelectedMethod(p.methodId);
                const variant = method?.variants?.find(
                    (v) => v.id === p.variantId,
                );
                return {
                    methodId: p.methodId,
                    method: method?.name || "Unknown",
                    variantId: p.variantId,
                    variantName: variant?.name,
                    amount: p.amount,
                    reference: p.reference,
                };
            }),
            userId: authStore.user?.id || "USR-ADMIN", // Use real user ID
            notes: this.notes,
            discountAmount: this.discountAmount,
            approvalId: this.approvalId || undefined,
            items: this.cart.map((c) => ({
                productId: c.productId,
                variant: c.variant,
                qty: c.qty,
                price: c.price,
            })),
            // New Fields for Tax & Fees
            subtotal: this.subtotal,
            tax: this.taxAmount,
            taxRate: 0,
            taxInclusive: this.taxSettings.inclusive,
            serviceFee: this.transactionFees,
        };

        if (this.taxSettings.enabled) {
            payload.taxRate = this.taxSettings.rate;
        }

        try {
            this.loading = true;
            const data = await SalesService.create(payload);

            // Success handling
            await this.fetchProducts(); // Refresh products (stock)
            if (this.selectedCustomerId) await this.fetchCustomers(); // Refresh customers (debt)

            toast.success("Transaksi Berhasil! ID: " + data.id);
            if (data.change > 0) {
                toast.info(`Kembalian: ${formatCurrency(data.change)}`, {
                    duration: 10000,
                });
            }
            this._cart.clear();
            this.paymentOpen = false;
            this.resetPaymentForm();
        } catch (e: any) {
            const extra = e.response?.data?.extra;
            if (extra?.type === 'APPROVAL_REQUIRED') {
                this.pendingApprovalData = extra;
                this.showApprovalModal = true;
                toast.warning("Discount level requires manager approval");
            } else {
                toast.error("Gagal: " + (e.response?.data?.message || e.message));
            }
        } finally {
            this.loading = false;
        }
    }
}
