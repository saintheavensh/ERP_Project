<script lang="ts">
  import { PayablesState } from '$lib/states/finance/payables.svelte';
  import PayablesTable from '$lib/components/finance/PayablesTable.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new PayablesState(data);
</script>

<svelte:head>
  <title>Accounts Payable (Hutang) | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Manajemen Hutang (Accounts Payable)</h1>
      <p class="text-sm text-slate-500">Daftar tagihan supplier yang belum lunas atau berstatus tempo.</p>
    </div>
  </div>

  <PayablesTable {state} />
</div>
