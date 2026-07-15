import { createQuery, type CreateQueryResult } from "@tanstack/svelte-query";
import { PurchaseReturnsService, type PurchaseReturn } from "./purchase-returns.service";
import { browser } from "$app/environment";
import { settingsStore, initializeSettings } from "$lib/features/settings/settings-store.svelte";

interface PurchaseReturnDetail extends PurchaseReturn {
    user?: { name: string };
    supplier: {
        name: string;
        address?: string;
        phone?: string;
    };
    items: Array<{
        id: string;
        qty: number;
        reason?: string;
        product: {
            name: string;
            code?: string;
            category?: { name: string };
        };
        batch?: { variant: string | null };
    }>;
}

/**
 * Controller for the Purchase Return Detail page
 * Manages the query for purchase return details and store settings
 */
export class PurchaseReturnDetailController {
    private returnId: string;

    // Query
    query: CreateQueryResult<PurchaseReturnDetail | null, Error>;

    constructor(returnId: string) {
        this.returnId = returnId;

        // Initialize settings on browser
        if (browser) {
            initializeSettings();
        }

        // Initialize query
        this.query = createQuery(() => ({
            queryKey: ["purchase-return", this.returnId],
            queryFn: () => PurchaseReturnsService.getPurchaseReturnById(this.returnId) as Promise<PurchaseReturnDetail | null>,
        }));
    }

    // Derived state
    get purchaseReturn() {
        return this.query.data;
    }

    get isLoading() {
        return this.query.isLoading;
    }

    get isError() {
        return this.query.isError;
    }

    get error() {
        return this.query.error;
    }

    // Store settings
    get storeName() {
        return settingsStore.storeInfo.name || "Toko Service";
    }

    get storeAddress() {
        return settingsStore.storeInfo.address || "";
    }

    get storePhone() {
        return settingsStore.storeInfo.phone || "";
    }

    // Actions
    handlePrint() {
        window.print();
    }

    // Total quantity calculation
    get totalQty(): number {
        if (!this.purchaseReturn?.items) return 0;
        return this.purchaseReturn.items.reduce((acc, item) => acc + item.qty, 0);
    }
}
