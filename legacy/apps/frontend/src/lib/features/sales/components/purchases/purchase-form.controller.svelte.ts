import { PurchaseService } from "./purchase.service";
import { ProductsService } from "$lib/features/inventory/products/products.service";
import { CategoriesService } from "$lib/features/inventory/categories/categories.service";
import { SuppliersService } from "$lib/features/inventory/suppliers/suppliers.service";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";

export type PurchaseItemRow = {
    productId: string;
    categoryId?: string; // Row-level filter
    variant: string;
    qty: number;
    buyPrice: number;
    sellPrice: number;
    productName?: string;
    estimatedBuyPrice?: number; // Helpers for UI
    variants?: any[]; // Store fetched variants
};

export class PurchaseFormController {
    // Form State
    selectedSupplierId = $state("");
    referenceNumber = $state("");
    notes = $state("");
    date = $state(new Date().toISOString().slice(0, 16));
    items = $state<PurchaseItemRow[]>([]);

    // Loading State
    loading = $state(false);

    // Dependencies Data
    suppliers = $state<any[]>([]);
    products = $state<any[]>([]);
    categories = $state<any[]>([]);

    // Helper State
    supplierPrioritizedIds = $state<string[]>([]);
    categoryItems = $state<Record<string, any[]>>({});

    // New State for Flow
    supplierCategories = $state<any[]>([]); // Available categories for the supplier
    selectedCategoryIds = $state<string[]>([]); // User selected categories to input

    constructor() {
        // No default item, user must select category first
        this.generateInvoiceNumber();
    }

    // Computed
    totalAmount = $derived(
        this.items.reduce((sum, i) => sum + (i.qty || 0) * (i.buyPrice || 0), 0)
    );

    // Validation Errors (simplified)
    validationErrors = $derived(this.getValidationErrors());

    getValidationErrors() {
        const errors: string[] = [];
        try {
            if (!this.selectedSupplierId) errors.push("Supplier belum dipilih");
            // Reference number is now optional at creation (PO-based)

            const rows = this.items || [];
            if (rows.length === 0) {
                errors.push("Belum ada item yang ditambahkan");
            } else {
                if (rows.some(i => !i.productId)) errors.push("Ada item yang belum dipilih produknya");
                if (rows.some(i => (Number(i.qty) || 0) <= 0)) errors.push("Semua jumlah (Qty) harus > 0");
            }
        } catch (e) {
            console.error("Validation logic error", e);
        }
        return errors;
    }

    isValid = $derived(this.validationErrors.length === 0);

    // Filter Products per Category (Strict)
    getProducts(categoryId?: string) {
        if (!categoryId) return [];
        return this.products.filter(p => p.categoryId === categoryId);
    }

    // Get Items belonging to a specific category (for UI grouping)
    getItemsByCategory(categoryId: string) {
        return this.items.filter(i => i.categoryId === categoryId);
    }

    // Actions
    // generateInvoiceNumber removed - we now leave referenceNumber blank for the Manager to fill explicitly or during verification
    generateInvoiceNumber() {
        this.referenceNumber = "";
    }

    async loadDependencies() {
        try {
            const [s, p, c] = await Promise.all([
                SuppliersService.getAll(),
                ProductsService.getAll(),
                CategoriesService.getAll(),
            ]);
            this.suppliers = s;
            this.products = p;
            this.categories = c;
        } catch (e) {
            console.error("Failed to load dependencies", e);
            toast.error("Gagal memuat data awal");
        }
    }

    async loadPriorities(supplierId: string) {
        if (!supplierId) return;
        try {
            this.selectedSupplierId = supplierId;
            this.selectedCategoryIds = []; // Reset selected categories
            this.items = []; // Reset items

            // Fetch supplier specific categories
            let categories = await SuppliersService.getCategories(supplierId);

            // Fallback: If supplier has no specific categories, show all available categories
            if (categories.length === 0) {
                categories = this.categories;
            }

            this.supplierCategories = categories;
        } catch (e) {
            console.error("Failed to load priorities", e);
        }
    }

    toggleCategory(categoryId: string) {
        if (this.selectedCategoryIds.includes(categoryId)) {
            this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
            // Optional: Remove items for this category?
            this.items = this.items.filter(i => i.categoryId !== categoryId);
        } else {
            this.selectedCategoryIds = [...this.selectedCategoryIds, categoryId];
            // Auto-add first row for this category
            this.addItem(categoryId);
        }
    }

    addItem(categoryId: string) {
        this.items = [
            ...this.items,
            {
                productId: "",
                categoryId: categoryId,
                variant: "Original",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
    }

    removeItem(index: number) {
        // Allow removing even the last item, just deselect category if it was the last row of that category
        const itemToRemove = this.items[index];
        this.items = this.items.filter((_, i) => i !== index);

        // If no more items for this category, maybe we should deselect it? 
        // Let's keep it selected for now but the user can deselect manually.
    }

    async updateItemProduct(index: number, productId: string) {
        if (!this.items[index]) return;

        this.items[index].productId = productId;
        this.items[index].variant = ""; // Reset variant
        this.items[index].buyPrice = 0;
        this.items[index].sellPrice = 0;

        const p = this.products.find((x: any) => x.id === productId);
        if (p) {
            this.items[index].productName = p.name;

            // Allow manual "Original" if no variants exist later, but let's fetch for now
            try {
                // Fetch variants filtered by the selected supplier!
                const variants = await ProductsService.getVariants(productId, this.selectedSupplierId);
                this.items[index].variants = variants;
            } catch (e) {
                console.error("Failed to fetch variants", e);
                this.items[index].variants = [];
            }
        }
    }

    reset() {
        this.selectedSupplierId = "";
        this.selectedCategoryIds = [];
        this.supplierCategories = [];
        this.notes = "";
        this.date = new Date().toISOString().slice(0, 16);
        this.items = [];
        this.generateInvoiceNumber();
    }

    async submit() {
        if (!this.isValid) {
            console.warn("Validation failed:", this.validationErrors);
            toast.error(`Validasi gagal: ${this.validationErrors.join(", ")}`);
            return;
        }

        this.loading = true;
        try {
            const payload = {
                supplierId: this.selectedSupplierId,
                notes: this.notes,
                date: new Date(this.date), // Ensure date is sent
                referenceNumber: this.referenceNumber,
                items: this.items.map((i) => ({
                    productId: i.productId,
                    variant: i.variant,
                    qtyOrdered: Number(i.qty),
                    estimatedBuyPrice: Number(i.buyPrice),
                    targetSellPrice: Number(i.sellPrice),
                })),
            };

            await PurchaseService.create(payload);
            toast.success("Pembelian berhasil disimpan!");
            this.reset();
            return true;
        } catch (e: any) {
            console.error("Submit error details:", e);
            const errorMsg = e.response?.data?.errors?.[0] || e.message || "Gagal menyimpan pembelian";
            toast.error(`Gagal menyimpan pembelian: ${errorMsg}`);
        } finally {
            this.loading = false;
        }
    }
}
