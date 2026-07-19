<script lang="ts">
  import type { SupplierDetailState } from '$lib/states/supplier.detail.svelte';

  let { state } = $props<{ state: SupplierDetailState }>();
</script>

<div class="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
  <form onsubmit={(e) => { e.preventDefault(); state.updateSupplier(); }} class="space-y-6">
  {#if state.errorMsg}
    <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
      {state.errorMsg}
    </div>
  {/if}
  
  {#if state.successMsg}
    <div class="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
      {state.successMsg}
    </div>
  {/if}
  
  <div class="grid grid-cols-2 gap-6">
    <div class="col-span-2 sm:col-span-1">
      <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Supplier Name *</label>
      <input id="name" type="text" bind:value={state.form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
    </div>
    
    <div class="col-span-2 sm:col-span-1">
      <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email</label>
      <input id="email" type="email" bind:value={state.form.email} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. sales@supplier.com">
    </div>
    
    <div class="col-span-2 sm:col-span-1">
      <label class="block text-sm font-medium text-slate-700 mb-1" for="contact">Phone / Contact Info</label>
      <input id="contact" type="text" bind:value={state.form.contactInfo} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. WA: 08123...">
    </div>
    
    <div class="col-span-2 sm:col-span-1">
      <label class="block text-sm font-medium text-slate-700 mb-1" for="type">Type</label>
      <select id="type" bind:value={state.form.type} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
        <option value="wholesale">Wholesale</option>
        <option value="retailer">Retailer</option>
      </select>
    </div>

    <div class="col-span-2">
      <label class="block text-sm font-medium text-slate-700 mb-1" for="photo_url">Photo / Logo URL</label>
      <input id="photo_url" type="url" bind:value={state.form.photoUrl} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. https://example.com/logo.png">
    </div>
  </div>

  <div class="border-t border-slate-200 pt-6 mt-6">
    <h3 class="text-lg font-medium text-slate-900 mb-4">Policies</h3>
    <div class="grid grid-cols-2 gap-6">
      <div class="col-span-2 sm:col-span-1">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="payment_type">Payment Method</label>
        <select id="payment_type" bind:value={state.form.paymentType} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="cash">Cash / COD</option>
          <option value="tempo">Tempo (Term)</option>
        </select>
      </div>

      {#if state.form.paymentType === 'tempo'}
        <div class="col-span-2 sm:col-span-1">
          <label class="block text-sm font-medium text-slate-700 mb-1" for="payment_days">Tempo Duration (Days) *</label>
          <input id="payment_days" type="number" min="1" bind:value={state.form.paymentTermDays} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
      {/if}
      
      <div class="col-span-2 sm:col-span-1">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="return_days">Return Policy (Days)</label>
        <input id="return_days" type="number" min="0" bind:value={state.form.returnPolicyDays} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
      </div>
      
      <div class="col-span-2 sm:col-span-1">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="warranty_days">Warranty Policy (Days)</label>
        <input id="warranty_days" type="number" min="0" bind:value={state.form.warrantyPolicyDays} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
      </div>

      <div class="col-span-2">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="notes">Warranty Notes</label>
        <textarea id="notes" bind:value={state.form.returnWarrantyNotes} rows="3" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Special conditions..."></textarea>
      </div>
    </div>
  </div>
  
    <div class="pt-4 flex justify-end gap-3 border-t border-slate-200">
      <a href="/inventory/suppliers" class="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</a>
      <button type="submit" disabled={state.loading} class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
        {state.loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </form>
</div>
