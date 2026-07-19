<script lang="ts">
  import type { CustomerDetailState } from '$lib/states/customers/customer.detail.svelte';

  let { state } = $props<{ state: CustomerDetailState }>();
</script>

{#if state.showModal}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-bold mb-4 text-slate-900">Register Device</h2>
      
      {#if state.errorMsg}
        <div class="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {state.errorMsg}
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="type">Device Type *</label>
          <select id="type" bind:value={state.newAsset.assetType} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select Type</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Laptop">Laptop</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Appliance">Home Appliance</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="brand">Brand</label>
          <input id="brand" type="text" bind:value={state.newAsset.brand} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Samsung">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="model">Model</label>
          <input id="model" type="text" bind:value={state.newAsset.model} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Galaxy S21">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="sn">Serial Number / IMEI</label>
          <input id="sn" type="text" bind:value={state.newAsset.serialNumber} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="...">
        </div>
      </div>
      
      <div class="mt-6 flex gap-3 justify-end">
        <button 
          onclick={() => state.showModal = false}
          class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
          Cancel
        </button>
        <button 
          onclick={() => state.createAsset()}
          disabled={!state.newAsset.assetType || state.loading}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
          {state.loading ? 'Saving...' : 'Register Device'}
        </button>
      </div>
    </div>
  </div>
{/if}
