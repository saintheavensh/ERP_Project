<script lang="ts">
  import { PurchaseReceiveState } from '$lib/states/purchasing/receive.svelte';
  import ReceiveLines from '$lib/components/purchasing/ReceiveLines.svelte';

  let { data } = $props();
  // svelte-ignore state_referenced_locally
  const state = new PurchaseReceiveState(data);
</script>

<svelte:head>
  <title>Receive PO {state.order?.poNumber} - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href={`/inventory/purchasing/${state.order?.id}`} class="text-slate-500 hover:text-slate-800" aria-label="Back">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Terima Barang</h1>
      <p class="text-slate-500 mt-1">PO: {state.order?.poNumber} &bull; Supplier: {state.order?.supplier?.name}</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 sm:p-6">
    <div class="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
      <strong>Tugas Gudang:</strong> Silakan hitung fisik barang yang diterima. Anda bisa memecah 1 item pesanan menjadi beberapa merk yang berbeda jika supplier mengirimkan merk campuran.
    </div>

    <form onsubmit={(e) => { e.preventDefault(); state.submitReceiving(); }} class="space-y-8">
      {#if state.errorMsg}
        <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {state.errorMsg}
        </div>
      {/if}
      
      <ReceiveLines {state} />

      <div class="flex justify-end pt-4 border-t border-slate-100">
        <button type="submit" disabled={state.loading} class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50">
          {state.loading ? 'Menyimpan...' : 'Konfirmasi Penerimaan Barang'}
        </button>
      </div>
    </form>
  </div>
</div>
