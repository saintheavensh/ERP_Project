<script lang="ts">
    import { ProductListController } from "$lib/features/inventory/products/controllers/product-list.controller.svelte";
    import SearchInput from "$lib/shared/components/custom/search-input.svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Filter, Settings2, Plus } from "lucide-svelte";
    import ProductMasterForm from "./product-master-form.svelte";
    import BulkMinStockDialog from "./bulk-min-stock-dialog.svelte";

    interface Props {
        controller: ProductListController;
    }

    let { controller }: Props = $props();
</script>

<div
    class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm"
>
    <div class="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        <div class="relative w-full sm:w-auto">
            <SearchInput
                bind:value={controller.rawSearchTerm}
                placeholder="Search by name, code..."
                class="w-full sm:w-[320px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 shadow-sm"
            />
        </div>
        <Select
            type="single"
            value={controller.selectedFilterCategory}
            onValueChange={(v) => (controller.selectedFilterCategory = v)}
        >
            <SelectTrigger
                class="w-full sm:w-[200px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm"
            >
                <span class="truncate flex items-center gap-2">
                    <Filter class="h-3.5 w-3.5 text-slate-500" />
                    {#if controller.selectedFilterCategory === "all"}
                        All Categories
                    {:else}
                        {controller.categories.find(
                            (c) => c.id === controller.selectedFilterCategory,
                        )?.name || "Category"}
                    {/if}
                </span>
            </SelectTrigger>
            <SelectContent class="max-h-[300px]">
                <SelectItem value="all">All Categories</SelectItem>
                {#each controller.categories.filter((cat) => !controller.categories.some((c) => c.parentId === cat.id)) as cat}
                    <SelectItem value={cat.id}>{cat.name}</SelectItem>
                {/each}
            </SelectContent>
        </Select>
    </div>

    <div class="flex items-center gap-2 w-full xl:w-auto">
        <!-- Bulk Min Stock Button -->
        <Button
            variant="outline"
            class="flex-1 xl:flex-none border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
            onclick={() => (controller.bulkMinStockOpen = true)}
        >
            <Settings2 class="mr-2 h-4 w-4" /> Min. Stock
        </Button>

        <!-- Dialog Produk Baru -->
        <Button
            class="flex-1 xl:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0"
            onclick={() => {
                controller.editingProduct = null;
                controller.open = true;
            }}
        >
            <Plus class="mr-2 h-4 w-4" /> Add Product
        </Button>
    </div>

    <ProductMasterForm
        bind:open={controller.open}
        editData={controller.editingProduct}
        onClose={() => {
            controller.editingProduct = null;
        }}
    />

    <!-- Bulk Min Stock Dialog -->
    <BulkMinStockDialog bind:open={controller.bulkMinStockOpen} />
</div>
