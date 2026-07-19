<script lang="ts">
  import { PurchaseInvoiceState } from '$lib/states/purchasing/invoice.svelte';
  import InvoiceFormHeader from '$lib/components/purchasing/InvoiceFormHeader.svelte';
  import InvoiceTable from '$lib/components/purchasing/InvoiceTable.svelte';

  let { data } = $props();
  // svelte-ignore state_referenced_locally
  const state = new PurchaseInvoiceState(data);
</script>

<svelte:head>
  <title>Invoice & Costing PO {state.order?.poNumber} - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href={`/inventory/purchasing/${state.order?.id}`} class="text-slate-500 hover:text-slate-800" aria-label="Back">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Input Invoice & Costing (Manager)</h1>
      <p class="text-slate-500 mt-1">PO: {state.order?.poNumber} &bull; Supplier: {state.order?.supplier?.name}</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
    <div class="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg text-purple-800 text-sm">
      <strong>Manager Duty:</strong> The items have been physically received. Please enter the final prices according to the supplier's invoice. This will automatically update the Weighted Average Cost (WAC) of the inventory.
    </div>

    <form onsubmit={(e) => { e.preventDefault(); state.submitInvoice(); }} class="space-y-6">
      {#if state.errorMsg}
        <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {state.errorMsg}
        </div>
      {/if}
      
      <InvoiceFormHeader {state} />
      <InvoiceTable {state} />
      
      <div class="pt-6 flex justify-end gap-3">
        <a href={`/inventory/purchasing/${state.order?.id}`} class="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</a>
        <button type="submit" disabled={state.loading} class="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
          {state.loading ? 'Processing...' : 'Confirm Invoice & Update HPP'}
        </button>
      </div>
    </form>
  </div>
</div>
