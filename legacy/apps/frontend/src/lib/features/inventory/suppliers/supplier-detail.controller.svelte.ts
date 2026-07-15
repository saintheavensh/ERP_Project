import {
    createQuery,
    createMutation,
    useQueryClient,
    type CreateQueryResult,
    type CreateMutationResult,
} from "@tanstack/svelte-query";
import { SuppliersService } from "./suppliers.service";
import { CategoriesService } from "../categories/categories.service";
import { toast } from "svelte-sonner";
import type { Supplier, Category } from "@repo/shared";

interface VariantItem {
    id: string | number;
    name: string;
    categoryId: string;
}

/**
 * Controller for the Supplier Detail page
 * Manages queries, mutations, and business logic for supplier configuration
 */
export class SupplierDetailController {
    private queryClient = useQueryClient();
    private supplierId: string;

    // Queries
    supplierQuery: CreateQueryResult<Supplier | undefined, Error>;
    allCategoriesQuery: CreateQueryResult<Category[], Error>;
    linkedCategoriesQuery: CreateQueryResult<Category[], Error>;
    supplierVariantsQuery: CreateQueryResult<VariantItem[], Error>;

    // Mutations
    linkCategoryMutation: CreateMutationResult<void, Error, string>;
    unlinkCategoryMutation: CreateMutationResult<void, Error, string>;
    addVariantMutation: CreateMutationResult<void, Error, { categoryId: string; name: string }>;
    removeVariantMutation: CreateMutationResult<void, Error, number>;

    // Local State
    selectedCategoryId = $state("");
    newVariantNames = $state<Record<string, string>>({});
    activeVariantCategory = $state<string | null>(null);

    constructor(supplierId: string) {
        this.supplierId = supplierId;

        // Initialize queries
        this.supplierQuery = createQuery(() => ({
            queryKey: ["supplier", this.supplierId],
            queryFn: () =>
                SuppliersService.getAll().then((res) =>
                    res.find((s) => s.id === this.supplierId),
                ),
        }));

        this.allCategoriesQuery = createQuery(() => ({
            queryKey: ["categories"],
            queryFn: CategoriesService.getAll,
        }));

        this.linkedCategoriesQuery = createQuery(() => ({
            queryKey: ["supplier-categories", this.supplierId],
            queryFn: () => SuppliersService.getCategories(this.supplierId),
        }));

        this.supplierVariantsQuery = createQuery(() => ({
            queryKey: ["supplier-variants", this.supplierId],
            queryFn: () => SuppliersService.getVariants(this.supplierId),
        }));

        // Initialize mutations
        this.linkCategoryMutation = createMutation(() => ({
            mutationFn: (categoryId: string) =>
                SuppliersService.linkCategory(this.supplierId, categoryId),
            onSuccess: () => {
                this.queryClient.invalidateQueries({
                    queryKey: ["supplier-categories", this.supplierId],
                });
                toast.success("Kategori berhasil ditautkan");
                this.selectedCategoryId = "";
            },
            onError: () => toast.error("Gagal menautkan kategori"),
        }));

        this.unlinkCategoryMutation = createMutation(() => ({
            mutationFn: (categoryId: string) =>
                SuppliersService.unlinkCategory(this.supplierId, categoryId),
            onSuccess: () => {
                this.queryClient.invalidateQueries({
                    queryKey: ["supplier-categories", this.supplierId],
                });
                toast.success("Tautan kategori dihapus");
            },
            onError: () => toast.error("Gagal menghapus tautan kategori"),
        }));

        this.addVariantMutation = createMutation(() => ({
            mutationFn: (vars: { categoryId: string; name: string }) =>
                CategoriesService.addVariantTemplate(
                    vars.categoryId,
                    vars.name,
                    this.supplierId,
                ),
            onSuccess: () => {
                toast.success("Variant template added");
                this.queryClient.invalidateQueries({ queryKey: ["supplier-variants"] });
            },
            onError: () => {
                toast.error("Failed to add variant template");
            },
        }));

        this.removeVariantMutation = createMutation(() => ({
            mutationFn: (variantId: number) =>
                CategoriesService.removeVariantTemplate(variantId),
            onSuccess: () => {
                toast.success("Variant template removed");
                this.queryClient.invalidateQueries({ queryKey: ["supplier-variants"] });
            },
            onError: () => {
                toast.error("Failed to remove variant template");
            },
        }));
    }

    // Derived state
    get supplier() {
        return this.supplierQuery.data;
    }

    get allCategories() {
        return this.allCategoriesQuery.data || [];
    }

    get linkedCategories() {
        return this.linkedCategoriesQuery.data || [];
    }

    get variantsMap(): Record<string, VariantItem[]> {
        return (this.supplierVariantsQuery.data || []).reduce(
            (acc: Record<string, VariantItem[]>, curr: VariantItem) => {
                const catId = curr.categoryId;
                if (!acc[catId]) acc[catId] = [];
                acc[catId].push(curr);
                return acc;
            },
            {},
        );
    }

    get isLoading() {
        return this.supplierQuery.isLoading;
    }

    /**
     * Get available categories (not linked and not parent categories)
     */
    get availableCategories() {
        return this.allCategories
            .filter((c) => {
                // Must not be already linked
                const isLinked = this.linkedCategories.find((l) => l.id === c.id);
                if (isLinked) return false;

                // Must NOT be a parent (i.e., must be a leaf node)
                const isParent = this.allCategories.some(
                    (other) => other.parentId === c.id,
                );
                return !isParent;
            })
            .map((c) => ({
                label: c.name,
                value: c.id,
            }));
    }

    // Actions
    handleLinkCategory() {
        if (!this.selectedCategoryId) return;
        this.linkCategoryMutation.mutate(this.selectedCategoryId);
    }

    handleUnlinkCategory(categoryId: string) {
        this.unlinkCategoryMutation.mutate(categoryId);
    }

    handleAddVariant(categoryId: string) {
        const name = this.newVariantNames[categoryId];
        if (!name) {
            toast.error("Nama varian wajib diisi");
            return;
        }
        this.addVariantMutation.mutate({ categoryId, name });
        this.newVariantNames[categoryId] = "";
    }

    handleDeleteVariant(e: Event, variantId: number) {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Hapus varian ini?")) return;
        this.removeVariantMutation.mutate(variantId);
    }
}
