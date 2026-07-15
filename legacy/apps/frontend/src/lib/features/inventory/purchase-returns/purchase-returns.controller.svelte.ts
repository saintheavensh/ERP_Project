import { createQuery, type CreateQueryResult } from "@tanstack/svelte-query";
import { PurchaseReturnsService, type PurchaseReturn } from "./purchase-returns.service";

/**
 * Controller for the Purchase Returns List component
 * Manages history view of processed returns
 */
export class PurchaseReturnsController {
    // Query
    query: CreateQueryResult<PurchaseReturn[], Error>;

    // State
    searchQuery = $state("");

    constructor() {
        this.query = createQuery(() => ({
            queryKey: ["purchase-returns"],
            queryFn: () => PurchaseReturnsService.getPurchaseReturns(),
        }));
    }

    // Derived values
    get isLoading(): boolean {
        return this.query.isLoading;
    }

    get filteredReturns(): PurchaseReturn[] {
        const data = this.query.data ?? [];
        if (!this.searchQuery) return data;

        const search = this.searchQuery.toLowerCase();
        return data.filter(
            (item) =>
                item.id.toLowerCase().includes(search) ||
                item.supplier.name.toLowerCase().includes(search)
        );
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
