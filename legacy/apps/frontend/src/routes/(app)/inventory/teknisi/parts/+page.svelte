<script lang="ts">
    // Dynamically imported
</script>

<div class="container mx-auto py-6 space-y-6">
    <header class="flex justify-between items-center">
        <div>
            <h1
                class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
                Katalog Sparepart
            </h1>
            <p class="text-slate-500">
                Lihat ketersediaan komponen dan lakukan permintaan pengambilan
                barang.
            </p>
        </div>
    </header>

    {#await import("$lib/features/inventory/components/products/teknisi/TeknisiPartsTable.svelte")}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each Array(6) as _}
                <div
                    class="h-32 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse bg-slate-50 dark:bg-slate-900/50"
                ></div>
            {/each}
        </div>
    {:then { default: TeknisiPartsTable }}
        <TeknisiPartsTable />
    {/await}
</div>
