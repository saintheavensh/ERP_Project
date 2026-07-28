<script lang="ts">
  import { LedgerState } from '$lib/states/finance/ledger.svelte';
  import LedgerTable from '$lib/components/finance/LedgerTable.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new LedgerState(data);
</script>

<svelte:head>
  <title>Buku Kas | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-6xl mx-auto">
  <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Buku Kas</h1>
      <p class="text-sm text-slate-500">
        Setiap penjualan, konsumsi part dari tiket, dan pergerakan hutang supplier — dicatat di sini.
      </p>
    </div>
  </div>

  <LedgerTable {state} />
</div>
