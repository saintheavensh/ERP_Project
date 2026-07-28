<script lang="ts">
  import { NewPurchaseState } from '$lib/states/purchasing/new.purchase.svelte';
  import PurchaseFormHeader from '$lib/components/purchasing/PurchaseFormHeader.svelte';
  import PurchaseFormItems from '$lib/components/purchasing/PurchaseFormItems.svelte';

  let { data } = $props();
  // svelte-ignore state_referenced_locally
  const state = new NewPurchaseState(data);
</script>

<svelte:head>
  <title>New Purchase Order - FlowServ</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/inventory/purchasing" class="text-slate-500 hover:text-slate-800" aria-label="Back">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Buat Pesanan Pembelian</h1>
      <p class="text-slate-500 mt-1">Draft a new order to a supplier. Prices here are estimates.</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 sm:p-6">
    <form onsubmit={(e) => { e.preventDefault(); state.submitOrder(); }} class="space-y-6">
      {#if state.errorMsg}
        <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {state.errorMsg}
        </div>
      {/if}
      
      <PurchaseFormHeader {state} />
      <PurchaseFormItems {state} />
      
      <div class="pt-6 border-t border-slate-200 flex justify-end gap-3">
        <a href="/inventory/purchasing" class="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Batal</a>
        <button type="submit" disabled={state.loading} class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
          {state.loading ? 'Creating...' : 'Create Draft PO'}
        </button>
      </div>
    </form>
  </div>
</div>
