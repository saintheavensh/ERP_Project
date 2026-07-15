<script lang="ts">
  import type { PageData } from './$types';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  let customers = $derived(data.customers);

  let showModal = $state(false);
  let newCustomer = $state({ name: '', phone: '', email: '' });
  let loading = $state(false);
  let errorMsg = $state('');

  async function createCustomer() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch('http://localhost:3001/v1/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}` // Note: data.token must be passed from layout or page server
        },
        body: JSON.stringify(newCustomer)
      });
      
      const result = await res.json();
      if (res.ok) {
        showModal = false;
        newCustomer = { name: '', phone: '', email: '' };
        await invalidateAll();
      } else {
        errorMsg = result.error?.message || 'Failed to create customer';
      }
    } catch (e) {
      errorMsg = 'Network error';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Customers | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-slate-900">Customers</h1>
    <button 
      onclick={() => showModal = true}
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
      Add Customer
    </button>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <table class="w-full text-left text-sm">
      <thead class="bg-slate-50 text-slate-500 border-b border-gray-200">
        <tr>
          <th class="px-6 py-4 font-medium">Name</th>
          <th class="px-6 py-4 font-medium">Phone</th>
          <th class="px-6 py-4 font-medium">Email</th>
          <th class="px-6 py-4 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each customers as customer}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 font-medium text-slate-900">{customer.name}</td>
            <td class="px-6 py-4 text-slate-600">{customer.phone || '-'}</td>
            <td class="px-6 py-4 text-slate-600">{customer.email || '-'}</td>
            <td class="px-6 py-4 text-right">
              <a href={`/customers/${customer.id}`} class="text-blue-600 hover:text-blue-800 font-medium">
                View &rarr;
              </a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="4" class="px-6 py-8 text-center text-slate-500">
              No customers found. Click "Add Customer" to create one.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-bold mb-4 text-slate-900">Add New Customer</h2>
      
      {#if errorMsg}
        <div class="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {errorMsg}
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Full Name *</label>
          <input id="name" type="text" bind:value={newCustomer.name} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="phone">Phone Number</label>
          <input id="phone" type="tel" bind:value={newCustomer.phone} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="08123456789">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email</label>
          <input id="email" type="email" bind:value={newCustomer.email} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com">
        </div>
      </div>
      
      <div class="mt-6 flex gap-3 justify-end">
        <button 
          onclick={() => showModal = false}
          class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
          Cancel
        </button>
        <button 
          onclick={createCustomer}
          disabled={!newCustomer.name || loading}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </div>
  </div>
{/if}
