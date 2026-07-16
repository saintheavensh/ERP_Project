<script lang="ts">
  import { untrack } from 'svelte';
  
  let { data } = $props();
  let supplier = $derived(data.supplier);
  
  let form = $state(untrack(() => ({
    name: supplier?.name || '',
    email: supplier?.email || '',
    contactInfo: supplier?.contactInfo || '',
    photoUrl: supplier?.photoUrl || '',
    type: supplier?.type || 'wholesale',
    paymentType: supplier?.paymentTermDays > 0 ? 'tempo' : 'cash',
    paymentTermDays: supplier?.paymentTermDays || 0,
    returnPolicyDays: supplier?.returnPolicyDays || 0,
    warrantyPolicyDays: supplier?.warrantyPolicyDays || 0,
    returnWarrantyNotes: supplier?.returnWarrantyNotes || ''
  })));
  
  let loading = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');

  async function updateSupplier() {
    loading = true;
    errorMsg = '';
    successMsg = '';
    
    try {
      const payload = { ...form };
      if (payload.returnPolicyDays === 0) delete (payload as any).returnPolicyDays;
      if (payload.warrantyPolicyDays === 0) delete (payload as any).warrantyPolicyDays;
      if (payload.paymentType === 'cash') payload.paymentTermDays = 0;
      delete (payload as any).paymentType;
      
      const res = await fetch(`http://localhost:3001/v1/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to update supplier');
      }
      
      successMsg = 'Supplier updated successfully!';
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      loading = false;
    }
  }

  let selectedBrandId = $state('');
  
  async function linkBrand() {
    if (!selectedBrandId) return;
    loading = true;
    errorMsg = '';
    
    try {
      const res = await fetch(`http://localhost:3001/v1/suppliers/${supplier.id}/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({ brandId: selectedBrandId })
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to link brand');
      }
      
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  let newBrandName = $state('');
  let newBrandGrade = $state('');

  async function createAndLinkBrand() {
    if (!newBrandName) return;
    loading = true;
    errorMsg = '';
    
    try {
      const brandRes = await fetch('http://localhost:3001/v1/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
        body: JSON.stringify({ name: newBrandName, qualityGrade: newBrandGrade || 'OEM' })
      });
      const brandResult = await brandRes.json();
      if (!brandRes.ok) throw new Error(brandResult.error?.message || 'Failed to create brand');
      
      const newBrandId = brandResult.data.id;
      
      const linkRes = await fetch(`http://localhost:3001/v1/suppliers/${supplier.id}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
        body: JSON.stringify({ brandId: newBrandId })
      });
      const linkResult = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkResult.error?.message || 'Failed to link brand');
      
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  async function unlinkBrand(brandId: string) {
    if (!confirm('Are you sure you want to remove this brand from this supplier?')) return;
    loading = true;
    errorMsg = '';
    
    try {
      const res = await fetch(`http://localhost:3001/v1/suppliers/${supplier.id}/brands/${brandId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error?.message || 'Failed to unlink brand');
      }
      
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Edit {supplier?.name || 'Supplier'} - FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/inventory/suppliers" class="text-slate-500 hover:text-slate-800" aria-label="Back to suppliers">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div class="flex-1">
      <h1 class="text-2xl font-bold text-slate-900">Edit Supplier: {supplier?.name}</h1>
      <p class="text-slate-500 mt-1">Manage supplier information, contact details, and policies.</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
      <form onsubmit={(e) => { e.preventDefault(); updateSupplier(); }} class="space-y-6">
      {#if errorMsg}
        <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {errorMsg}
        </div>
      {/if}
      
      {#if successMsg}
        <div class="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
          {successMsg}
        </div>
      {/if}
      
      <div class="grid grid-cols-2 gap-6">
        <div class="col-span-2 sm:col-span-1">
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Supplier Name *</label>
          <input id="name" type="text" bind:value={form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
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

        <div class="col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1" for="photo_url">Photo / Logo URL</label>
          <input id="photo_url" type="url" bind:value={form.photoUrl} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. https://example.com/logo.png">
        </div>
      </div>

      <div class="border-t border-slate-200 pt-6 mt-6">
        <h3 class="text-lg font-medium text-slate-900 mb-4">Policies</h3>
        <div class="grid grid-cols-2 gap-6">
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
            <label class="block text-sm font-medium text-slate-700 mb-1" for="notes">Warranty Notes</label>
            <textarea id="notes" bind:value={form.returnWarrantyNotes} rows="3" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Special conditions..."></textarea>
          </div>
        </div>
      </div>
      
        <div class="pt-4 flex justify-end gap-3 border-t border-slate-200">
          <a href="/inventory/suppliers" class="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</a>
          <button type="submit" disabled={loading} class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>

    <!-- Brands Section -->
    <div class="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
      <div class="p-6 border-b border-slate-200">
        <h3 class="text-lg font-medium text-slate-900">Brands / Grades Supplied</h3>
        {#if supplier.type === 'wholesale'}
          <p class="text-sm text-slate-500 mt-1">Create and link a new brand exclusive to this wholesaler.</p>
          <div class="mt-4 flex flex-col gap-3">
            <input type="text" bind:value={newBrandName} placeholder="Brand Name (e.g. LifeFuture)" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            <input type="text" bind:value={newBrandGrade} placeholder="Quality Grade (e.g. OEM, Original)" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            <button type="button" disabled={!newBrandName || loading} onclick={createAndLinkBrand} class="w-full py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50">
              Create & Link Brand
            </button>
          </div>
        {:else}
          <p class="text-sm text-slate-500 mt-1">Link brands that are available from this retailer.</p>
          <div class="mt-4 flex gap-2">
            <select bind:value={selectedBrandId} class="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
              <option value="">Select a brand...</option>
              {#each data.allBrands as b}
                {#if !supplier.supplierBrands?.find((sb: any) => sb.partBrandId === b.id)}
                  <option value={b.id}>{b.name} - {b.qualityGrade}</option>
                {/if}
              {/each}
            </select>
            <button type="button" disabled={!selectedBrandId || loading} onclick={linkBrand} class="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 whitespace-nowrap">
              Link
            </button>
          </div>
        {/if}
      </div>
      
      <div class="p-0">
        <ul class="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
          {#if supplier.supplierBrands && supplier.supplierBrands.length > 0}
            {#each supplier.supplierBrands as sb}
              <li class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div>
                  <p class="font-medium text-slate-900">{sb.partBrand?.name}</p>
                  <p class="text-xs text-purple-600 font-medium bg-purple-50 inline-block px-2 py-0.5 rounded mt-1">{sb.partBrand?.qualityGrade}</p>
                </div>
                <button type="button" onclick={() => unlinkBrand(sb.partBrandId)} class="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove Link">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </li>
            {/each}
          {:else}
            <li class="p-6 text-center text-slate-500 text-sm">
              No brands linked to this supplier yet.
            </li>
          {/if}
        </ul>
      </div>
    </div>
  </div>
</div>
