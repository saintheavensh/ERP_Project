<script lang="ts">
  import { InventoryState } from '$lib/states/inventory/inventory.svelte';
  import InventoryTable from '$lib/components/inventory/InventoryTable.svelte';
  import AddItemModal from '$lib/components/inventory/AddItemModal.svelte';

  let { data } = $props();
  
  // svelte-ignore state_referenced_locally
  const inv = new InventoryState(data);
</script>

<svelte:head>
  <title>Inventory - FlowServ</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Inventory Management</h1>
      <p class="text-slate-500 mt-1">Manage parts, stock levels, and reorder points.</p>
    </div>
    <div class="flex flex-wrap gap-3">
      <a href="/inventory/categories" class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors">
        Manage Categories
      </a>
      <button class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm" onclick={() => inv.showAddModal = true}>
        + Add Item
      </button>
    </div>
  </div>

  <!-- P6 — search + low-stock filter, client-side over the already-fetched list. -->
  <div class="flex flex-wrap items-center gap-3">
    <input
      type="text"
      bind:value={inv.searchQuery}
      placeholder="Cari nama atau SKU..."
      class="flex-1 min-w-[200px] px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      type="button"
      onclick={() => inv.lowStockOnly = !inv.lowStockOnly}
      class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors {inv.lowStockOnly ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}"
    >
      Stok Menipis {inv.lowStockOnly ? '✓' : ''}
    </button>
  </div>

  <InventoryTable {inv} />
</div>

<AddItemModal {inv} />
