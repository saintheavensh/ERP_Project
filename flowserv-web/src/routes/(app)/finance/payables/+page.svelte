<script lang="ts">
  import { PayablesState } from '$lib/states/finance/payables.svelte';
  import PayablesTable from '$lib/components/finance/PayablesTable.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new PayablesState(data);
</script>

<svelte:head>
  <title>Hutang ke Supplier (Hutang) | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-6xl mx-auto">
  <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Hutang ke Supplier</h1>
      <p class="text-sm text-slate-500">Daftar tagihan supplier yang belum lunas atau berstatus tempo.</p>
    </div>
  </div>

  <PayablesTable {state} />
</div>
