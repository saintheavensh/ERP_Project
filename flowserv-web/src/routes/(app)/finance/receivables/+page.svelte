<script lang="ts">
  import { ReceivablesState } from '$lib/states/finance/receivables.svelte';
  import ReceivablesTable from '$lib/components/finance/ReceivablesTable.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new ReceivablesState(data);
</script>

<svelte:head>
  <title>Accounts Receivable (Piutang) | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-6xl mx-auto">
  <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Manajemen Piutang (Accounts Receivable)</h1>
      <p class="text-sm text-slate-500">Daftar tagihan pelanggan (tempo) yang belum lunas.</p>
    </div>
  </div>

  <ReceivablesTable {state} />
</div>
