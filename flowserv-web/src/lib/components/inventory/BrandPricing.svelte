<script lang="ts">
  import { untrack } from 'svelte';

  let { 
    item, 
    token, 
    onOpenSimulator 
  } = $props<{ 
    item: any, 
    token: string,
    onOpenSimulator: (brandId: string, name: string, currentPrice: number) => void
  }>();

  let editingBrandId = $state<string | null>(null);
  let editBrandPrice = $state<number>(0);
  let savingBrand = $state(false);

  function startEditBrand(brandId: string, currentPrice: number) {
    editingBrandId = brandId;
    editBrandPrice = currentPrice;
  }

  function cancelEditBrand() {
    editingBrandId = null;
  }

  async function saveBrandPrice(brandId: string, customPrice?: number) {
    savingBrand = true;
    const finalPrice = customPrice !== undefined ? customPrice : editBrandPrice;
    try {
      const res = await fetch(`http://localhost:3001/v1/inventory/${item.id}/brands/${brandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sellingPrice: finalPrice })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to save');
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      savingBrand = false;
    }
  }

  function getBrandMargin(cost: number, price: number) {
    if (!cost) return { pct: 0, color: 'text-slate-400', text: 'No Cost Data', bg: 'bg-slate-100' };
    const pct = ((price - cost) / cost) * 100;
    let color = pct < 0 ? 'text-red-700' : pct < 15 ? 'text-orange-700' : 'text-green-700';
    let bg = pct < 0 ? 'bg-red-100' : pct < 15 ? 'bg-orange-100' : 'bg-green-100';
    return { pct, color, bg, text: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` };
  }

  let brandData = $derived(untrack(() => {
    if (!item) return [];
    
    const costs: Record<string, { totalCost: number, totalQty: number, name: string, maxCost: number, minCost: number }> = {};
    if (item.stockBatches) {
      item.stockBatches.forEach((b: any) => {
        if (b.quantityRemaining > 0 && b.partBrandId) {
          if (!costs[b.partBrandId]) {
            costs[b.partBrandId] = { totalCost: 0, totalQty: 0, name: b.partBrand?.name || 'Tanpa Merk', maxCost: -Infinity, minCost: Infinity };
          }
          const uCost = parseFloat(b.unitCost);
          costs[b.partBrandId].totalCost += uCost * b.quantityRemaining;
          costs[b.partBrandId].totalQty += b.quantityRemaining;
          costs[b.partBrandId].maxCost = Math.max(costs[b.partBrandId].maxCost, uCost);
          costs[b.partBrandId].minCost = Math.min(costs[b.partBrandId].minCost, uCost);
        }
      });
    }

    const merged: Record<string, any> = {};
    Object.keys(costs).forEach(bId => {
      merged[bId] = {
        id: bId,
        name: costs[bId].name,
        unitCostAvg: costs[bId].totalCost / costs[bId].totalQty,
        maxCost: costs[bId].maxCost,
        minCost: costs[bId].minCost,
        stock: costs[bId].totalQty,
        sellingPrice: parseFloat(item.sellingPrice) // fallback
      };
    });

    if (item.brandPricing) {
      item.brandPricing.forEach((bp: any) => {
        if (!merged[bp.partBrandId]) {
           merged[bp.partBrandId] = {
             id: bp.partBrandId,
             name: bp.partBrand?.name || 'Tanpa Merk',
             unitCostAvg: 0,
             maxCost: 0,
             minCost: 0,
             stock: 0
           };
        }
        merged[bp.partBrandId].sellingPrice = parseFloat(bp.sellingPrice);
      });
    }
    
    return Object.values(merged);
  }));
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
  <div class="flex justify-between items-center mb-4">
    <h3 class="font-bold text-slate-900 text-lg">Detail Harga & Merk</h3>
    <span class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Edit harga jual spesifik per merk</span>
  </div>
  
  {#if brandData.length > 0}
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
            <th class="p-3">Merk (Brand)</th>
            <th class="p-3">Stok</th>
            <th class="p-3">Modal & Fluktuasi (HPP)</th>
            <th class="p-3">Harga Jual Aktual</th>
            <th class="p-3">Margin (WAC)</th>
            <th class="p-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each brandData as bd}
            {@const margin = getBrandMargin(bd.unitCostAvg, bd.sellingPrice)}
            <tr class="hover:bg-slate-50 transition-colors group">
              <td class="p-3 font-medium text-slate-900">{bd.name}</td>
              <td class="p-3 font-semibold {bd.stock > 0 ? 'text-slate-900' : 'text-slate-400'}">{bd.stock}</td>
              <td class="p-3">
                {#if bd.unitCostAvg > 0}
                  <div class="text-sm text-slate-900 font-medium">Rata-rata: Rp {bd.unitCostAvg.toLocaleString('id-ID')}</div>
                  {#if bd.maxCost > bd.minCost}
                    {@const fluktuasi = ((bd.maxCost - bd.minCost) / bd.minCost * 100)}
                    <div class="text-xs text-slate-500 mt-0.5">
                      Rentang: Rp {bd.minCost.toLocaleString('id-ID')} - Rp {bd.maxCost.toLocaleString('id-ID')} 
                      <span class="font-semibold text-amber-600">(Naik {fluktuasi.toFixed(1)}%)</span>
                    </div>
                    {@const safeMargin = ((bd.maxCost - bd.unitCostAvg) / bd.unitCostAvg * 100)}
                    <div class="text-[10px] text-blue-600 font-medium mt-1 p-1 bg-blue-50 border border-blue-100 rounded inline-block">
                      Titik Impas (BEP) Batch Termahal: Margin {safeMargin.toFixed(1)}%
                    </div>
                  {/if}
                {:else}
                  <span class="text-slate-500">-</span>
                {/if}
              </td>
              <td class="p-3">
                {#if editingBrandId === bd.id}
                  <div class="flex items-center gap-2">
                    <span class="text-slate-500">Rp</span>
                    <input type="number" bind:value={editBrandPrice} class="w-24 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" />
                    <button onclick={() => saveBrandPrice(bd.id)} disabled={savingBrand} class="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Simpan">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    <button onclick={cancelEditBrand} disabled={savingBrand} class="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Batal">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                {:else}
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center justify-between group-hover:bg-blue-50/50 rounded -mx-2 px-2 py-1">
                      <span class="font-bold text-slate-900">Rp {bd.sellingPrice.toLocaleString('id-ID')}</span>
                      <button onclick={() => startEditBrand(bd.id, bd.sellingPrice)} class="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded" title="Edit Harga Jual">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                    </div>
                    {#if bd.sellingPrice < bd.unitCostAvg}
                      <div class="text-[10px] text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-100 leading-tight">
                        ⚠️ RUGI TOTAL: Harga jual di bawah modal rata-rata!
                      </div>
                    {:else if bd.maxCost > 0 && bd.sellingPrice < bd.maxCost}
                      <div class="text-[10px] text-amber-600 font-bold bg-amber-50 p-1.5 rounded border border-amber-200 leading-tight">
                        💡 Info: Harga pasar. Laporan harian pada batch termahal akan tercatat sebagai Beban Fluktuasi.
                      </div>
                    {/if}
                  </div>
                {/if}
              </td>
              <td class="p-3">
                {#if margin.text !== 'No Cost Data'}
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold {margin.bg} {margin.color}">
                    {margin.text}
                  </span>
                {:else}
                  <span class="text-xs text-slate-400 italic">No Cost Data</span>
                {/if}
              </td>
              <td class="p-3 text-right">
                <button onclick={() => onOpenSimulator(bd.id, bd.name, bd.sellingPrice)} class="text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded inline-flex items-center gap-1 transition-colors" title="Lihat Proyeksi Laba Bersih">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  Simulasi
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
      <svg class="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
      <p class="text-sm text-slate-500">Belum ada variasi Merk/Brand yang tersimpan untuk produk ini.<br>Menerima stok baru akan otomatis mencatatkan Merk di sini.</p>
    </div>
  {/if}
</div>
