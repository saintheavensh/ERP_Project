<script lang="ts">
  import type { InventoryState } from '$lib/states/inventory.svelte';

  let { inv } = $props<{ inv: InventoryState }>();
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  <table class="w-full text-left border-collapse">
    <thead>
      <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
        <th class="p-4">SKU</th>
        <th class="p-4">Item Name</th>
        <th class="p-4">Category</th>
        <th class="p-4">Stock</th>
        <th class="p-4">Pricing & Margin</th>
        <th class="p-4">Status</th>
        <th class="p-4 text-right">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100">
      {#each inv.inventory as item}
        {@const margin = inv.getMarginInfo(item)}
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-4 font-mono text-sm text-slate-500">{item.sku}</td>
          <td class="p-4 font-medium text-slate-900">{item.name}</td>
          <td class="p-4 text-slate-600">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              {inv.getCategoryName(item.categoryId)}
            </span>
          </td>
          <td class="p-4">
            <div class="font-semibold text-slate-900">{item.totalAvailable} <span class="text-xs font-normal text-slate-500">{item.unitOfMeasure}</span></div>
            {#if item.totalReserved > 0}
              <div class="text-xs text-amber-600 mt-0.5">{item.totalReserved} reserved</div>
            {/if}
          </td>
          <td class="p-4">
            <div class="flex flex-col gap-1">
              <div class="text-sm font-bold text-slate-900">{margin.priceText}</div>
              <div class="flex items-center gap-2 text-xs">
                <span class="text-slate-500">{margin.costText}</span>
                {#if margin.text !== 'No Cost Data'}
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded font-bold {margin.bg} {margin.color}">
                    {margin.text}
                  </span>
                {/if}
              </div>
            </div>
          </td>
          <td class="p-4">
            <div class="flex flex-col gap-1 items-start">
              {#if !item.isStockInitialized}
                <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">New / Uninitialized</span>
              {/if}
              {#if item.totalAvailable <= item.reorderPoint}
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Low Stock</span>
              {:else}
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">In Stock</span>
              {/if}
              
              <!-- Info Kompatibilitas -->
              {#if item.unresolvedCompatibility && item.unresolvedCompatibility.length > 0}
                <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200" title="Ada model yang belum terhubung">Compat: Warn</span>
              {:else if item.compatibility && item.compatibility.length > 0}
                <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">Compat: OK</span>
              {:else}
                <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">No Compat</span>
              {/if}
            </div>
          </td>
          <td class="p-4 text-right">
            <div class="flex items-center justify-end gap-3">
              <a href="/inventory/{item.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">View</a>
              <button type="button" class="text-red-500 hover:text-red-700 text-sm font-medium" onclick={() => inv.deleteItem(item.id)}>Delete</button>
            </div>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-500">
            No inventory items found. Add a new item to get started.
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
