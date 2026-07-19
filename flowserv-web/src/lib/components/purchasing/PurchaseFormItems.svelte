<script lang="ts">
  import type { NewPurchaseState } from '$lib/states/purchasing/new.purchase.svelte';

  let { state } = $props<{ state: NewPurchaseState }>();
</script>

<div class="pt-6 border-t border-slate-200">
  <div class="flex justify-between items-end mb-4">
    <h3 class="font-semibold text-slate-900">Order Items</h3>
  </div>
  
  <div class="space-y-6">
    {#each state.categoryGroups as group, gIndex}
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
        {#if state.categoryGroups.length > 1}
          <button type="button" onclick={() => state.removeCategoryGroup(gIndex)} class="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium">
            Hapus Kategori
          </button>
        {/if}
        
        <div class="mb-4 pr-32">
          <label class="block text-sm font-bold text-slate-700 mb-2" for={`group-cat-${gIndex}`}>Kategori Sparepart</label>
          <select id={`group-cat-${gIndex}`} bind:value={group.categoryId} onchange={() => { group.lines.forEach((l: any) => l.inventoryItemId = ''); }} class="w-full md:w-1/2 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-medium">
            <option value="">-- Pilih Kategori --</option>
            {#each state.data.categories as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
        </div>

        {#if group.categoryId}
          <div class="pl-4 border-l-4 border-blue-100 space-y-4 py-2">
            {#each group.lines as line, lIndex}
              <div class="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div class="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span class="text-sm font-semibold text-slate-700">Item #{lIndex + 1}</span>
                  <button type="button" onclick={() => state.removeLineFromGroup(gIndex, lIndex)} class="text-red-500 hover:text-red-700 text-sm font-medium" disabled={group.lines.length === 1}>
                    Hapus Item
                  </button>
                </div>
                
                <div class="grid grid-cols-1 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1" for={`item-${gIndex}-${lIndex}`}>Produk (Tipe / Universal Code) *</label>
                    <select id={`item-${gIndex}-${lIndex}`} bind:value={line.inventoryItemId} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                      <option value="" disabled>-- Pilih Produk --</option>
                      {#each state.data.inventoryItems.filter((item: any) => item.categoryId === group.categoryId) as item}
                        <option value={item.id}>{item.name} ({item.universalCode ? item.universalCode : item.sku})</option>
                      {/each}
                    </select>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1" for={`qty-${gIndex}-${lIndex}`}>Qty (Jumlah Pesanan) *</label>
                    <input id={`qty-${gIndex}-${lIndex}`} type="number" min="1" bind:value={line.quantity} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1" for={`price-${gIndex}-${lIndex}`}>Est. Harga Satuan (Opsional)</label>
                    <input id={`price-${gIndex}-${lIndex}`} type="number" min="0" bind:value={line.unitPrice} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  </div>
                  
                  <div>
                    <div class="block text-xs font-medium text-slate-500 mb-1">Subtotal</div>
                    <div class="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
                      Rp {(line.quantity * (line.unitPrice || 0)).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
            
            <div class="pt-2">
              <button type="button" onclick={() => state.addLineToGroup(gIndex)} class="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Tambah Item {state.data.categories.find((c: any) => c.id === group.categoryId)?.name || ''}
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <div class="mt-4 pb-4 border-b border-slate-200">
    <button type="button" onclick={() => state.addCategoryGroup()} class="px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 w-full text-center flex justify-center items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
      Tambah Kategori Baru (Misal: Pesan Baterai)
    </button>
  </div>
  
  <div class="mt-4 flex justify-end">
    <div class="text-right">
      <p class="text-sm text-slate-500">Estimated Total</p>
      <p class="text-xl font-bold text-slate-900 mt-1">Rp {state.estimatedTotal.toLocaleString('id-ID')}</p>
    </div>
  </div>
</div>
