<script lang="ts">
  import type { SuppliersState } from '$lib/states/inventory/suppliers.svelte';

  let { state } = $props<{ state: SuppliersState }>();
</script>

{#if state.showAddModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Add New Supplier</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Close Modal" onclick={() => { state.showAddModal = false; state.resetForm(); }}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <form onsubmit={(e) => { e.preventDefault(); state.addSupplier(); }} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        {#if state.errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {state.errorMsg}
          </div>
        {/if}
        
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Supplier Name *</label>
            <input id="name" type="text" bind:value={state.form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Bintang Sparepart">
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

          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 mb-1" for="photo_url">Photo / Logo URL</label>
            <input id="photo_url" type="url" bind:value={state.form.photoUrl} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...">
          </div>

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
            <label class="block text-sm font-medium text-slate-700 mb-1" for="notes">Warranty Notes (Optional)</label>
            <textarea id="notes" bind:value={state.form.returnWarrantyNotes} rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Special conditions..."></textarea>
          </div>
        </div>
        
        <div class="pt-4 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => { state.showAddModal = false; state.resetForm(); }}>Cancel</button>
          <button type="submit" disabled={state.loading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {state.loading ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
