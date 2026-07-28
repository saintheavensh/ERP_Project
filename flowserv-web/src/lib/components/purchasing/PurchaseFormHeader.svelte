<script lang="ts">
  import type { NewPurchaseState } from '$lib/states/purchasing/new.purchase.svelte';

  let { state } = $props<{ state: NewPurchaseState }>();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" for="branch">Receiving Branch *</label>
    <select id="branch" bind:value={state.branchId} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
      {#each state.data.branches as branch}
        <option value={branch.id}>{branch.name}</option>
      {/each}
    </select>
  </div>
  
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" for="supplier">Supplier *</label>
    <select id="supplier" bind:value={state.supplierId} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
      <option value="" disabled>Pilih supplier...</option>
      {#each state.data.suppliers as supplier}
        <option value={supplier.id}>{supplier.name} ({supplier.type})</option>
      {/each}
    </select>
  </div>
  
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" for="date">Expected Delivery Date</label>
    <input id="date" type="date" bind:value={state.expectedDeliveryDate} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
  </div>
</div>
