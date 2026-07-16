<script lang="ts">
  let { data } = $props();
  let suppliers = $derived(data.suppliers || []);
  
  let showAddModal = $state(false);
  let form = $state({
    name: '',
    email: '',
    photoUrl: '',
    contactInfo: '',
    type: 'wholesale',
    paymentType: 'cash', // 'cash' or 'tempo'
    paymentTermDays: 0,
    returnPolicyDays: 0,
    warrantyPolicyDays: 0,
    returnWarrantyNotes: ''
  });
  let loading = $state(false);
  let errorMsg = $state('');

  async function addSupplier() {
    loading = true;
    errorMsg = '';
    
    try {
      const payload = { ...form };
      if (payload.returnPolicyDays === 0) delete (payload as any).returnPolicyDays;
      if (payload.warrantyPolicyDays === 0) delete (payload as any).warrantyPolicyDays;
      if (payload.paymentType === 'cash') payload.paymentTermDays = 0;
      delete (payload as any).paymentType;
      
      const res = await fetch('http://localhost:3001/v1/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to add supplier');
      }
      
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  async function deleteSupplier(id: string) {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone if there are no linked transactions.')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/v1/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to delete supplier');
      }
      
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }
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
    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors" onclick={() => showAddModal = true}>
      New Supplier
    </button>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">Name</th>
          <th class="p-4">Contact Info</th>
          <th class="p-4">Type</th>
          <th class="p-4">Payment</th>
          <th class="p-4">Return Policy</th>
          <th class="p-4">Warranty</th>
          <th class="p-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each suppliers as supplier}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-medium text-slate-900">{supplier.name}</td>
            <td class="p-4 text-slate-600">{supplier.contactInfo || '-'}</td>
            <td class="p-4 text-slate-600 capitalize">{supplier.type}</td>
            <td class="p-4 text-slate-600">
              {#if supplier.paymentTermDays === 0}
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Cash / COD</span>
              {:else}
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">Tempo {supplier.paymentTermDays} Days</span>
              {/if}
            </td>
            <td class="p-4 text-slate-600">{supplier.returnPolicyDays ? `${supplier.returnPolicyDays} Days` : 'N/A'}</td>
            <td class="p-4 text-slate-600">{supplier.warrantyPolicyDays ? `${supplier.warrantyPolicyDays} Days` : 'N/A'}</td>
            <td class="p-4 text-right">
              <div class="flex items-center justify-end gap-3">
                <a href="/inventory/suppliers/{supplier.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">View & Edit</a>
                <button type="button" class="text-red-500 hover:text-red-700 text-sm font-medium" onclick={() => deleteSupplier(supplier.id)}>Delete</button>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="p-8 text-center text-slate-500">
              No suppliers found. Add a new supplier to get started.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if showAddModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Add New Supplier</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Close Modal" onclick={() => showAddModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <form onsubmit={(e) => { e.preventDefault(); addSupplier(); }} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        {#if errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {errorMsg}
          </div>
        {/if}
        
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Supplier Name *</label>
            <input id="name" type="text" bind:value={form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Bintang Sparepart">
          </div>
          
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email</label>
            <input id="email" type="email" bind:value={form.email} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. sales@supplier.com">
          </div>
          
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="contact">Phone / Contact Info</label>
            <input id="contact" type="text" bind:value={form.contactInfo} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. WA: 08123...">
          </div>
          
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="type">Type</label>
            <select id="type" bind:value={form.type} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="wholesale">Wholesale</option>
              <option value="retailer">Retailer</option>
            </select>
          </div>

          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="photo_url">Photo / Logo URL</label>
            <input id="photo_url" type="url" bind:value={form.photoUrl} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...">
          </div>

          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="payment_type">Payment Method</label>
            <select id="payment_type" bind:value={form.paymentType} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="cash">Cash / COD</option>
              <option value="tempo">Tempo (Term)</option>
            </select>
          </div>

          {#if form.paymentType === 'tempo'}
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium text-slate-700 mb-1" for="payment_days">Tempo Duration (Days) *</label>
              <input id="payment_days" type="number" min="1" bind:value={form.paymentTermDays} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
          {/if}

          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="return_days">Return Policy (Days)</label>
            <input id="return_days" type="number" min="0" bind:value={form.returnPolicyDays} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
          
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="warranty_days">Warranty Policy (Days)</label>
            <input id="warranty_days" type="number" min="0" bind:value={form.warrantyPolicyDays} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="notes">Warranty Notes (Optional)</label>
            <textarea id="notes" bind:value={form.returnWarrantyNotes} rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Special conditions..."></textarea>
          </div>
        </div>
        
        <div class="pt-4 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => showAddModal = false}>Cancel</button>
          <button type="submit" disabled={loading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
