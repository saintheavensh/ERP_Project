<script lang="ts">
  import { CatalogState } from '$lib/states/inventory/catalog.svelte';
  import ProductCard from '$lib/components/inventory/ProductCard.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const cat = new CatalogState(data);
</script>

<svelte:head>
  <title>Katalog Produk — Cek Harga & Stok | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Katalog Produk</h1>
    <p class="text-slate-500 mt-1">Cari sparepart untuk cek harga jual &amp; jumlah stok. Hanya lihat — harga diatur oleh owner.</p>
  </div>

  <div class="flex flex-wrap items-center gap-3">
    <input
      type="text"
      bind:value={cat.searchQuery}
      placeholder="Cari nama atau SKU sparepart..."
      data-testid="catalog-search"
      class="flex-1 min-w-[200px] px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
    />
    <select
      bind:value={cat.selectedCategoryId}
      class="px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      <option value="">Semua Kategori</option>
      {#each cat.categories as c (c.id)}
        <option value={c.id}>{c.name}</option>
      {/each}
    </select>
  </div>

  {#if cat.groupedByCategory.length === 0}
    <div class="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
      Tidak ada produk yang cocok.
    </div>
  {:else}
    {#each cat.groupedByCategory as group (group.id || 'uncategorized')}
      <section class="space-y-3">
        <h2 class="font-semibold text-slate-800 flex items-center gap-2">
          {group.name}
          <span class="text-xs font-normal text-slate-400">({group.items.length})</span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each group.items as item (item.id)}
            <!-- href={null} — read-only card, no drill-down to the heavy admin
                 detail page cashier/tech don't need. -->
            <ProductCard {item} priceLabel={cat.priceLabel(item)} stockBadge={cat.stockBadge(item)} href={null} />
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</div>
