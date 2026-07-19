<script lang="ts">
  import type { SupplierDetailState } from '$lib/states/inventory/supplier.detail.svelte';

  let { state } = $props<{ state: SupplierDetailState }>();
</script>

<div class="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
  <div class="p-6 border-b border-slate-200">
    <h3 class="text-lg font-medium text-slate-900">Brands / Grades Supplied</h3>
    {#if state.supplier.type === 'wholesale'}
      <p class="text-sm text-slate-500 mt-1">Create and link a new brand exclusive to this wholesaler.</p>
      <div class="mt-4 flex flex-col gap-3">
        <input type="text" bind:value={state.newBrandName} placeholder="Brand Name (e.g. LifeFuture)" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
        <input type="text" bind:value={state.newBrandGrade} placeholder="Quality Grade (e.g. OEM, Original)" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
        <button type="button" disabled={!state.newBrandName || state.loading} onclick={() => state.createAndLinkBrand()} class="w-full py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50">
          Create & Link Brand
        </button>
      </div>
    {:else}
      <p class="text-sm text-slate-500 mt-1">Link brands that are available from this retailer.</p>
      <div class="mt-4 flex gap-2">
        <select bind:value={state.selectedBrandId} class="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
          <option value="">Select a brand...</option>
          {#each state.allBrands as b}
            {#if !state.supplier.supplierBrands?.find((sb: any) => sb.partBrandId === b.id)}
              <option value={b.id}>{b.name} - {b.qualityGrade}</option>
            {/if}
          {/each}
        </select>
        <button type="button" disabled={!state.selectedBrandId || state.loading} onclick={() => state.linkBrand()} class="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 whitespace-nowrap">
          Link
        </button>
      </div>
    {/if}
  </div>
  
  <div class="p-0">
    <ul class="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
      {#if state.supplier.supplierBrands && state.supplier.supplierBrands.length > 0}
        {#each state.supplier.supplierBrands as sb}
          <li class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <div>
              <p class="font-medium text-slate-900">{sb.partBrand?.name}</p>
              <p class="text-xs text-purple-600 font-medium bg-purple-50 inline-block px-2 py-0.5 rounded mt-1">{sb.partBrand?.qualityGrade}</p>
            </div>
            <button type="button" onclick={() => state.unlinkBrand(sb.partBrandId)} class="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove Link">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </li>
        {/each}
      {:else}
        <li class="p-6 text-center text-slate-500 text-sm">
          No brands linked to this supplier yet.
        </li>
      {/if}
    </ul>
  </div>
</div>
