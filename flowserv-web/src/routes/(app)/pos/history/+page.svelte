<script lang="ts">
  import { PosHistoryState } from '$lib/states/pos/history.svelte';
  import HistoryTable from '$lib/components/pos/HistoryTable.svelte';
  import InvoiceDetailModal from '$lib/components/pos/InvoiceDetailModal.svelte';

  let { data } = $props();
  
  // svelte-ignore state_referenced_locally
  const state = new PosHistoryState(data, data.token);
</script>

<div class="p-6 max-w-7xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Riwayat Penjualan</h1>
      <p class="text-slate-500 text-sm mt-1">Daftar transaksi kasir yang telah selesai</p>
    </div>
    
    <div class="flex items-center space-x-3">
      <select bind:value={state.selectedBranchId} onchange={() => state.handleFilter()} class="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
        <option value="">Semua Cabang</option>
        {#each state.branches as branch}
          <option value={branch.id}>{branch.name}</option>
        {/each}
      </select>
      
      <a href="/pos" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        Kasir Baru
      </a>
    </div>
  </div>

  <HistoryTable {state} />
</div>

<InvoiceDetailModal {state} />
