<script lang="ts">
  import type { OpnameState } from '$lib/states/inventory/opname.svelte';

  let { state } = $props<{ state: OpnameState }>();
</script>

{#if state.editableItems.length === 0}
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4 text-green-600">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
    </div>
    <h3 class="text-xl font-bold text-slate-900">Semua Produk Sudah Diinisialisasi!</h3>
    <p class="text-slate-500 mt-2">Tidak ada produk baru di Katalog yang menunggu stok awal.</p>
  </div>
{:else}
  <div class="space-y-4">
    {#each state.editableItems as product, pIndex}
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 {product.skipped ? 'opacity-50 grayscale bg-slate-50' : ''}">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">{product.categoryName}</span>
              <span class="text-xs font-medium text-slate-500">Universal: <span class="text-slate-700">{product.universalCode || '-'}</span></span>
            </div>
            <h3 class="font-bold text-lg text-slate-900">{product.name}</h3>
            <p class="text-xs text-slate-400">SKU: {product.sku}</p>
          </div>
          
          <label class="flex items-center cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
            <input type="checkbox" bind:checked={product.skipped} class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
            <span class="ml-2 font-medium text-slate-700 select-none">Tandai Selesai (Skip / Stok 0)</span>
          </label>
        </div>
        
        <!-- Body -->
        {#if !product.skipped}
          <div class="p-5 space-y-4">
            {#each product.brandLines as line, lIndex}
              <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                
                <div class="w-full lg:w-1/4">
                  <label class="block text-xs font-medium text-slate-500 mb-1" for={`brand-${pIndex}-${lIndex}`}>Merk / Brand</label>
                  <select id={`brand-${pIndex}-${lIndex}`} bind:value={line.brandId} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                    <option value="">-- Tidak Spesifik --</option>
                    {#each state.partBrands as brand}
                      <option value={brand.id}>{brand.name} - {brand.qualityGrade}</option>
                    {/each}
                  </select>
                </div>
                
                <div class="w-full lg:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1" for={`qty-${pIndex}-${lIndex}`}>Stok Fisik</label>
                    <input id={`qty-${pIndex}-${lIndex}`} type="number" min="0" bind:value={line.quantity} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-blue-700 bg-blue-50">
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1" for={`buy-${pIndex}-${lIndex}`}>Estimasi Harga Beli</label>
                    <input id={`buy-${pIndex}-${lIndex}`} type="number" min="0" bind:value={line.unitCost} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1" for={`sell-${pIndex}-${lIndex}`}>Harga Jual Satuan</label>
                    <input id={`sell-${pIndex}-${lIndex}`} type="number" min="0" bind:value={line.sellingPrice} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-green-700 bg-green-50">
                  </div>
                  
                  <div class="flex items-end h-full pb-1">
                    {#if product.brandLines.length > 1}
                      <button type="button" onclick={() => state.removeBrandLine(pIndex, lIndex)} class="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors w-full text-left md:text-center">
                        Hapus Baris
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
            
            <div class="pt-2">
              <button type="button" onclick={() => state.addBrandLine(pIndex)} class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                Tambah Varian Merk Lain untuk Produk Ini
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
