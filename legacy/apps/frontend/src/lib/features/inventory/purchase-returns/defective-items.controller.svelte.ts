import { createQuery, useQueryClient, type CreateQueryResult } from "@tanstack/svelte-query";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { PurchaseReturnsService, type DefectiveItem } from "./purchase-returns.service";
import { authStore } from "$lib/shared/lib/auth-store.svelte";

/**
 * Controller for the Defective Items List component
 * Manages staging area for defective items before return processing
 */
export class DefectiveItemsController {
    private queryClient = useQueryClient();

    // Query
    query: CreateQueryResult<DefectiveItem[], Error>;

    // State
    selectedIds = $state<string[]>([]);

    constructor() {
        this.query = createQuery(() => ({
            queryKey: ["defective-items"],
            queryFn: () => PurchaseReturnsService.getDefectiveItems(),
        }));
    }

    // Derived values
    get items(): DefectiveItem[] {
        return this.query.data ?? [];
    }

    get isLoading(): boolean {
        return this.query.isLoading;
    }

    get isError(): boolean {
        return this.query.isError;
    }

    get errorMessage(): string {
        return this.query.error?.message ?? "";
    }

    get hasMixedSuppliers(): boolean {
        if (this.selectedIds.length === 0) return false;
        const selectedItems = this.items.filter((i) => this.selectedIds.includes(i.id));
        if (selectedItems.length === 0) return false;
        const firstSupplier = selectedItems[0].supplierId;
        return selectedItems.some((i) => i.supplierId !== firstSupplier);
    }

    get selectedCount(): number {
        return this.selectedIds.length;
    }

    /**
     * Toggle selection of an item
     */
    toggleSelect(id: string, checked: boolean): void {
        if (checked) {
            this.selectedIds = [...this.selectedIds, id];
        } else {
            this.selectedIds = this.selectedIds.filter((i) => i !== id);
        }
    }

    /**
     * Check if an item is selected
     */
    isSelected(id: string): boolean {
        return this.selectedIds.includes(id);
    }

    /**
     * Create purchase return from selected defective items
     */
    async handleCreateReturn(): Promise<void> {
        if (this.selectedIds.length === 0) return;

        try {
            const userId = authStore.user?.id ?? "unknown";

            const result = await PurchaseReturnsService.createReturn(userId, this.selectedIds);

            toast.success("Retur Pembelian berhasil dibuat!");
            await this.queryClient.invalidateQueries({
                queryKey: ["defective-items"],
            });
            this.selectedIds = [];
            goto(`/purchase-returns/${result.returnId}`);
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Gagal membuat retur");
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }
}
