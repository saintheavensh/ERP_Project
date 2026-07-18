<script lang="ts">
  let { data } = $props();
  let inventory = $derived(data.inventory);
  let categories = $derived(data.categories || []);
  let brands = $derived(data.brands || []);
  
  let showAddModal = $state(false);
  let form = $state({
    sku: `SKU-${Math.floor(Math.random() * 100000)}`,
    universalCode: '',
    name: '',
    categoryId: '',
    partBrandId: '',
    unitOfMeasure: 'pcs',
    sellingPrice: 0,
    reorderPoint: 5
  });

  function resetForm() {
    form = {
      sku: `SKU-${Math.floor(Math.random() * 1000000)}`,
      universalCode: '',
      name: '',
      categoryId: '',
      partBrandId: '',
      unitOfMeasure: 'pcs',
      sellingPrice: 0,
      reorderPoint: 5
    };
  }
  let loading = $state(false);
  let errorMsg = $state('');

  function getCategoryName(id: string) {
    if (!id) return '-';
    const cat = categories.find((c: any) => c.id === id);
    return cat ? cat.name : '-';
  }

  function generateUniversalCode() {
    if (!form.categoryId || !form.name) {
      errorMsg = 'Harap isi Kategori dan Item Name terlebih dahulu untuk men-generate Universal Code.';
      return;
    }
    const catName = getCategoryName(form.categoryId);
    const code = `${catName}-${form.name}`.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-');
    form.universalCode = code;
    errorMsg = '';
  }

  async function addItem() {
    loading = true;
    errorMsg = '';
    
    try {
      const payload: any = { ...form };
      if (!payload.categoryId) delete payload.categoryId; // Optional
      if (!payload.partBrandId) delete payload.partBrandId; // Optional
      if (!payload.universalCode) delete payload.universalCode; // Optional
      
      const res = await fetch('http://localhost:3001/v1/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to add item');
      }
      
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/v1/inventory/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to delete item');
      }
      
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }
</script>

<svelte:head>
  <title>Inventory - FlowServ</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Inventory Management</h1>
      <p class="text-slate-500 mt-1">Manage parts, stock levels, and reorder points.</p>
    </div>
    <div class="flex gap-3">
      <a href="/inventory/categories" class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors">
        Manage Categories
      </a>
      <button class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm" onclick={() => showAddModal = true}>
        + Add Item
      </button>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">SKU</th>
          <th class="p-4">Item Name</th>
          <th class="p-4">Category</th>
          <th class="p-4">Available</th>
          <th class="p-4">Reserved</th>
          <th class="p-4">Status</th>
          <th class="p-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each inventory as item}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-mono text-sm text-slate-500">{item.sku}</td>
            <td class="p-4 font-medium text-slate-900">{item.name}</td>
            <td class="p-4 text-slate-600">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                {getCategoryName(item.categoryId)}
              </span>
            </td>
            <td class="p-4 font-semibold text-slate-900">{item.totalAvailable} <span class="text-xs font-normal text-slate-500">{item.unitOfMeasure}</span></td>
            <td class="p-4 text-amber-600">{item.totalReserved} <span class="text-xs">{item.unitOfMeasure}</span></td>
            <td class="p-4">
              <div class="flex flex-col gap-1 items-start">
                {#if !item.isStockInitialized}
                  <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">New / Uninitialized</span>
                {/if}
                {#if item.totalAvailable <= item.reorderPoint}
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Low Stock</span>
                {:else}
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">In Stock</span>
                {/if}
                
                <!-- Info Kompatibilitas -->
                {#if item.unresolvedCompatibility && item.unresolvedCompatibility.length > 0}
                  <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200" title="Ada model yang belum terhubung">Compat: Warn</span>
                {:else if item.compatibility && item.compatibility.length > 0}
                  <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">Compat: OK</span>
                {:else}
                  <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">No Compat</span>
                {/if}
              </div>
            </td>
            <td class="p-4 text-right">
              <div class="flex items-center justify-end gap-3">
                <a href="/inventory/{item.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">View</a>
                <button type="button" class="text-red-500 hover:text-red-700 text-sm font-medium" onclick={() => deleteItem(item.id)}>Delete</button>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="7" class="p-8 text-center text-slate-500">
              No inventory items found. Add a new item to get started.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if showAddModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Add New Inventory Item</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Close Modal" onclick={() => showAddModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <form onsubmit={(e) => { e.preventDefault(); addItem(); }} class="p-6 space-y-4">
        {#if errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {errorMsg}
          </div>
        {/if}
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="sku">SKU (Barcode) *</label>
            <input id="sku" type="text" bind:value={form.sku} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="e.g. SKU-001">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="universalCode">Universal Code *</label>
            <div class="flex gap-2">
              <input id="universalCode" type="text" bind:value={form.universalCode} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="e.g. BLP673">
              <button type="button" onclick={generateUniversalCode} class="px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium whitespace-nowrap" title="Generate dari Kategori + Nama">
                Generate
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Item Name (Model) *</label>
          <input id="name" type="text" bind:value={form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Baterai Oppo A3s">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="category">Category</label>
            <select id="category" bind:value={form.categoryId} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">-- No Category --</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="uom">Unit of Measure</label>
            <select id="uom" bind:value={form.unitOfMeasure} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="pcs">Pcs</option>
              <option value="box">Box</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="sellprice">Base Selling Price</label>
            <input id="sellprice" type="number" min="0" bind:value={form.sellingPrice} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-green-700 bg-green-50 font-medium">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="reorder">Reorder Point</label>
            <input id="reorder" type="number" min="0" bind:value={form.reorderPoint} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <p class="text-[10px] text-slate-500 mt-1">Alert when stock falls to this number.</p>
          </div>
        </div>
        
        <div class="pt-4 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => showAddModal = false}>Cancel</button>
          <button type="submit" disabled={loading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
