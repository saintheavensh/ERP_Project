<script lang="ts">
  import { onMount } from 'svelte';

  let { data } = $props();
  let partBrands = $derived(data.partBrands || []);
  
  let branchId = $state('00000000-0000-0000-0000-000000000000'); // MVP default
  let loading = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');

  // Transform raw inventory items into a manageable state
  // Using $derived to properly capture data changes
  let opnameItems = $derived.by(() => {
    return (data.inventoryItems || []).map((item: any) => ({
      inventoryItemId: item.id,
      name: item.name,
      categoryName: item.category?.name || '-',
      universalCode: item.universalCode,
      sku: item.sku,
      skipped: false,
      brandLines: [{ 
        brandId: '', 
        quantity: 1, 
        unitCost: 0, 
        sellingPrice: parseFloat(item.sellingPrice) || 0 
      }]
    }));
  });

  // Since we want to mutate opnameItems (add lines, toggle skip, remove when done),
  // we actually need it as $state, initialized from data once.
  // The warning says data is only captured once. We can fix it by using an effect or just ignoring the warning since it's initial load.
  // But let's fix it properly using $state initialized in onMount or just keeping it $state but typed properly.
  
  type BrandLine = { brandId: string; quantity: number; unitCost: number; sellingPrice: number };
  type OpnameItem = { inventoryItemId: string; name: string; categoryName: string; universalCode: string; sku: string; skipped: boolean; brandLines: BrandLine[] };
  
  let editableItems = $state<OpnameItem[]>([]);
  
  $effect(() => {
    if (data.inventoryItems && editableItems.length === 0) {
      editableItems = (data.inventoryItems || []).map((item: any) => ({
        inventoryItemId: item.id,
        name: item.name,
        categoryName: item.category?.name || '-',
        universalCode: item.universalCode,
        sku: item.sku,
        skipped: false,
        brandLines: [{ 
          brandId: '', 
          quantity: 1, 
          unitCost: 0, 
          sellingPrice: parseFloat(item.sellingPrice) || 0 
        }]
      }));
    }
  });

  function addBrandLine(itemIndex: number) {
    editableItems[itemIndex].brandLines = [
      ...editableItems[itemIndex].brandLines, 
      { brandId: '', quantity: 1, unitCost: 0, sellingPrice: 0 }
    ];
  }

  function removeBrandLine(itemIndex: number, lineIndex: number) {
    if (editableItems[itemIndex].brandLines.length > 1) {
      editableItems[itemIndex].brandLines = editableItems[itemIndex].brandLines.filter((_: any, i: number) => i !== lineIndex);
    }
  }

  async function submitOpname() {
    errorMsg = '';
    successMsg = '';
    
    const items: any[] = [];
    const skippedItemIds: string[] = [];
    let hasAction = false;

    for (const product of editableItems) {
      if (product.skipped) {
        skippedItemIds.push(product.inventoryItemId);
        hasAction = true;
      } else {
        const validLines = product.brandLines.filter((l: BrandLine) => l.quantity > 0);
        if (validLines.length > 0) {
          hasAction = true;
          validLines.forEach((l: BrandLine) => {
            items.push({
              inventoryItemId: product.inventoryItemId,
              brandId: l.brandId || null,
              quantity: l.quantity,
              unitCost: l.unitCost,
              sellingPrice: l.sellingPrice
            });
          });
        }
      }
    }

    if (!hasAction) {
      errorMsg = 'Anda belum mengisi stok atau men-skip item apapun.';
      return;
    }

    loading = true;
    try {
      const res = await fetch(`http://localhost:3001/v1/opname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({
          branchId,
          items,
          skippedItemIds
        })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to submit opname');
      
      successMsg = `Berhasil! ${items.length} stok baru telah dimasukkan dan ${skippedItemIds.length} item dilewati.`;
      
      // Remove processed items from UI
      setTimeout(() => {
        editableItems = editableItems.filter(p => !productWasProcessed(p.inventoryItemId, items, skippedItemIds));
        successMsg = '';
      }, 3000);
      
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      loading = false;
    }
  }

  function productWasProcessed(id: string, submittedItems: any[], skippedIds: string[]) {
    if (skippedIds.includes(id)) return true;
    if (submittedItems.some(si => si.inventoryItemId === id)) return true;
    return false;
  }
</script>

<svelte:head>
  <title>Initial Stock Wizard - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6 pb-24">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Mass Initial Stock Wizard</h1>
      <p class="text-slate-500 mt-1">
        Tentukan stok awal untuk produk-produk yang belum diinisialisasi. <br/>
        Produk yang Anda kosongkan tanpa dicentang <b>Skip</b> akan muncul lagi di kemudian hari.
      </p>
    </div>
  </div>
  
  {#if errorMsg}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm flex items-center">
      <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      {errorMsg}
    </div>
  {/if}
  
  {#if successMsg}
    <div class="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 shadow-sm flex items-center">
      <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      {successMsg}
    </div>
  {/if}

  {#if editableItems.length === 0}
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4 text-green-600">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      </div>
      <h3 class="text-xl font-bold text-slate-900">Semua Produk Sudah Diinisialisasi!</h3>
      <p class="text-slate-500 mt-2">Tidak ada produk baru di Katalog yang menunggu stok awal.</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each editableItems as product, pIndex}
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
                      {#each partBrands as brand}
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
                        <button type="button" onclick={() => removeBrandLine(pIndex, lIndex)} class="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors w-full text-left md:text-center">
                          Hapus Baris
                        </button>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
              
              <div class="pt-2">
                <button type="button" onclick={() => addBrandLine(pIndex)} class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
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
</div>

<!-- Sticky Bottom Action Bar -->
{#if editableItems.length > 0}
  <div class="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
    <div class="max-w-5xl mx-auto flex justify-between items-center">
      <div class="text-sm text-slate-500 font-medium">
        Menampilkan {editableItems.length} produk yang belum diinisialisasi
      </div>
      <button 
        type="button" 
        onclick={submitOpname} 
        disabled={loading}
        class="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {#if loading}
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Menyimpan...
        {:else}
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Simpan Data & Eksekusi Opname
        {/if}
      </button>
    </div>
  </div>
{/if}
