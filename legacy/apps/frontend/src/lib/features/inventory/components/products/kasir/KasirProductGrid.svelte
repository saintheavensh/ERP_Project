<script lang="ts">
    import { onMount } from "svelte";
    import { createProductStore } from "$lib/features/inventory/stores/products-store.svelte";
    import ProductSearch from "../shared/ProductSearch.svelte";
    import ProductCard from "../shared/ProductCard.svelte";
    import { LayoutGrid, List } from "lucide-svelte";
    import { Button } from "$lib/shared/components/ui/button";

    let { onAddToCart }: { onAddToCart: (product: any) => void } = $props();

    const store = createProductStore();
    let viewMode = $state<"grid" | "list">("grid");

    onMount(() => {
        store.loadProducts();
    });
</script>

<div class="h-full flex flex-col gap-4">
    <div class="flex items-center gap-2">
        <div class="flex-1">
            <ProductSearch
                placeholder="Scan barcode or type name..."
                onSearch={(val) => store.setFilter({ search: val })}
            />
        </div>
        <div
            class="flex border rounded-md overflow-hidden bg-white dark:bg-slate-950"
        >
            <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                class="rounded-none h-9 w-9"
                onclick={() => (viewMode = "grid")}
            >
                <LayoutGrid class="h-4 w-4" />
            </Button>
            <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                class="rounded-none h-9 w-9"
                onclick={() => (viewMode = "list")}
            >
                <List class="h-4 w-4" />
            </Button>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        {#if store.loading && store.products.length === 0}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {#each Array(12) as _}
                    <div
                        class="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                    ></div>
                {/each}
            </div>
        {:else}
            <div
                class={viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    : "flex flex-col gap-3"}
            >
                {#each store.products as product (product.id)}
                    <ProductCard
                        {product}
                        onAction={() => onAddToCart(product)}
                    />
                {/each}
            </div>
        {/if}
    </div>
</div>
