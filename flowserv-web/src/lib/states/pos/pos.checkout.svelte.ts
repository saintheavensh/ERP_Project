import { invalidateAll } from '$app/navigation';
import type { PosProductsState } from './pos.products.svelte';
import type { PosCartState } from './pos.cart.svelte';
import type { PosCommonState } from './pos.svelte';

export class PosCheckoutState {
  data: any = $state({});
  productsState: PosProductsState;
  cartState: PosCartState;
  commonState: PosCommonState;

  showCheckoutModal = $state(false);
  paymentMethod = $state('cash');
  selectedCustomerId = $state('');
  customerNameInput = $state('');

  constructor(data: any, productsState: PosProductsState, cartState: PosCartState, commonState: PosCommonState) {
    this.data = data;
    this.productsState = productsState;
    this.cartState = cartState;
    this.commonState = commonState;

    $effect(() => {
      if (this.selectedCustomerId) {
        const cust = this.customers.find((c: any) => c.id === this.selectedCustomerId);
        if (cust) this.customerNameInput = cust.name;
      }
    });
  }

  get paymentMethods() {
    return this.data.paymentMethods || [];
  }

  get customers() {
    return this.data.customers || [];
  }

  openCheckout() {
    if (this.cartState.cart.length === 0) return;
    this.commonState.errorMsg = '';
    this.showCheckoutModal = true;
  }

  async processCheckout() {
    if (this.paymentMethod === 'tempo' && !this.customerNameInput.trim()) {
      this.commonState.errorMsg = 'Nama pelanggan wajib diisi untuk pembayaran tempo!';
      return;
    }

    this.commonState.processing = true;
    this.commonState.errorMsg = '';
    
    try {
      const payload = {
        branchId: this.productsState.selectedBranchId,
        customerName: this.customerNameInput,
        serviceTicketId: undefined,
        paymentMethod: this.paymentMethod,
        discountAmount: this.cartState.discountAmount,
        items: this.cartState.cart.map((item: any) => ({
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
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal memproses transaksi');
      }

      this.commonState.successMsg = `Transaksi berhasil! Invoice: ${result.data.invoiceNumber}`;
      
      this.cartState.clearCart();
      this.customerNameInput = '';
      this.selectedCustomerId = '';
      this.cartState.discountAmount = 0;
      this.showCheckoutModal = false;
      
      await invalidateAll();
      setTimeout(() => this.commonState.successMsg = '', 5000);
      
    } catch (err: any) {
      this.commonState.errorMsg = err.message;
    } finally {
      this.commonState.processing = false;
    }
  }
}
