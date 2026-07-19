import { invalidateAll } from '$app/navigation';

export function createPosState(data: any) {
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

  let selectedBranchId = $state('');
  let selectedCustomerId = $state(''); 
  let customerNameInput = $state(''); 
  let searchQuery = $state(''); 

  let filteredProducts = $derived.by(() => {
    if (!searchQuery) return flattenedProducts;
    const terms = searchQuery.toLowerCase().split(' ').filter((t: string) => t);
    return flattenedProducts.filter((p: any) => {
      const searchableStr = `${p.name} ${p.brandName} ${p.categoryName} ${p.sku}`.toLowerCase();
      return terms.every((term: string) => searchableStr.includes(term));
    });
  });

  let cart: any[] = $state([]);
  let discountAmount = $state(0);
  
  let showDraftsModal = $state(false);
  let drafts: any[] = $state([]);
  let loadingDrafts = $state(false);
  
  let showCheckoutModal = $state(false);
  let paymentMethod = $state('cash');
  
  let processing = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');

  let subtotal = $derived(cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0));
  let grandTotal = $derived(subtotal - discountAmount);

  $effect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      selectedBranchId = branches[0].id;
    }
  });

  $effect(() => {
    if (selectedCustomerId) {
      const cust = customers.find((c: any) => c.id === selectedCustomerId);
      if (cust) customerNameInput = cust.name;
    }
  });

  function restoreCart() {
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
  }

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

  function setCart(newCart: any[]) { cart = newCart; }
  function setDiscountAmount(amount: number) { discountAmount = amount; }
  function setSearchQuery(query: string) { searchQuery = query; }
  function setShowCheckoutModal(val: boolean) { showCheckoutModal = val; }
  function setPaymentMethod(val: string) { paymentMethod = val; }
  function setCustomerNameInput(val: string) { customerNameInput = val; }
  function setShowDraftsModal(val: boolean) { showDraftsModal = val; }
  function setSelectedBranchId(val: string) { selectedBranchId = val; }
  function clearCart() { cart = []; }

  return {
    get branches() { return branches; },
    get paymentMethods() { return paymentMethods; },
    get selectedBranchId() { return selectedBranchId; },
    set selectedBranchId(val) { selectedBranchId = val; },
    get searchQuery() { return searchQuery; },
    set searchQuery(val) { searchQuery = val; },
    get filteredProducts() { return filteredProducts; },
    get cart() { return cart; },
    set cart(val) { cart = val; },
    get discountAmount() { return discountAmount; },
    set discountAmount(val) { discountAmount = val; },
    get showDraftsModal() { return showDraftsModal; },
    set showDraftsModal(val) { showDraftsModal = val; },
    get drafts() { return drafts; },
    get loadingDrafts() { return loadingDrafts; },
    get showCheckoutModal() { return showCheckoutModal; },
    set showCheckoutModal(val) { showCheckoutModal = val; },
    get paymentMethod() { return paymentMethod; },
    set paymentMethod(val) { paymentMethod = val; },
    get customerNameInput() { return customerNameInput; },
    set customerNameInput(val) { customerNameInput = val; },
    get processing() { return processing; },
    get errorMsg() { return errorMsg; },
    get successMsg() { return successMsg; },
    get subtotal() { return subtotal; },
    get grandTotal() { return grandTotal; },

    restoreCart,
    getStockForBranch,
    addToCart,
    updateQty,
    openCheckout,
    processCheckout,
    formatRp,
    saveDraft,
    openDrafts,
    loadDraft,
    deleteDraft,
    clearCart
  };
}
