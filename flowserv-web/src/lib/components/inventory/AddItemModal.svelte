<script lang="ts">
  import type { InventoryState } from '$lib/states/inventory/inventory.svelte';

  let { inv } = $props<{ inv: InventoryState }>();
</script>

{#if inv.showAddModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Add New Inventory Item</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Close Modal" onclick={() => inv.showAddModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <form onsubmit={(e) => { e.preventDefault(); inv.addItem(); }} class="p-6 space-y-4">
        {#if inv.errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {inv.errorMsg}
          </div>
        {/if}
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="sku">SKU (Barcode) *</label>
            <input id="sku" type="text" bind:value={inv.form.sku} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="e.g. SKU-001">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="universalCode">Universal Code *</label>
            <div class="flex gap-2">
              <input id="universalCode" type="text" bind:value={inv.form.universalCode} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="e.g. BLP673">
              <button type="button" onclick={() => inv.generateUniversalCode()} class="px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium whitespace-nowrap" title="Generate dari Kategori + Nama">
                Generate
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Item Name (Model) *</label>
          <input id="name" type="text" bind:value={inv.form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Baterai Oppo A3s">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="category">Category</label>
            <select id="category" bind:value={inv.form.categoryId} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">-- No Category --</option>
              {#each inv.categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="uom">Unit of Measure</label>
            <select id="uom" bind:value={inv.form.unitOfMeasure} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="pcs">Pcs</option>
              <option value="box">Box</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="sellprice">Base Selling Price</label>
            <input id="sellprice" type="number" min="0" bind:value={inv.form.sellingPrice} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-green-700 bg-green-50 font-medium">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="reorder">Reorder Point</label>
            <input id="reorder" type="number" min="0" bind:value={inv.form.reorderPoint} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <p class="text-[10px] text-slate-500 mt-1">Alert when stock falls to this number.</p>
          </div>
        </div>
        
        <div class="pt-4 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => { inv.showAddModal = false; inv.resetForm(); }}>Cancel</button>
          <button type="submit" disabled={inv.loading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {inv.loading ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
