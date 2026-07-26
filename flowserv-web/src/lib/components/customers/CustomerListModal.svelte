<script lang="ts">
  import type { CustomerListState } from '$lib/states/customers/customer.list.svelte';

  let { state } = $props<{ state: CustomerListState }>();
</script>

{#if state.showModal}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-bold mb-4 text-slate-900">Add New Customer</h2>
      
      {#if state.errorMsg}
        <div class="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {state.errorMsg}
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Full Name *</label>
          <input id="name" type="text" bind:value={state.newCustomer.name} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="phone">Phone Number</label>
          <input id="phone" type="tel" bind:value={state.newCustomer.phone} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="08123456789">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email</label>
          <input id="email" type="email" bind:value={state.newCustomer.email} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com">
        </div>
        <!-- D1 — izin utang (tempo). Default mati: pelanggan baru tak bisa utang
             sampai owner/manager mencentang ini. -->
        <label class="flex items-start gap-2 cursor-pointer" for="allow-tempo">
          <input id="allow-tempo" type="checkbox" bind:checked={state.newCustomer.allowTempo}
            class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm text-slate-700">
            Boleh bayar tempo (utang)
            <span class="block text-xs text-slate-400">Pelanggan ini boleh checkout dengan metode Tempo.</span>
          </span>
        </label>
      </div>
      
      <div class="mt-6 flex gap-3 justify-end">
        <button 
          onclick={() => state.showModal = false}
          class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
          Cancel
        </button>
        <button 
          onclick={() => state.createCustomer()}
          disabled={!state.newCustomer.name || state.loading}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
          {state.loading ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </div>
  </div>
{/if}
