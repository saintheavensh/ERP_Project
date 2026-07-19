<script lang="ts">
  import { CustomerDetailState } from '$lib/states/customers/customer.detail.svelte';
  import CustomerAssetModal from '$lib/components/customers/CustomerAssetModal.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new CustomerDetailState(data, data.token);
</script>

<svelte:head>
  <title>{state.customer ? state.customer.name : 'Customer Detail'} | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
  <div class="mb-6 flex items-center gap-4">
    <a href="/customers" class="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Back to customers">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">{state.customer?.name || 'Unknown Customer'}</h1>
      <p class="text-slate-500 text-sm">
        {state.customer?.phone || 'No Phone'} &bull; {state.customer?.email || 'No Email'}
      </p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
      <h2 class="font-semibold text-lg text-slate-800">Registered Devices / Assets</h2>
      <button 
        onclick={() => state.showModal = true}
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
        Register Device
      </button>
    </div>
    
    <div class="divide-y divide-gray-100">
      {#each state.assets as asset}
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

<CustomerAssetModal {state} />
