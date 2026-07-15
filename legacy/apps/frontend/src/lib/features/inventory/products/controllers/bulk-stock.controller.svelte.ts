import {
    createQuery,
    createMutation,
    useQueryClient,
    type CreateQueryResult,
} from "@tanstack/svelte-query";
import { CategoriesService } from "../../categories/categories.service";
import { toast } from "svelte-sonner";

export class BulkStockController {
    private queryClient = useQueryClient();

    // State
    selectedCategoryId = $state("");
    minStock = $state(5);
    productCount = $state(0);
    isLoadingCount = $state(false);

    // Queries
    categoriesQuery: CreateQueryResult<any[], Error>;

    constructor() {
        this.categoriesQuery = createQuery(() => ({
            queryKey: ["categories"],
            queryFn: CategoriesService.getAll,
        }));
    }

    get categories() {
        return this.categoriesQuery.data || [];
    }

    get leafCategories() {
        return this.categories.filter(
            (cat) => !this.categories.some((c) => c.parentId === cat.id),
        );
    }

    get selectedCategoryName() {
        return this.categories.find((c) => c.id === this.selectedCategoryId)?.name || "";
    }

    // Effect logic (to be called by component or reactive watcher)
    async fetchProductCount() {
        if (!this.selectedCategoryId) {
            this.productCount = 0;
            return;
        }

        this.isLoadingCount = true;
        try {
            this.productCount = await CategoriesService.getProductCount(this.selectedCategoryId);
        } catch (e) {
            this.productCount = 0;
        } finally {
            this.isLoadingCount = false;
        }
    }

    // Mutation
    bulkUpdateMutation = createMutation(() => ({
        mutationFn: ({
            categoryId,
            minStock,
        }: {
            categoryId: string;
            minStock: number;
        }) => CategoriesService.bulkUpdateMinStock(categoryId, minStock),
        onSuccess: (updatedCount) => {
            toast.success(`${updatedCount} produk berhasil diperbarui`);
            this.queryClient.invalidateQueries({ queryKey: ["products"] });
            // Close handled by component reacting to success or passing callback
        },
        onError: () => {
            toast.error("Gagal memperbarui minimum stok");
        },
    }));

    get isSubmitting() {
        return this.bulkUpdateMutation.isPending;
    }

    handleSubmit(onSuccess?: () => void) {
        if (!this.selectedCategoryId) {
            toast.error("Pilih kategori terlebih dahulu");
            return;
        }
        if (this.productCount === 0) {
            toast.error("Tidak ada produk dalam kategori ini");
            return;
        }
        this.bulkUpdateMutation.mutate(
            { categoryId: this.selectedCategoryId, minStock: this.minStock },
            {
                onSuccess: () => {
                    if (onSuccess) onSuccess();
                    this.reset();
                },
            },
        );
    }

    reset() {
        this.selectedCategoryId = "";
        this.minStock = 5;
        this.productCount = 0;
    }
}
