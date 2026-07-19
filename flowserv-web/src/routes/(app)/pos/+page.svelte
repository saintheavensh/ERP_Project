<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  
  import ProductGrid from '$lib/components/pos/ProductGrid.svelte';
  import CartSidebar from '$lib/components/pos/CartSidebar.svelte';
  import CheckoutModal from '$lib/components/pos/CheckoutModal.svelte';
  import DraftsModal from '$lib/components/pos/DraftsModal.svelte';

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
  let selectedCustomerId = $state(''); 
  let customerNameInput = $state(''); 
  let searchQuery = $state(''); 

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
      
      cart = [];
      customerNameInput = '';
      selectedCustomerId = '';
      discountAmount = 0;
      showCheckoutModal = false;
      
      await invalidateAll();
      setTimeout(() => successMsg = '', 5000);
      
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      processing = false;
    }
  }
  
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

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
        cart = []; 
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
    <ProductGrid 
      bind:searchQuery
      {selectedBranchId}
      {filteredProducts}
      {getStockForBranch}
      {addToCart}
      {formatRp}
    />

    <CartSidebar 
      bind:cart
      bind:discountAmount
      {updateQty}
      {openCheckout}
      {subtotal}
      {grandTotal}
      {formatRp}
    />
  </div>
</div>

<CheckoutModal 
  bind:showCheckoutModal
  bind:paymentMethod
  bind:customerNameInput
  {errorMsg}
  {grandTotal}
  {paymentMethods}
  {processing}
  {processCheckout}
  {formatRp}
/>

<DraftsModal 
  bind:showDraftsModal
  {loadingDrafts}
  {drafts}
  {loadDraft}
  {deleteDraft}
/>
