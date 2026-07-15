<script lang="ts">
    // Dynamically imported
</script>

<div class="container mx-auto py-6 space-y-6">
    <header class="flex justify-between items-center">
        <div>
            <h1
                class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
                Produk & Inventaris
            </h1>
            <p class="text-slate-500">
                Kelola katalog produk, harga, dan ketersediaan stok.
            </p>
        </div>
    </header>

    {#await import("$lib/features/inventory/components/products/manager/ProductManagerTable.svelte")}
        <div class="h-64 flex items-center justify-center text-slate-500">
            <span
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            ></span>
        </div>
    {:then { default: ProductManagerTable }}
        <ProductManagerTable />
    {/await}
</div>
