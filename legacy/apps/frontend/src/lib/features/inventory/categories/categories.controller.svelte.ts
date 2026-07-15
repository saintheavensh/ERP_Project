import {
    createQuery,
    createMutation,
    useQueryClient,
    type CreateQueryResult,
} from "@tanstack/svelte-query";
import { CategoriesService, type CreateCategoryInput } from "./categories.service";
import { SuppliersService } from "../suppliers/suppliers.service";
import { toast } from "svelte-sonner";
import type { Category, Supplier } from "@repo/shared";

interface HierarchicalCategory {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
    level: number;
    childrenCount: number;
    hasChildren: boolean;
    visible: boolean;
}

/**
 * Controller for the Categories page
 * Manages state and business logic for category CRUD operations
 */
export class CategoriesController {
    private queryClient = useQueryClient();

    // UI State
    expandedMap = $state<Record<string, boolean>>({});
    open = $state(false);
    editingId = $state<string | null>(null);
    name = $state("");
    description = $state("");
    parentId = $state<string | null>(null);
    deleteOpen = $state(false);
    deletingId = $state<string | null>(null);

    // Queries
    categoriesQuery: CreateQueryResult<Category[], Error>;
    suppliersQuery: CreateQueryResult<Supplier[], Error>;

    constructor() {
        this.categoriesQuery = createQuery(() => ({
            queryKey: ["categories"],
            queryFn: CategoriesService.getAll,
        }));

        this.suppliersQuery = createQuery(() => ({
            queryKey: ["suppliers"],
            queryFn: SuppliersService.getAll,
        }));
    }

    // Mutations
    private createCategoryMutation = createMutation(() => ({
        mutationFn: CategoriesService.create,
        onSuccess: () => {
            this.queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori berhasil dibuat");
            this.open = false;
            this.resetForm();
        },
        onError: () => toast.error("Gagal membuat kategori"),
    }));

    private updateMutation = createMutation(() => ({
        mutationFn: (vars: { id: string; data: Partial<CreateCategoryInput> }) =>
            CategoriesService.update(vars.id, vars.data),
        onSuccess: () => {
            this.queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori berhasil diupdate");
            this.open = false;
            this.resetForm();
        },
        onError: () => toast.error("Gagal update kategori"),
    }));

    private deleteMutation = createMutation(() => ({
        mutationFn: CategoriesService.delete,
        onSuccess: () => {
            this.queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Kategori dihapus");
            this.deleteOpen = false;
        },
        onError: () => toast.error("Gagal menghapus kategori"),
    }));

    // Derived values
    get suppliers(): Supplier[] {
        return this.suppliersQuery.data || [];
    }

    get categories(): Category[] {
        return this.categoriesQuery.data || [];
    }

    get totalCategories(): number {
        return this.categories.length;
    }

    get rootCategories(): number {
        return this.categories.filter((c) => !c.parentId).length;
    }

    get subCategories(): number {
        return this.categories.filter((c) => c.parentId).length;
    }

    get isLoading(): boolean {
        return this.categoriesQuery.isLoading;
    }

    get hierarchicalList(): HierarchicalCategory[] {
        return this.buildCategoryHierarchy(this.categories);
    }

    // Methods
    toggleExpand(id: string): void {
        this.expandedMap[id] = !this.expandedMap[id];
    }

    private buildCategoryHierarchy(
        cats: Category[],
        parentId: string | null = null,
        level = 0,
        visible = true
    ): HierarchicalCategory[] {
        const result: HierarchicalCategory[] = [];
        const children = cats
            .filter((c) => (c.parentId || null) === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));

        for (const child of children) {
            const grandChildren = cats.filter((c) => c.parentId === child.id);
            const childrenCount = grandChildren.length;
            const hasChildren = childrenCount > 0;
            const isExpanded = this.expandedMap[child.id] === true;

            result.push({
                ...child,
                level,
                childrenCount,
                hasChildren,
                visible,
            });

            const subResult = this.buildCategoryHierarchy(
                cats,
                child.id,
                level + 1,
                visible && isExpanded
            );
            result.push(...subResult);
        }
        return result;
    }

    resetForm(): void {
        this.editingId = null;
        this.name = "";
        this.description = "";
        this.parentId = null;
    }

    handleCreateNew(): void {
        this.resetForm();
        this.parentId = null;
        this.open = true;
    }

    handleAddSub(parent: Category): void {
        this.resetForm();
        this.parentId = parent.id;
        this.expandedMap[parent.id] = true;
        this.open = true;
    }

    handleEdit(cat: Category): void {
        this.editingId = cat.id;
        this.name = cat.name;
        this.description = cat.description || "";
        this.parentId = cat.parentId || null;
        this.open = true;
    }

    confirmDelete(id: string): void {
        const hasChildren = this.categories.some((c) => c.parentId === id);
        if (hasChildren) {
            toast.error(
                "Tidak bisa menghapus kategori induk. Hapus atau pindahkan sub-kategori terlebih dahulu."
            );
            return;
        }
        this.deletingId = id;
        this.deleteOpen = true;
    }

    handleDelete(): void {
        if (!this.deletingId) return;
        this.deleteMutation.mutate(this.deletingId);
    }

    handleSubmit(): void {
        if (!this.name) {
            toast.error("Nama wajib diisi");
            return;
        }

        const payload: CreateCategoryInput = {
            name: this.name,
            description: this.description,
            parentId: this.parentId || undefined,
        };

        if (this.editingId) {
            if (this.parentId === this.editingId) {
                toast.error("Kategori tidak bisa menjadi induk bagi dirinya sendiri");
                return;
            }
            this.updateMutation.mutate({ id: this.editingId, data: payload });
        } else {
            this.createCategoryMutation.mutate(payload);
        }
    }

    closeDialog(): void {
        this.open = false;
        this.resetForm();
    }

    getParentName(parentId: string | null): string {
        if (!parentId) return "";
        const parent = this.categories.find((c) => c.id === parentId);
        return parent?.name || "";
    }
}
