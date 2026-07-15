import { productsService } from '../services/products.service';
import type { Product, ProductFilters, ProductResponse } from '../types/products.types';
import { toast } from "svelte-sonner";
import { authStore as auth } from '$lib/shared/lib/auth-store.svelte';
import { ManagerInventoryLogic } from '../lib/manager.logic';
import { WarehouseInventoryLogic } from '../lib/warehouse.logic';
import { TeknisiInventoryLogic } from '../lib/teknisi.logic';

export function createProductStore() {
    let products = $state<Product[]>([]);
    let total = $state(0);
    let page = $state(1);
    let limit = $state(20);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let selectedIds = $state<string[]>([]);

    // Role-specific logic instances
    const managerLogic = new ManagerInventoryLogic();
    const warehouseLogic = new WarehouseInventoryLogic();
    const teknisiLogic = new TeknisiInventoryLogic();

    // Filters
    let filters = $state<ProductFilters>({
        search: '',
        category: '',
        supplier: '',
        lowStock: false,
        sort: 'name:asc'
    });

    // Helper untuk mendapatkan logic sesuai role
    function getLogic() {
        switch (auth.role) {
            case 'manager':
            case 'owner':
                return managerLogic;
            case 'warehouse':
                return warehouseLogic;
            case 'teknisi':
                return teknisiLogic;
            default:
                return managerLogic;
        }
    }

    async function loadProducts() {
        loading = true;
        error = null;
        try {
            const data = await productsService.getProducts({
                ...filters,
                page,
                limit
            });
            products = data.items;
            total = data.total;
        } catch (e: any) {
            error = e.message || "Failed to load products";
            toast.error(error!);
        } finally {
            loading = false;
        }
    }

    // Role-specific methods Router
    async function getRoleSpecificView() {
        loading = true;
        error = null;
        try {
            const role = auth.role;
            if (role === 'manager' || role === 'owner') {
                return await managerLogic.getManagementView();
            } else if (role === 'warehouse') {
                return await warehouseLogic.getStockView();
            } else if (role === 'teknisi') {
                return await teknisiLogic.getPartsView();
            } else {
                return await managerLogic.getManagementView(); // Fallback
            }
        } catch (e: any) {
            error = e.message || "Failed to load role view";
            toast.error(error!);
            return null;
        } finally {
            loading = false;
        }
    }

    async function adjustStock(productId: string, quantity: number, reason: string) {
        if (auth.role !== 'warehouse' && auth.role !== 'manager' && auth.role !== 'owner') {
            throw new Error('Unauthorized');
        }
        return warehouseLogic.adjustStock(productId, quantity, reason);
    }

    async function requestPart(productId: string, quantity: number) {
        if (auth.role !== 'teknisi') {
            throw new Error('Unauthorized');
        }
        return teknisiLogic.requestPart(productId, quantity);
    }

    // Actions
    function setPage(p: number) {
        page = p;
        loadProducts();
    }

    function setFilter(newFilters: Partial<ProductFilters>) {
        filters = { ...filters, ...newFilters };
        page = 1; // Reset to first page on filter change
        loadProducts();
    }

    function toggleSelect(id: string) {
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter(i => i !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
    }

    function selectAll() {
        if (selectedIds.length === products.length) {
            selectedIds = [];
        } else {
            selectedIds = products.map(p => p.id);
        }
    }

    async function deleteProduct(id: string) {
        try {
            await managerLogic.deleteProduct(id);
            toast.success("Product deleted successfully");
            loadProducts();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete product");
        }
    }

    async function bulkUpdatePrices(newPrice: number) {
        if (auth.role !== 'manager' && auth.role !== 'owner') {
            toast.error("Unauthorized");
            return;
        }
        try {
            await managerLogic.bulkUpdatePrices(selectedIds, newPrice);
            toast.success("Bulk update successful");
            selectedIds = [];
            loadProducts();
        } catch (e: any) {
            toast.error(e.message || "Failed to bulk update price");
        }
    }

    // Legacy method maintained for compatibility but routes to new role methods if needed
    async function loadSpareparts() {
        loading = true;
        try {
            const data = await teknisiLogic.getPartsView();
            // Maps the exact sparse array back to the products array for UI binding compatibility
            products = data as unknown as Product[];
            total = data.length;
        } catch (e: any) {
            toast.error("Failed to load spareparts");
        } finally {
            loading = false;
        }
    }

    return {
        // State
        get products() { return products; },
        get total() { return total; },
        get page() { return page; },
        get limit() { return limit; },
        get loading() { return loading; },
        get error() { return error; },
        get selectedIds() { return selectedIds; },
        get filters() { return filters; },

        // Methods
        loadProducts,
        loadSpareparts,
        setPage,
        setFilter,
        toggleSelect,
        selectAll,
        deleteProduct,
        bulkUpdatePrices,

        // New Role-Specific Routing
        getRoleSpecificView,
        adjustStock,
        requestPart
    };
}

