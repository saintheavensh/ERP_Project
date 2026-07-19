import type { PosProductsState } from './pos.products.svelte';

export class PosCartState {
  productsState: PosProductsState;
  cart: any[] = $state([]);
  discountAmount = $state(0);

  constructor(productsState: PosProductsState) {
    this.productsState = productsState;
  }

  get subtotal() {
    return this.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  get grandTotal() {
    return this.subtotal - this.discountAmount;
  }

  restoreCart() {
    const restore = localStorage.getItem('pos_restore_cart');
    if (restore) {
      try {
        const parsed = JSON.parse(restore);
        if (parsed.branchId) this.productsState.selectedBranchId = parsed.branchId;
        if (parsed.items && Array.isArray(parsed.items)) {
          this.cart = parsed.items;
        }
        localStorage.removeItem('pos_restore_cart');
      } catch (e) {
        console.error('Failed to parse restore cart', e);
      }
    }
  }

  addToCart(product: any) {
    if (!this.productsState.selectedBranchId) {
      alert("Pilih cabang terlebih dahulu");
      return;
    }

    const available = this.productsState.getStockForBranch(product, this.productsState.selectedBranchId);
    if (available <= 0) {
      alert("Stok kosong di cabang ini!");
      return;
    }

    let price = parseFloat(product.sellingPrice) || 0;

    const existingIndex = this.cart.findIndex(item => 
      item.inventoryItemId === product.inventoryItemId && 
      item.partBrandId === product.partBrandId
    );

    if (existingIndex !== -1) {
      const existing = this.cart[existingIndex];
      if (existing.quantity >= available) {
        alert("Stok tidak mencukupi!");
        return;
      }
      this.cart[existingIndex].quantity += 1;
      this.cart = [...this.cart];
    } else {
      this.cart = [...this.cart, {
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

  updateQty(index: number, delta: number) {
    const item = this.cart[index];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.cart = this.cart.filter((_, i) => i !== index);
    } else if (newQty > item.maxStock) {
      alert("Maksimal stok tercapai!");
    } else {
      item.quantity = newQty;
      this.cart = [...this.cart];
    }
  }

  clearCart() {
    this.cart = [];
  }
}
