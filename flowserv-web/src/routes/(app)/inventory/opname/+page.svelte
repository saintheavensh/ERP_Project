<script lang="ts">
  import { OpnameState } from '$lib/states/inventory/opname.svelte';
  import OpnameTable from '$lib/components/inventory/OpnameTable.svelte';
  import OpnameFooter from '$lib/components/inventory/OpnameFooter.svelte';

  let { data } = $props();
  // svelte-ignore state_referenced_locally
  const state = new OpnameState(data);
</script>

<svelte:head>
  <title>Initial Stock Wizard - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6 pb-24">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Mass Initial Stock Wizard</h1>
      <p class="text-slate-500 mt-1">
        Tentukan stok awal untuk produk-produk yang belum diinisialisasi. <br/>
        Produk yang Anda kosongkan tanpa dicentang <b>Skip</b> akan muncul lagi di kemudian hari.
      </p>
    </div>
  </div>
  
  {#if state.errorMsg}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm flex items-center">
      <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      {state.errorMsg}
    </div>
  {/if}
  
  {#if state.successMsg}
    <div class="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 shadow-sm flex items-center">
      <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      {state.successMsg}
    </div>
  {/if}

  <OpnameTable {state} />
</div>

<OpnameFooter {state} />
