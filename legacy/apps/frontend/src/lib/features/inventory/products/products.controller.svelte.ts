import { createQuery, type CreateQueryResult } from "@tanstack/svelte-query";
import { ProductsService } from "./products.service";
import { goto } from "$app/navigation";

interface ProductStats {
    totalProducts: number;
    lowStock: number;
    totalValue: number;
    totalCategories: number;
}

/**
 * Controller for the Products page
 * Manages state and business logic for product statistics
 */
export class ProductsController {
    // Query for product statistics
    statsQuery: CreateQueryResult<ProductStats, Error>;

    constructor() {
        this.statsQuery = createQuery(() => ({
            queryKey: ["productStats"],
            queryFn: async () => {
                return await ProductsService.getStats();
            },
        }));
    }

    // Derived values
    get stats(): ProductStats | undefined {
        return this.statsQuery.data;
    }

    get isLoading(): boolean {
        return this.statsQuery.isLoading;
    }

    get totalProducts(): number | string {
        return this.stats?.totalProducts ?? "--";
    }

    get lowStock(): number | string {
        return this.stats?.lowStock ?? "--";
    }

    get totalValue(): number {
        return this.stats?.totalValue ?? 0;
    }

    get totalCategories(): number | string {
        return this.stats?.totalCategories ?? "--";
    }

    /**
     * Format currency value
     */
    formatCurrency(value: number): string {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(value);
    }

    /**
     * Navigate to stock opname page
     */
    navigateToOpname(): void {
        goto("/inventory/opname");
    }
}
