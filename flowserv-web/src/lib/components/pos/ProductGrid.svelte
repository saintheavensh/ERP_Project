<script lang="ts">
  let { 
    searchQuery = $bindable(), 
    selectedBranchId, 
    filteredProducts,
    getStockForBranch,
    addToCart,
    formatRp
  } = $props<{
    searchQuery: string,
    selectedBranchId: string,
    filteredProducts: any[],
    getStockForBranch: (p: any, b: string) => number,
    addToCart: (p: any) => void,
    formatRp: (n: number) => string
  }>();
</script>

<div class="flex-1 flex flex-col overflow-hidden border-r border-slate-200 bg-slate-50/50">
  <div class="p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm">
    <input type="text" bind:value={searchQuery} placeholder="Cari SKU atau Nama Produk..." class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
  </div>
  
  <div class="flex-1 overflow-y-auto p-4">
    {#if !selectedBranchId}
      <div class="text-center text-slate-500 mt-10">Silakan pilih cabang terlebih dahulu</div>
    {:else}
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each filteredProducts as product}
          {@const stock = getStockForBranch(product, selectedBranchId)}
          <div 
            role="button"
            tabindex="0"
            class="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col {stock <= 0 ? 'opacity-50 grayscale' : 'hover:border-blue-300'}"
            onclick={() => stock > 0 && addToCart(product)}
            onkeydown={(e) => e.key === 'Enter' && stock > 0 && addToCart(product)}
          >
            <div class="p-4 flex-1 flex flex-col">
              <div class="flex flex-wrap gap-1 mb-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-500 uppercase">{product.categoryName}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 uppercase">{product.brandName}</span>
              </div>
              <h3 class="font-medium text-slate-800 line-clamp-2 leading-tight mb-3 flex-1">{product.name}</h3>
              <div class="mt-auto flex items-end justify-between">
                <span class="font-bold text-blue-600">{formatRp(parseFloat(product.sellingPrice) || 0)}</span>
                <span class="text-xs font-medium px-2 py-1 rounded-full {stock > 5 ? 'bg-green-100 text-green-700' : stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
                  Stok: {stock}
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
