import {
    createQuery,
    createMutation,
    useQueryClient,
    type CreateQueryResult,
} from "@tanstack/svelte-query";
import { ProductsService } from "../products.service";
import { CategoriesService } from "../../categories/categories.service";
import { toast } from "svelte-sonner";

export class ProductListController {
    private queryClient = useQueryClient();

    // State
    searchTerm = $state("");
    debouncedSearch = $state("");
    selectedFilterCategory = $state("all");
    searchTimeout: any;

    open = $state(false);
    detailOpen = $state(false);
    bulkMinStockOpen = $state(false);
    editingProduct = $state<any>(null);
    deleteOpen = $state(false);
    deletingId = $state<string | null>(null);

    // Sort State
    sortKey = $state<"code" | "name" | "categoryName" | "stock" | "status">("name");
    sortDir = $state<"asc" | "desc">("asc");

    // Detail State
    selectedProduct = $state<any>(null);
    expandedProductId = $state<string | null>(null);

    // Queries
    productsQuery: CreateQueryResult<any[], Error>;
    categoriesQuery: CreateQueryResult<any[], Error>;

    constructor() {
        // Setup debounce effect equivalent
        // In a class, we can't use $effect directly easily, but we can use a setter or just handle it in the standard way.
        // However, since we want reactivity, we can rely on the setter of searchTerm if we were using a class method.
        // But to keep it simple and closer to Svelte 5 patterns, we can use an effect in the component OR 
        // just make debouncedSearch updated via a standard timeout in the setter of searchTerm?
        // Actually, let's just use a method to update search term that handles debounce.

        this.productsQuery = createQuery(() => ({
            queryKey: ["products", this.debouncedSearch, this.selectedFilterCategory],
            queryFn: () =>
                ProductsService.getAll(
                    undefined,
                    this.debouncedSearch,
                    this.selectedFilterCategory,
                ),
        }));

        this.categoriesQuery = createQuery(() => ({
            queryKey: ["categories"],
            queryFn: CategoriesService.getAll,
        }));
    }

    // Since we can't use $effect inside the class constructor for the debounce logic easily 
    // without passing it a cleanup function or context, 
    // we'll implement a method `setSearchTerm` or just rely on the component calling a method.
    // Better: use a setter.

    get rawSearchTerm() {
        return this.searchTerm;
    }

    set rawSearchTerm(value: string) {
        this.searchTerm = value;
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.debouncedSearch = value;
        }, 500);
    }

    // Mutations
    deleteProductMutation = createMutation(() => ({
        mutationFn: ProductsService.delete,
        onSuccess: () => {
            this.queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produk dihapus");
            this.deleteOpen = false;
        },
        onError: () => toast.error("Gagal menghapus produk"),
    }));

    // Derived State (Getters)
    get products() {
        return (this.productsQuery.data || []).map((p: any) => ({
            ...p,
            categoryName: p.category?.name || "Umum",
            min: p.minStock,
            status:
                p.stock === 0
                    ? "Empty"
                    : p.stock <= (p.minStock || 5)
                        ? "Critical"
                        : "Normal",
        }));
    }

    get categories() {
        return this.categoriesQuery.data || [];
    }

    get loading() {
        return this.productsQuery.isLoading || this.categoriesQuery.isLoading;
    }

    get filteredProducts() {
        return this.products.sort((a: any, b: any) => {
            const valA = a[this.sortKey] || "";
            const valB = b[this.sortKey] || "";

            if (typeof valA === "number" && typeof valB === "number") {
                return this.sortDir === "asc" ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (strA < strB) return this.sortDir === "asc" ? -1 : 1;
            if (strA > strB) return this.sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }

    get batchesBySupplier() {
        return this.filterBatchesByVariant(this.selectedProduct?.batches || []).reduce(
            (acc: Record<string, any[]>, batch: any) => {
                const sup =
                    batch.supplier?.name ||
                    batch.supplierName ||
                    "Tanpa Supplier";
                if (!acc[sup]) acc[sup] = [];
                acc[sup].push(batch);
                return acc;
            },
            {},
        );
    }

    // Helper Methods
    private buildCategoryHierarchy(
        cats: any[],
        parentId: string | null = null,
        level = 0,
    ): { id: string; name: string; level: number }[] {
        const result: { id: string; name: string; level: number }[] = [];
        const children = cats
            .filter((c) => (c.parentId || null) === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));

        for (const child of children) {
            result.push({
                id: child.id,
                name: child.name,
                level: level,
            });
            const subResult = this.buildCategoryHierarchy(cats, child.id, level + 1);
            result.push(...subResult);
        }
        return result;
    }

    filterBatchesByVariant(batches: any[]): any[] {
        if (!batches || batches.length === 0) return [];

        const byVariant: Record<string, any[]> = {};
        for (const batch of batches) {
            const variantKey = batch.variant || "__no_variant__";
            if (!byVariant[variantKey]) byVariant[variantKey] = [];
            byVariant[variantKey].push(batch);
        }

        const result: any[] = [];
        for (const [variantKey, variantBatches] of Object.entries(byVariant)) {
            const withStock = variantBatches.filter(
                (b: any) => (b.currentStock || 0) > 0,
            );
            if (withStock.length > 0) {
                result.push(...withStock);
            } else {
                const sorted = variantBatches.sort((a: any, b: any) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });
                result.push(sorted[0]);
            }
        }

        return result;
    }

    // Actions
    groupBatchesBySupplier(batches: any[]) {
        return this.filterBatchesByVariant(batches).reduce(
            (acc: Record<string, any[]>, batch: any) => {
                const s =
                    batch.supplier?.name ||
                    batch.supplierName ||
                    "Unknown Supplier";
                if (!acc[s]) acc[s] = [];
                acc[s].push(batch);
                return acc;
            },
            {},
        );
    }

    toggleExpanded(id: string) {
        if (this.expandedProductId === id) {
            this.expandedProductId = null;
        } else {
            this.expandedProductId = id;
        }
    }

    handleEdit(product: any) {
        this.editingProduct = product;
        this.open = true;
    }

    handleDetail(product: any) {
        ProductsService.get(product.id).then((detail) => {
            this.selectedProduct = detail;
            this.detailOpen = true;
        });
    }

    confirmDelete(id: string) {
        this.deletingId = id;
        this.deleteOpen = true;
    }

    handleDelete() {
        if (!this.deletingId) return;
        this.deleteProductMutation.mutate(this.deletingId);
    }

    toggleSort(key: "code" | "name" | "categoryName" | "stock" | "status") {
        if (this.sortKey === key) {
            this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
        } else {
            this.sortKey = key;
            this.sortDir = "asc";
        }
    }
}
