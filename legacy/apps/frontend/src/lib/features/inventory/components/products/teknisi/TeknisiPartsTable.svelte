<script lang="ts">
    import { onMount } from "svelte";
    import { createProductStore } from "$lib/features/inventory/stores/products-store.svelte";
    import { productsService } from "$lib/features/inventory/services/products.service";
    import ProductSearch from "../shared/ProductSearch.svelte";
    import ProductCard from "../shared/ProductCard.svelte";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import { Wrench, Info } from "lucide-svelte";
    import * as Alert from "$lib/shared/components/ui/alert";

    const store = createProductStore();

    onMount(() => {
        store.getRoleSpecificView().then((data) => {
            // Note: In store.svelte.ts, legacy product binding handles the TS sparse map under the hood
            // but the Teknisi view natively needs products initialized.
            if (Array.isArray(data)) {
                // The getter uses store.products so no direct local assignment here needed
            }
        });
    });

    async function handleRequest(product: any) {
        const qty = prompt(
            `Berapa banyak ${product.name} yang Anda butuhkan?`,
            "1",
        );
        if (qty && !isNaN(parseInt(qty))) {
            try {
                await productsService.requestPart(product.id, parseInt(qty));
                // Store handles toast or we handle it here
            } catch (e) {
                console.error(e);
            }
        }
    }
</script>

<div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between gap-4">
        <div class="max-w-md flex-1">
            <ProductSearch
                placeholder="Cari sparepart atau alat..."
                value={store.filters.search}
                onSearch={(val) => store.setFilter({ search: val })}
            />
        </div>

        <div
            class="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full"
        >
            <Wrench class="h-4 w-4" />
            <span>Spareparts Only</span>
        </div>
    </div>

    {#if store.loading && store.products.length === 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each Array(6) as _}
                <div
                    class="h-32 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse bg-slate-50 dark:bg-slate-900/50"
                ></div>
            {/each}
        </div>
    {:else if store.products.length === 0}
        <Alert.Root>
            <Info class="h-4 w-4" />
            <Alert.Title>No Parts Found</Alert.Title>
            <Alert.Description>
                Tidak ada sparepart yang sesuai dengan pencarian Anda. Pastikan
                nama atau SKU sudah benar.
            </Alert.Description>
        </Alert.Root>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each store.products as product (product.id)}
                <ProductCard
                    {product}
                    actionLabel={product.stock > 0 ? "Request" : "Order"}
                    onAction={handleRequest}
                />
            {/each}
        </div>
    {/if}
</div>
