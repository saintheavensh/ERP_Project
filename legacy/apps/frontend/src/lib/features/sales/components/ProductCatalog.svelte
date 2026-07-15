<script lang="ts">
    import { Search } from "lucide-svelte";
    import ProductCard from "./ProductCard.svelte";
    import type { SalesController } from "./sales.controller.svelte";

    let { controller }: { controller: SalesController } = $props();
</script>

<div class="flex-1 overflow-y-auto p-6 scroll-smooth">
    {#if controller.filteredProducts.length === 0}
        <div
            class="h-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95 duration-300"
        >
            <div
                class="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-4"
            >
                <Search class="h-10 w-10 opacity-20" />
            </div>
            <h3 class="font-medium text-lg text-foreground/80">
                Tidak ada produk ditemukan
            </h3>
            <p class="text-sm">
                Coba kata kunci lain atau ubah filter kategori
            </p>
        </div>
    {:else}
        <div
            class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20"
        >
            {#each controller.filteredProducts as product (product.id)}
                <ProductCard {controller} {product} />
            {/each}
        </div>
    {/if}
</div>
