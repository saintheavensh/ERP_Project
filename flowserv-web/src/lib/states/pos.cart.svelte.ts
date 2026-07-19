export function createPosCart(productsState: any) {
  let cart: any[] = $state([]);
  let discountAmount = $state(0);

  let subtotal = $derived(cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0));
  let grandTotal = $derived(subtotal - discountAmount);

  function restoreCart() {
    const restore = localStorage.getItem('pos_restore_cart');
    if (restore) {
      try {
        const parsed = JSON.parse(restore);
        if (parsed.branchId) productsState.selectedBranchId = parsed.branchId;
        if (parsed.items && Array.isArray(parsed.items)) {
          cart = parsed.items;
        }
        localStorage.removeItem('pos_restore_cart');
      } catch (e) {
        console.error('Failed to parse restore cart', e);
      }
    }
  }

  function addToCart(product: any) {
    if (!productsState.selectedBranchId) {
      alert("Pilih cabang terlebih dahulu");
      return;
    }

    const available = productsState.getStockForBranch(product, productsState.selectedBranchId);
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

  function clearCart() {
    cart = [];
  }

  return {
    get cart() { return cart; },
    set cart(val) { cart = val; },
    get discountAmount() { return discountAmount; },
    set discountAmount(val) { discountAmount = val; },
    get subtotal() { return subtotal; },
    get grandTotal() { return grandTotal; },
    restoreCart,
    addToCart,
    updateQty,
    clearCart
  };
}
