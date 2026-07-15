<script lang="ts">
  import type { PageData } from './$types';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  let customer = $derived(data.customer);
  let assets = $derived(data.assets);

  let showModal = $state(false);
  let newAsset = $state({ assetType: '', brand: '', model: '', serialNumber: '' });
  let loading = $state(false);
  let errorMsg = $state('');

  async function createAsset() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`http://localhost:3001/v1/customers/${customer.id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(newAsset)
      });
      
      const result = await res.json();
      if (res.ok) {
        showModal = false;
        newAsset = { assetType: '', brand: '', model: '', serialNumber: '' };
        await invalidateAll();
      } else {
        errorMsg = result.error?.message || 'Failed to create asset';
      }
    } catch (e) {
      errorMsg = 'Network error';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{customer ? customer.name : 'Customer Detail'} | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
  <div class="mb-6 flex items-center gap-4">
    <a href="/customers" class="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Back to customers">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">{customer?.name || 'Unknown Customer'}</h1>
      <p class="text-slate-500 text-sm">
        {customer?.phone || 'No Phone'} &bull; {customer?.email || 'No Email'}
      </p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
      <h2 class="font-semibold text-lg text-slate-800">Registered Devices / Assets</h2>
      <button 
        onclick={() => showModal = true}
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
        Register Device
      </button>
    </div>
    
    <div class="divide-y divide-gray-100">
      {#each assets as asset}
        <div class="px-6 py-4 hover:bg-slate-50 flex justify-between items-center">
          <div>
            <div class="font-medium text-slate-900 flex items-center gap-2">
              <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs uppercase tracking-wider border border-slate-200">{asset.assetType}</span>
              {asset.brand || 'Unknown Brand'} {asset.model || ''}
            </div>
            {#if asset.serialNumber}
              <div class="text-sm text-slate-500 mt-1 font-mono">SN: {asset.serialNumber}</div>
            {/if}
          </div>
          <button class="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 px-3 py-1 rounded bg-blue-50">
            Create Ticket
          </button>
        </div>
      {:else}
        <div class="px-6 py-8 text-center text-slate-500">
          No devices registered yet.
        </div>
      {/each}
    </div>
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-bold mb-4 text-slate-900">Register Device</h2>
      
      {#if errorMsg}
        <div class="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {errorMsg}
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="type">Device Type *</label>
          <select id="type" bind:value={newAsset.assetType} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
          <input id="brand" type="text" bind:value={newAsset.brand} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Samsung">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="model">Model</label>
          <input id="model" type="text" bind:value={newAsset.model} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Galaxy S21">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="sn">Serial Number / IMEI</label>
          <input id="sn" type="text" bind:value={newAsset.serialNumber} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="...">
        </div>
      </div>
      
      <div class="mt-6 flex gap-3 justify-end">
        <button 
          onclick={() => showModal = false}
          class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
          Cancel
        </button>
        <button 
          onclick={createAsset}
          disabled={!newAsset.assetType || loading}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Register Device'}
        </button>
      </div>
    </div>
  </div>
{/if}
