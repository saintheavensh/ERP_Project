<script lang="ts">
  import { SuppliersState } from '$lib/states/inventory/suppliers.svelte';
  import SuppliersTable from '$lib/components/inventory/SuppliersTable.svelte';
  import AddSupplierModal from '$lib/components/inventory/AddSupplierModal.svelte';

  let { data } = $props();
  // svelte-ignore state_referenced_locally
  const state = new SuppliersState(data);
</script>

<svelte:head>
  <title>Suppliers - FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/inventory" class="text-slate-500 hover:text-slate-800" aria-label="Back to inventory">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div class="flex-1">
      <h1 class="text-2xl font-bold text-slate-900">Supplier Management</h1>
      <p class="text-slate-500 mt-1">Manage suppliers, contacts, and their return/warranty policies.</p>
    </div>
    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors" onclick={() => state.showAddModal = true}>
      New Supplier
    </button>
  </div>

  <SuppliersTable {state} />
</div>

<AddSupplierModal {state} />
