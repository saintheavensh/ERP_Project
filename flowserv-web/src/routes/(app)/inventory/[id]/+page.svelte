<script lang="ts">
  import { untrack } from 'svelte';
  let { data } = $props();
  let item = $derived(data.item);
  let allModels = $derived(data.allModels || []);

  let isEditingCompat = $state(false);
  
  // State for compatibility editing
  let resolvedIds = $state<string[]>([]);
  let unresolved = $state<string[]>([]);
  
  // To show loading
  let saving = $state(false);
  let successMsg = $state('');
  
  // Brand Pricing State
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
          'Authorization': `Bearer ${data.token}`
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

  let brandData = $derived(untrack(() => {
    if (!item) return [];
    
    // Group costs from stockBatches
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

    // Merge with brandPricing
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

  // Pricing Simulator State & Logic
  let showSimModal = $state(false);
  let simBrandId = $state<string | null>(null);
  let simBrandName = $state('');
  let simSellingPrice = $state(0);

  let simData = $derived.by(() => {
    if (!showSimModal || !simBrandId || !item.stockBatches) return null;
    const batches = item.stockBatches.filter((b: any) => b.partBrandId === simBrandId && b.quantityRemaining > 0);
    if (batches.length === 0) return null;

    let totalQty = 0;
    let totalOmzet = 0;
    let totalModal = 0;
    const batchDetails: any[] = [];
    
    let totalLabaPositif = 0;
    let totalBebanFluktuasi = 0;

    batches.forEach((b: any) => {
       const qty = b.quantityRemaining;
       const cost = parseFloat(b.unitCost);
       const revenue = qty * simSellingPrice;
       const cogs = qty * cost;
       const profit = revenue - cogs;
       
       totalQty += qty;
       totalOmzet += revenue;
       totalModal += cogs;

       if (profit > 0) totalLabaPositif += profit;
       if (profit < 0) totalBebanFluktuasi += Math.abs(profit);

       batchDetails.push({
         qty,
         cost,
         revenue,
         profit,
         receivedAt: b.receivedAt
       });
    });

    const netProfit = totalOmzet - totalModal;
    const netProfitPct = totalModal > 0 ? (netProfit / totalModal) * 100 : 0;
    
    // Sort batchDetails by FIFO order (receivedAt ascending)
    const sortedBatches = batchDetails.sort((a,b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
    
    // Find highest cost for recommendation
    const maxCost = batchDetails.reduce((max, b) => Math.max(max, b.cost), 0);
    // Find latest cost (the cost of the last batch in FIFO)
    const latestCost = sortedBatches.length > 0 ? sortedBatches[sortedBatches.length - 1].cost : 0;

    return {
      totalQty,
      totalOmzet,
      totalModal,
      netProfit,
      netProfitPct,
      totalLabaPositif,
      totalBebanFluktuasi,
      maxCost,
      latestCost,
      batchDetails: sortedBatches
    };
  });

  function openSimModal(brandId: string, name: string, currentPrice: number) {
    simBrandId = brandId;
    simBrandName = name;
    simSellingPrice = currentPrice;
    showSimModal = true;
  }
  
  function closeSimModal() {
    showSimModal = false;
  }

  function getBrandMargin(cost: number, price: number) {
    if (!cost) return { pct: 0, color: 'text-slate-400', text: 'No Cost Data', bg: 'bg-slate-100' };
    const pct = ((price - cost) / cost) * 100;
    let color = pct < 0 ? 'text-red-700' : pct < 15 ? 'text-orange-700' : 'text-green-700';
    let bg = pct < 0 ? 'bg-red-100' : pct < 15 ? 'bg-orange-100' : 'bg-green-100';
    return { pct, color, bg, text: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` };
  }

  $effect(() => {
    if (item && !isEditingCompat) {
      resolvedIds = item.compatibility?.map((c: any) => c.deviceModel.id) || [];
      unresolved = [...(item.unresolvedCompatibility || [])];
    }
  });

  function startEdit() {
    isEditingCompat = true;
  }

  function cancelEdit() {
    isEditingCompat = false;
    resolvedIds = item.compatibility?.map((c: any) => c.deviceModel.id) || [];
    unresolved = [...(item.unresolvedCompatibility || [])];
  }
  
  function removeUnresolved(index: number) {
    unresolved = unresolved.filter((_, i) => i !== index);
  }

  async function saveCompatibility() {
    saving = true;
    try {
      const res = await fetch(`http://localhost:3001/v1/inventory/${item.id}/compatibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({
          resolvedModelIds: resolvedIds,
          unresolvedCompatibility: unresolved
        })
      });
      
      if (res.ok) {
        successMsg = 'Kompatibilitas berhasil diperbarui.';
        isEditingCompat = false;
        
        // Optimistic UI update for now
        // A full refresh would be better but let's just show success
        setTimeout(() => successMsg = '', 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Detail Produk - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <a href="/inventory" class="text-slate-400 hover:text-slate-600" aria-label="Kembali ke Daftar Inventory">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">{item?.name || 'Detail Produk'}</h1>
        <p class="text-slate-500 mt-1">SKU: {item?.sku} &bull; Kategori: {item?.category?.name || '-'}</p>
      </div>
    </div>
  </div>

  {#if successMsg}
    <div class="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
      {successMsg}
    </div>
  {/if}

  {#if item}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Kolom Kiri: Info Dasar & Stok -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 class="font-bold text-slate-900 mb-4">Informasi Produk</h3>
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-slate-500">Kode Universal</dt>
              <dd class="font-medium text-slate-900">{item.universalCode || '-'}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Harga Jual Dasar</dt>
              <dd class="font-medium text-slate-900">Rp {parseFloat(item.sellingPrice).toLocaleString('id-ID')}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Unit Satuan</dt>
              <dd class="font-medium text-slate-900">{item.unitOfMeasure}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Batas Reorder</dt>
              <dd class="font-medium text-slate-900">{item.reorderPoint}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Status Inisialisasi</dt>
              <dd class="font-medium">
                {#if item.isStockInitialized}
                  <span class="text-green-600">Sudah Diinisialisasi</span>
                {:else}
                  <span class="text-amber-600">Belum Diinisialisasi</span>
                {/if}
              </dd>
            </div>
            <div>
              <dt class="text-slate-500">Status Kompatibilitas</dt>
              <dd class="font-medium">
                {#if item.unresolvedCompatibility && item.unresolvedCompatibility.length > 0}
                  <span class="text-amber-600 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Perlu Perhatian
                  </span>
                {:else if item.compatibility && item.compatibility.length > 0}
                  <span class="text-green-600 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    Terhubung Sempurna
                  </span>
                {:else}
                  <span class="text-slate-500">Belum Ada Model</span>
                {/if}
              </dd>
            </div>
          </dl>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 class="font-bold text-slate-900 mb-4">Batch Stok Aktif (FIFO)</h3>
          {#if item.stockBatches && item.stockBatches.length > 0}
            <div class="space-y-3">
              {#each item.stockBatches as batch}
                <div class="p-3 border border-slate-100 rounded-lg bg-slate-50">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-slate-900">{batch.quantityRemaining} <span class="text-xs font-normal">tersedia</span></span>
                    <span class="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {batch.partBrand?.name || 'Tanpa Merk'}
                    </span>
                  </div>
                  <div class="text-xs text-slate-500">
                    HPP: Rp {parseFloat(batch.unitCost).toLocaleString('id-ID')}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-slate-500 italic">Tidak ada stok tersisa.</p>
          {/if}
        </div>
      </div>
      
      <!-- Kolom Kanan: Kompatibilitas & Harga Merk -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Harga & Merk (Brand Pricing) -->
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
                        <button onclick={() => openSimModal(bd.id, bd.name, bd.sellingPrice)} class="text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded inline-flex items-center gap-1 transition-colors" title="Lihat Proyeksi Laba Bersih">
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

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-bold text-slate-900 text-lg">Kompatibilitas Device</h3>
            {#if !isEditingCompat}
              <button onclick={startEdit} class="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                Edit Kompatibilitas
              </button>
            {:else}
              <div class="flex gap-2">
                <button onclick={cancelEdit} class="text-slate-600 hover:text-slate-800 text-sm font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Batal
                </button>
                <button onclick={saveCompatibility} disabled={saving} class="text-white text-sm font-medium px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                  Simpan Perubahan
                </button>
              </div>
            {/if}
          </div>

          <!-- Unresolved Warnings (Hanya saat edit) -->
          {#if (unresolved && unresolved.length > 0) && isEditingCompat}
            <div class="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <div class="w-full">
                  <h4 class="text-sm font-bold text-amber-800">Gagal Deteksi Otomatis</h4>
                  <p class="text-xs text-amber-700 mt-1 mb-3">Teks di bawah ini gagal dicocokkan dengan database Model HP. Silakan cari model yang benar, lalu hapus peringatan ini.</p>
                  
                  <div class="flex flex-wrap gap-2">
                    {#each unresolved as un, i}
                      <div class="inline-flex items-center px-3 py-1 bg-white border border-amber-300 rounded text-sm text-amber-800 font-medium shadow-sm">
                        {un}
                        <button onclick={() => removeUnresolved(i)} class="ml-2 text-amber-500 hover:text-red-500 focus:outline-none" aria-label="Hapus peringatan ini">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- List / Edit Area -->
          <div>
            <h4 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Status Kompatibilitas Model:</h4>
            
            {#if isEditingCompat}
              <!-- Select multiple interface -->
              <p class="text-xs text-slate-500 mb-2">Tahan tombol CTRL/CMD untuk memilih lebih dari satu.</p>
              <select multiple bind:value={resolvedIds} class="w-full p-2 border border-slate-200 rounded-lg text-sm h-64 focus:ring-2 focus:ring-blue-500 outline-none">
                {#each allModels as model}
                  <option value={model.id}>{model.deviceBrand?.name || ''} {model.name}</option>
                {/each}
              </select>
            {:else}
              <!-- Unified Display Interface -->
              <ul class="space-y-2">
                {#if item.compatibility && item.compatibility.length > 0}
                  {#each item.compatibility as comp}
                    <li class="flex items-center text-sm text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                      <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      {comp.deviceModel?.deviceBrand?.name || ''} {comp.deviceModel?.name}
                      <span class="ml-auto text-xs text-slate-500 italic">Perangkat terhubung</span>
                    </li>
                  {/each}
                {/if}
                
                {#if item.unresolvedCompatibility && item.unresolvedCompatibility.length > 0}
                  {#each item.unresolvedCompatibility as un}
                    <li class="flex items-center text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                      <svg class="w-5 h-5 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      {un}
                      <span class="ml-auto text-xs text-amber-600 font-medium italic">Belum terhubung / tersedia</span>
                    </li>
                  {/each}
                {/if}

                {#if (!item.compatibility || item.compatibility.length === 0) && (!item.unresolvedCompatibility || item.unresolvedCompatibility.length === 0)}
                  <p class="text-sm text-slate-500 italic">Belum ada perangkat yang terdaftar.</p>
                {/if}
              </ul>
            {/if}
          </div>

        </div>
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-slate-500">
      Loading product details...
    </div>
  {/if}
</div>

<!-- Simulasi Profit Modal -->
{#if showSimModal && simData}
  <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-slate-100">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Simulasi Proyeksi Laba</h2>
          <p class="text-sm text-slate-500 mt-1">Merk: <span class="font-bold text-slate-700">{simBrandName}</span></p>
        </div>
        <button onclick={closeSimModal} aria-label="Tutup Simulasi" class="text-slate-400 hover:text-slate-600 p-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 overflow-y-auto flex-1 space-y-6">
        <!-- Input Harga Simulasi -->
        <div class="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <label for="sim-price-input" class="block text-sm font-semibold text-slate-700 mb-2">Simulasikan Harga Jual per Pcs:</label>
            <div class="flex items-center gap-2">
              <span class="text-slate-500 font-medium">Rp</span>
              <input id="sim-price-input" type="number" bind:value={simSellingPrice} class="w-48 px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900" min="0" />
            </div>
          </div>
          
          <!-- Recommendation Block -->
          <div class="bg-white p-3 rounded-lg border border-blue-100 shadow-sm text-sm">
            <div class="font-semibold text-slate-700 mb-1">Rekomendasi Pintar (Target Margin 30%):</div>
            <div class="flex flex-col gap-1">
              <button onclick={() => simSellingPrice = (simData.totalModal * 1.3) / simData.totalQty} class="text-left text-xs hover:bg-slate-50 p-1 -ml-1 rounded transition-colors text-slate-600">
                Target 30% Laba Bersih Total: <span class="font-bold text-slate-900">Rp {Math.round((simData.totalModal * 1.3) / simData.totalQty).toLocaleString('id-ID')}</span>
              </button>
              <button onclick={() => simSellingPrice = simData.latestCost * 1.3} class="text-left text-xs hover:bg-green-50 p-1 -ml-1 rounded transition-colors text-green-700">
                Target 30% dari Modal Terbaru: <span class="font-bold text-green-800">Rp {Math.round(simData.latestCost * 1.3).toLocaleString('id-ID')}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Ringkasan Eksekutif -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="text-xs text-slate-500 font-medium mb-1">Total Stok</div>
            <div class="text-lg font-bold text-slate-900">{simData.totalQty} <span class="text-xs font-normal">pcs</span></div>
          </div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="text-xs text-slate-500 font-medium mb-1">Potensi Omzet</div>
            <div class="text-lg font-bold text-blue-600">Rp {simData.totalOmzet.toLocaleString('id-ID')}</div>
          </div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="text-xs text-slate-500 font-medium mb-1">Total Modal</div>
            <div class="text-lg font-bold text-slate-700">Rp {simData.totalModal.toLocaleString('id-ID')}</div>
          </div>
          <div class="p-4 {simData.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} rounded-lg border">
            <div class="text-xs text-slate-500 font-medium mb-1">Laba Bersih Akhir</div>
            <div class="text-lg font-bold {simData.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}">
              {simData.netProfit >= 0 ? '+' : ''}Rp {simData.netProfit.toLocaleString('id-ID')}
            </div>
            <div class="text-xs font-bold mt-1 {simData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
              Margin: {simData.netProfitPct.toFixed(1)}%
            </div>
          </div>
        </div>

        <!-- Pembedahan Laba / Beban -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Rincian Komponen Laba Bersih</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-lg bg-green-50/50 border border-green-100">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                <h4 class="font-bold text-green-800">Total Profit Positif</h4>
              </div>
              <p class="text-xs text-green-700 mb-2">Laba yang dikumpulkan dari batch-batch dengan modal murah.</p>
              <div class="text-xl font-black text-green-600">+ Rp {simData.totalLabaPositif.toLocaleString('id-ID')}</div>
            </div>

            <div class="p-4 rounded-lg bg-amber-50/50 border border-amber-100">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                <h4 class="font-bold text-amber-800">Beban Fluktuasi</h4>
              </div>
              <p class="text-xs text-amber-700 mb-2">Kerugian yang disubsidi dari profit di atas (karena ada batch mahal).</p>
              <div class="text-xl font-black text-amber-600">- Rp {simData.totalBebanFluktuasi.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </div>

        <!-- Rincian per Batch -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Rincian Penjualan per Batch (Urutan FIFO)</h3>
          <div class="border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th class="p-3">Tanggal Diterima</th>
                  <th class="p-3">Sisa Stok</th>
                  <th class="p-3">Harga Modal (HPP)</th>
                  <th class="p-3">Status Profit</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each simData.batchDetails as b, i}
                  <tr class="hover:bg-slate-50 relative">
                    <td class="p-3 font-medium text-slate-700">
                      {b.receivedAt ? new Date(b.receivedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A'}
                      {#if i === simData.batchDetails.length - 1}
                        <span class="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Terbaru (Harga Pasar)</span>
                      {/if}
                    </td>
                    <td class="p-3 font-semibold text-slate-900">{b.qty} <span class="font-normal text-slate-500">pcs</span></td>
                    <td class="p-3 text-slate-600">Rp {b.cost.toLocaleString('id-ID')}</td>
                    <td class="p-3">
                      {#if b.profit >= 0}
                        <span class="text-green-600 font-bold">+ Rp {b.profit.toLocaleString('id-ID')}</span>
                      {:else}
                        <span class="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">- Rp {Math.abs(b.profit).toLocaleString('id-ID')}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
        <button onclick={closeSimModal} class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors">
          Batal / Tutup
        </button>
        {#if simBrandId}
          <button onclick={() => saveBrandPrice(simBrandId!, simSellingPrice)} disabled={savingBrand} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
            {#if savingBrand}
              <svg class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Menyimpan...
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Terapkan sebagai Harga Jual
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
