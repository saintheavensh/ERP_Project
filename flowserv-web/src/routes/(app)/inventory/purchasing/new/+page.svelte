<script lang="ts">
  import { untrack } from 'svelte';
  let { data } = $props();
  
  let branchId = $state(untrack(() => data.branches[0]?.id || ''));
  let supplierId = $state('');
  let expectedDeliveryDate = $state('');
  
  let allowedBrands = $state<any[]>([]);
  
  $effect(() => {
    if (supplierId) {
      fetch(`http://localhost:3001/v1/suppliers/${supplierId}`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      })
      .then(r => r.json())
      .then(res => {
        if (res.data && res.data.supplierBrands) {
          allowedBrands = res.data.supplierBrands.map((sb: any) => sb.partBrand);
        } else {
          allowedBrands = [];
        }
      })
      .catch(() => allowedBrands = []);
    } else {
      allowedBrands = [];
    }
  });
  
  let categoryGroups = $state([{ 
    categoryId: '', 
    lines: [{ brandId: '', inventoryItemId: '', quantity: 1, unitPrice: 0 }] 
  }]);
  
  let loading = $state(false);
  let errorMsg = $state('');
  
  function addCategoryGroup() {
    categoryGroups = [...categoryGroups, { categoryId: '', lines: [{ brandId: '', inventoryItemId: '', quantity: 1, unitPrice: 0 }] }];
  }
  
  function addLineToGroup(groupIndex: number) {
    categoryGroups[groupIndex].lines = [...categoryGroups[groupIndex].lines, { brandId: '', inventoryItemId: '', quantity: 1, unitPrice: 0 }];
  }
  
  function removeCategoryGroup(index: number) {
    if (categoryGroups.length > 1) {
      categoryGroups = categoryGroups.filter((_, i) => i !== index);
    }
  }
  
  function removeLineFromGroup(groupIndex: number, lineIndex: number) {
    if (categoryGroups[groupIndex].lines.length > 1) {
      categoryGroups[groupIndex].lines = categoryGroups[groupIndex].lines.filter((_, i) => i !== lineIndex);
    }
  }
  
  let estimatedTotal = $derived(
    categoryGroups.reduce((groupSum, group) => {
      return groupSum + group.lines.reduce((lineSum, line) => lineSum + (line.quantity * line.unitPrice), 0);
    }, 0)
  );
  
  async function submitOrder() {
    if (!branchId || !supplierId) {
      errorMsg = 'Please select a branch and a supplier.';
      return;
    }
    
    // Flatten and validate lines
    const validLines = categoryGroups.flatMap(group => 
      group.lines
        .filter(l => l.inventoryItemId && l.quantity > 0)
        .map(l => ({
          inventoryItemId: l.inventoryItemId,
          quantity: l.quantity,
          unitPrice: l.unitPrice
        }))
    );
    
    if (validLines.length === 0) {
      errorMsg = 'Please add at least one valid item to order.';
      return;
    }
    
    loading = true;
    errorMsg = '';
    
    try {
      const payload = {
        branchId,
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        lines: validLines
      };
      
      const res = await fetch('http://localhost:3001/v1/purchasing/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error?.message || 'Failed to create order');
      
      window.location.href = `/inventory/purchasing/${result.data.id}`;
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>New Purchase Order - FlowServ</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/inventory/purchasing" class="text-slate-500 hover:text-slate-800" aria-label="Back">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Create Purchase Order</h1>
      <p class="text-slate-500 mt-1">Draft a new order to a supplier. Prices here are estimates.</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
    <form onsubmit={(e) => { e.preventDefault(); submitOrder(); }} class="space-y-6">
      {#if errorMsg}
        <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {errorMsg}
        </div>
      {/if}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="branch">Receiving Branch *</label>
          <select id="branch" bind:value={branchId} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            {#each data.branches as branch}
              <option value={branch.id}>{branch.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="supplier">Supplier *</label>
          <select id="supplier" bind:value={supplierId} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="" disabled>Select a supplier...</option>
            {#each data.suppliers as supplier}
              <option value={supplier.id}>{supplier.name} ({supplier.type})</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="date">Expected Delivery Date</label>
          <input id="date" type="date" bind:value={expectedDeliveryDate} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
      </div>
      
      <div class="pt-6 border-t border-slate-200">
        <div class="flex justify-between items-end mb-4">
          <h3 class="font-semibold text-slate-900">Order Items</h3>
        </div>
        
        <div class="space-y-6">
          {#each categoryGroups as group, gIndex}
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              {#if categoryGroups.length > 1}
                <button type="button" onclick={() => removeCategoryGroup(gIndex)} class="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium">
                  Hapus Kategori
                </button>
              {/if}
              
              <div class="mb-4 pr-32">
                <label class="block text-sm font-bold text-slate-700 mb-2" for={`group-cat-${gIndex}`}>Kategori Sparepart</label>
                <select id={`group-cat-${gIndex}`} bind:value={group.categoryId} onchange={() => { group.lines.forEach(l => l.inventoryItemId = ''); }} class="w-full md:w-1/2 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-medium">
                  <option value="">-- Pilih Kategori --</option>
                  {#each data.categories as cat}
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
                        <button type="button" onclick={() => removeLineFromGroup(gIndex, lIndex)} class="text-red-500 hover:text-red-700 text-sm font-medium" disabled={group.lines.length === 1}>
                          Hapus Item
                        </button>
                      </div>
                      
                      <div class="grid grid-cols-1 gap-4">
                        <div>
                          <label class="block text-xs font-medium text-slate-500 mb-1" for={`item-${gIndex}-${lIndex}`}>Produk (Tipe / Universal Code) *</label>
                          <select id={`item-${gIndex}-${lIndex}`} bind:value={line.inventoryItemId} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                            <option value="" disabled>-- Pilih Produk --</option>
                            {#each data.inventoryItems.filter((item: any) => item.categoryId === group.categoryId) as item}
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
                    <button type="button" onclick={() => addLineToGroup(gIndex)} class="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                      Tambah Item {data.categories.find((c: any) => c.id === group.categoryId)?.name || ''}
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        
        <div class="mt-4 pb-4 border-b border-slate-200">
          <button type="button" onclick={addCategoryGroup} class="px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 w-full text-center flex justify-center items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            Tambah Kategori Baru (Misal: Pesan Baterai)
          </button>
        </div>
        
        <div class="mt-4 flex justify-end">
          <div class="text-right">
            <p class="text-sm text-slate-500">Estimated Total</p>
            <p class="text-xl font-bold text-slate-900 mt-1">Rp {estimatedTotal.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
      
      <div class="pt-6 border-t border-slate-200 flex justify-end gap-3">
        <a href="/inventory/purchasing" class="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</a>
        <button type="submit" disabled={loading} class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Draft PO'}
        </button>
      </div>
    </form>
  </div>
</div>
