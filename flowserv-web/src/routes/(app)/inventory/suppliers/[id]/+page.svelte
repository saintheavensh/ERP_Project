<script lang="ts">
  import { SupplierDetailState } from '$lib/states/inventory/supplier.detail.svelte';
  import SupplierForm from '$lib/components/inventory/SupplierForm.svelte';
  import SupplierBrands from '$lib/components/inventory/SupplierBrands.svelte';
  
  let { data } = $props();
  // svelte-ignore state_referenced_locally
  const state = new SupplierDetailState(data);
</script>

<svelte:head>
  <title>Edit {state.supplier?.name || 'Supplier'} - FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/inventory/suppliers" class="text-slate-500 hover:text-slate-800" aria-label="Back to suppliers">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div class="flex-1">
      <h1 class="text-2xl font-bold text-slate-900">Edit Supplier: {state.supplier?.name}</h1>
      <p class="text-slate-500 mt-1">Manage supplier information, contact details, and policies.</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <SupplierForm {state} />
    <SupplierBrands {state} />
  </div>
</div>
