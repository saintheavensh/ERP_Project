<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  
  // Data lists
  let branches = $derived(data.branches);
  let products = $derived(data.products);
  let flattenedProducts = $derived.by(() => {
    const flat = [];
    for (const p of products) {
      if (p.brandPricing && p.brandPricing.length > 0) {
        for (const bp of p.brandPricing) {
          flat.push({
            ...p,
            inventoryItemId: p.id,
            partBrandId: bp.partBrandId,
            name: p.name,
            brandName: bp.partBrand?.name || 'Unknown',
            categoryName: p.category?.name || 'Uncategorized',
            sellingPrice: bp.sellingPrice,
          });
        }
      } else {
        flat.push({ 
          ...p, 
          inventoryItemId: p.id, 
          partBrandId: null, 
          brandName: p.partBrand?.name || 'General', 
          categoryName: p.category?.name || 'Uncategorized' 
        });
      }
    }
    return flat;
  });
  
  let customers = $derived(data.customers);
  let paymentMethods = $derived(data.paymentMethods);

  // Selected state
  let selectedBranchId = $state('');
  let selectedCustomerId = $state(''); // Optional
  let customerNameInput = $state(''); // Input manual atau dari pilihan
  let searchQuery = $state(''); // Search query for POS

  let filteredProducts = $derived.by(() => {
    if (!searchQuery) return flattenedProducts;
    const terms = searchQuery.toLowerCase().split(' ').filter(t => t);
    return flattenedProducts.filter(p => {
      const searchableStr = `${p.name} ${p.brandName} ${p.categoryName} ${p.sku}`.toLowerCase();
      return terms.every(term => searchableStr.includes(term));
    });
  });

  // Cart state
  let cart: any[] = $state([]);
  let discountAmount = $state(0);
  // Draft state
  let showDraftsModal = $state(false);
  let drafts: any[] = $state([]);
  let loadingDrafts = $state(false);
  
  // Modal state
  let showCheckoutModal = $state(false);
  let paymentMethod = $state('cash');
  
  // Processing state
  let processing = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');

  // Auto-select branch if only one exists or user has a preference
  $effect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      selectedBranchId = branches[0].id;
    }
  });

  // Reactive calculations
  let subtotal = $derived(cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0));
  let grandTotal = $derived(subtotal - discountAmount);

  // Watch selected customer to auto-fill name
  $effect(() => {
    if (selectedCustomerId) {
      const cust = customers.find((c: any) => c.id === selectedCustomerId);
      if (cust) customerNameInput = cust.name;
    }
  });

  onMount(() => {
    // Check if we have a cart to restore (from History Edit/Re-Cart)
    const restore = localStorage.getItem('pos_restore_cart');
    if (restore) {
      try {
        const parsed = JSON.parse(restore);
        if (parsed.branchId) selectedBranchId = parsed.branchId;
        if (parsed.items && Array.isArray(parsed.items)) {
          cart = parsed.items;
        }
        localStorage.removeItem('pos_restore_cart');
      } catch (e) {
        console.error('Failed to parse restore cart', e);
      }
    }
  });

  function getStockForBranch(product: any, branchId: string) {
    if (product.partBrandId !== undefined) {
      if (!product.brandStock || !product.brandStock[branchId]) return 0;
      const bId = product.partBrandId || 'generic';
      return product.brandStock[branchId][bId] || 0;
    }
    
    // Fallback to total stock levels for items without brands
    if (!product.stockLevels) return 0;
    const level = product.stockLevels.find((l: any) => l.branchId === branchId);
    return level ? level.quantityAvailable : 0;
  }

  function addToCart(product: any) {
    if (!selectedBranchId) {
      alert("Pilih cabang terlebih dahulu");
      return;
    }

    const available = getStockForBranch(product, selectedBranchId);
    if (available <= 0) {
      alert("Stok kosong di cabang ini!");
      return;
    }

    let price = parseFloat(product.sellingPrice) || 0;

    // Check by inventoryItemId AND partBrandId
    const existingIndex = cart.findIndex(item => 
      item.inventoryItemId === product.inventoryItemId && 
      item.partBrandId === product.partBrandId
    );

    if (existingIndex !== -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= available) {
        alert("Stok tidak mencukupi!");
        return;
      }
      cart[existingIndex].quantity += 1;
      cart = [...cart];
    } else {
      cart = [...cart, {
        inventoryItemId: product.inventoryItemId,
        partBrandId: product.partBrandId,
        name: product.name,
        sku: product.sku,
        unitPrice: price,
        quantity: 1,
        maxStock: available
      }];
    }
  }

  function updateQty(index: number, delta: number) {
    const item = cart[index];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      cart = cart.filter((_, i) => i !== index);
    } else if (newQty > item.maxStock) {
      alert("Maksimal stok tercapai!");
    } else {
      item.quantity = newQty;
      cart = [...cart];
    }
  }

  function openCheckout() {
    if (cart.length === 0) return;
    errorMsg = '';
    showCheckoutModal = true;
  }

  async function processCheckout() {
    if (paymentMethod === 'tempo' && !customerNameInput.trim()) {
      errorMsg = 'Nama pelanggan wajib diisi untuk pembayaran tempo!';
      return;
    }

    processing = true;
    errorMsg = '';
    
    try {
      const token = data.token;
      
      const payload = {
        branchId: selectedBranchId,
        customerName: customerNameInput,
        serviceTicketId: undefined,
        paymentMethod,
        discountAmount,
        items: cart.map(item => ({
          inventoryItemId: item.inventoryItemId,
          partBrandId: item.partBrandId || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      const res = await fetch('http://localhost:3001/v1/pos/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal memproses transaksi');
      }

      successMsg = `Transaksi berhasil! Invoice: ${result.data.invoiceNumber}`;
      
      // Reset
      cart = [];
      customerNameInput = '';
      selectedCustomerId = '';
      discountAmount = 0;
      showCheckoutModal = false;
      
      // Refresh inventory data
      await invalidateAll();
      
      setTimeout(() => successMsg = '', 5000);
      
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      processing = false;
    }
  }
  
  // Format currency
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  // ============================
  // DRAFT LOGIC
  // ============================
  async function saveDraft() {
    if (cart.length === 0) {
      alert("Keranjang kosong!");
      return;
    }
    const name = prompt("Masukkan nama untuk draft pesanan ini (misal: 'Pesanan WA - Budi'):");
    if (!name) return;

    processing = true;
    try {
      const res = await fetch('http://localhost:3001/v1/pos/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({
          branchId: selectedBranchId,
          name,
          cartItems: cart
        })
      });
      if (res.ok) {
        successMsg = `Draft '${name}' berhasil disimpan!`;
        cart = []; // clear cart
      } else {
        const err = await res.json();
        alert('Gagal menyimpan draft: ' + err.error?.message);
      }
    } catch (e) {
      alert('Error saat menghubungi server.');
    } finally {
      processing = false;
      setTimeout(() => successMsg = '', 3000);
    }
  }

  async function openDrafts() {
    if (!selectedBranchId) {
      alert('Pilih cabang terlebih dahulu');
      return;
    }
    showDraftsModal = true;
    loadingDrafts = true;
    try {
      const res = await fetch(`http://localhost:3001/v1/pos/drafts?branchId=${selectedBranchId}`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      if (res.ok) {
        drafts = (await res.json()).data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingDrafts = false;
    }
  }

  async function loadDraft(draft: any) {
    cart = draft.cartItems;
    showDraftsModal = false;
    successMsg = `Draft '${draft.name}' dimuat.`;
    setTimeout(() => successMsg = '', 3000);

    // Delete draft from backend since it's now loaded
    fetch(`http://localhost:3001/v1/pos/drafts/${draft.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${data.token}` }
    }).catch(console.error);
  }

  async function deleteDraft(id: string, e: Event) {
    e.stopPropagation();
    if (!confirm('Hapus draft ini secara permanen?')) return;
    
    try {
      await fetch(`http://localhost:3001/v1/pos/drafts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      drafts = drafts.filter(d => d.id !== id);
    } catch (e) {
      console.error(e);
    }
  }
</script>

<div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
  <!-- Header / Controls -->
  <div class="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between shadow-sm z-10">
    <div class="flex items-center space-x-6">
      <h1 class="text-xl font-bold text-slate-800">Point of Sales</h1>
      
      <div class="flex items-center space-x-2">
        <label for="branch" class="text-sm font-medium text-slate-600">Cabang:</label>
        <select id="branch" bind:value={selectedBranchId} class="text-sm border-slate-200 rounded-lg py-1.5 focus:ring-blue-500">
          {#each branches as branch}
            <option value={branch.id}>{branch.name}</option>
          {/each}
        </select>
      </div>
    </div>
    
    {#if successMsg}
      <div class="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
        {successMsg}
      </div>
    {/if}

    <div class="ml-auto flex items-center space-x-3">
      <button onclick={openDrafts} class="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors border border-indigo-200">
        Daftar Draft
      </button>
      
      <button onclick={saveDraft} disabled={cart.length === 0 || processing} class="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200">
        Simpan Draft
      </button>
      
      <div class="h-6 w-px bg-slate-300 mx-2"></div>

      <a href="/pos/history" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Riwayat
      </a>
    </div>
  </div>

  <!-- Main POS Area -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Left: Product Catalog -->
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

    <!-- Right: Cart -->
    <div class="w-96 flex flex-col bg-white shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
      <div class="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
        <h2 class="font-semibold flex items-center"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>Keranjang ({cart.length})</h2>
        {#if cart.length > 0}
          <button class="text-xs text-slate-300 hover:text-white transition-colors" onclick={() => cart = []}>Kosongkan</button>
        {/if}
      </div>
      
      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto p-4">
        {#if cart.length === 0}
          <div class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <svg class="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <p>Keranjang masih kosong</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each cart as item, i}
              <div class="flex flex-col bg-slate-50 border border-slate-100 rounded-lg p-3">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h4 class="text-sm font-medium text-slate-800 leading-tight">{item.name}</h4>
                    <span class="text-[10px] font-mono text-slate-500">{item.sku}</span>
                  </div>
                  <span class="text-sm font-semibold text-slate-700">{formatRp(item.unitPrice * item.quantity)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-slate-500">{formatRp(item.unitPrice)} /pcs</span>
                  <div class="flex items-center space-x-3 bg-white border border-slate-200 rounded-md">
                    <button class="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-l-md" onclick={() => updateQty(i, -1)}>-</button>
                    <span class="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button class="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-r-md" onclick={() => updateQty(i, 1)}>+</button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Cart Footer / Totals -->
      <div class="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <div class="space-y-2 mb-4">
          <div class="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{formatRp(subtotal)}</span>
          </div>
          <div class="flex justify-between text-sm items-center">
            <span class="text-slate-600">Diskon (Rp)</span>
            <input type="number" bind:value={discountAmount} min="0" max={subtotal} class="w-24 text-right px-2 py-1 border border-slate-300 rounded text-sm bg-white outline-none focus:border-blue-500">
          </div>
          <div class="pt-2 mt-2 border-t border-slate-200 flex justify-between items-end">
            <span class="font-medium text-slate-800">Total</span>
            <span class="text-xl font-bold text-blue-600">{formatRp(grandTotal)}</span>
          </div>
        </div>
        
        <button 
          onclick={openCheckout}
          disabled={cart.length === 0}
          class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
        >
          <span>Lanjut Pembayaran</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Checkout Modal -->
{#if showCheckoutModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-800">Pembayaran</h3>
        <button aria-label="Tutup" onclick={() => showCheckoutModal = false} class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto">
        {#if errorMsg}
          <div class="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {errorMsg}
          </div>
        {/if}

        <div class="mb-6 pb-6 border-b border-dashed border-slate-200">
          <div class="text-center">
            <p class="text-sm text-slate-500 mb-1">Total Tagihan</p>
            <p class="text-3xl font-bold text-slate-900">{formatRp(grandTotal)}</p>
          </div>
        </div>
        
        <div class="space-y-5">
          <!-- Customer Input -->
          <div>
            <label for="customerName" class="block text-sm font-medium text-slate-700 mb-2">Nama Pelanggan (Opsional)</label>
            <div class="relative">
              <input 
                id="customerName"
                type="text" 
                bind:value={customerNameInput} 
                placeholder="Pelanggan Umum..." 
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
              <!-- Optional: dropdown list of customers if we want to add an autocomplete later -->
            </div>
          </div>
          
          <!-- Payment Method -->
          <div>
            <span class="block text-sm font-medium text-slate-700 mb-2">Metode Pembayaran</span>
            <div class="grid grid-cols-2 gap-3">
              {#each paymentMethods as pm}
                <label class="relative flex items-center justify-center p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors {paymentMethod === pm.type ? 'border-blue-500 bg-blue-50/50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 text-slate-600'}">
                  <input type="radio" name="payment" value={pm.type} bind:group={paymentMethod} class="sr-only">
                  <span class="text-sm font-medium">{pm.name}</span>
                </label>
              {/each}
              
              {#if paymentMethods.length === 0}
                <p class="text-sm text-slate-500 col-span-2 text-center py-2">Tidak ada metode pembayaran aktif.</p>
              {/if}
            </div>
            {#if paymentMethod === 'tempo'}
              <p class="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start">
                <svg class="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Nama pelanggan WAJIB diisi saat memilih pembayaran tempo.
              </p>
            {/if}
          </div>
        </div>
      </div>
      
      <div class="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <button 
          onclick={processCheckout}
          disabled={processing || (paymentMethod === 'tempo' && !customerNameInput.trim())}
          class="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center"
        >
          {#if processing}
            <svg class="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Memproses...
          {:else}
            Proses Transaksi
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Drafts Modal -->
{#if showDraftsModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 class="text-xl font-bold text-slate-800">Daftar Pesanan Draft</h2>
        <button aria-label="Tutup" onclick={() => showDraftsModal = false} class="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        {#if loadingDrafts}
          <div class="text-center py-8 text-slate-500">Memuat draft...</div>
        {:else if drafts.length === 0}
          <div class="text-center py-12 text-slate-500">
            <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p>Belum ada pesanan draft tersimpan.</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each drafts as draft}
              <div 
                role="button" 
                tabindex="0" 
                class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex justify-between items-center cursor-pointer group" 
                onclick={() => loadDraft(draft)}
                onkeydown={(e) => e.key === 'Enter' && loadDraft(draft)}
              >
                <div>
                  <h3 class="font-bold text-slate-800 flex items-center gap-2">
                    {draft.name}
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{draft.cartItems.length} item</span>
                  </h3>
                  <p class="text-sm text-slate-500 mt-1">Dibuat: {new Date(draft.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                    Lanjutkan Pembayaran
                  </button>
                  <button onclick={(e) => deleteDraft(draft.id, e)} class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Permanen">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
