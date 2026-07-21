import { invalidateAll } from '$app/navigation';
import { API_BASE } from '$lib/api/config';
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
  showCustomerDropdown = $state(false);
  // H13 — generated once when the checkout modal opens, not per fetch. A
  // retry (network drop, double click on "Bayar") reuses this same key so
  // the backend can recognize it as the same action, not a new sale.
  idempotencyKey = $state('');

  constructor(data: any, productsState: PosProductsState, cartState: PosCartState, commonState: PosCommonState) {
    this.data = data;
    this.productsState = productsState;
    this.cartState = cartState;
    this.commonState = commonState;
  }

  get paymentMethods() {
    return this.data.paymentMethods || [];
  }

  get customers() {
    return this.data.customers || [];
  }

  // Same "search as you type, pick from a dropdown" pattern used by ticket
  // intake — only shown while the typed text doesn't already match a selection.
  get filteredCustomers() {
    return this.customerNameInput && !this.selectedCustomerId
      ? this.customers
          .filter((c: any) => c.name.toLowerCase().includes(this.customerNameInput.toLowerCase()))
          .slice(0, 5)
      : [];
  }

  searchCustomer() {
    this.selectedCustomerId = '';
    this.showCustomerDropdown = true;
  }

  selectCustomer(customer: any) {
    this.selectedCustomerId = customer.id;
    this.customerNameInput = customer.name;
    this.showCustomerDropdown = false;
  }

  openCheckout() {
    if (this.cartState.cart.length === 0) return;
    this.commonState.errorMsg = '';
    // New action → new key. A retry within this same checkout attempt
    // (see processCheckout) must reuse it instead of generating a fresh one.
    this.idempotencyKey = crypto.randomUUID();
    this.showCheckoutModal = true;
  }

  async processCheckout() {
    // customerId is the link that actually enables credit — the backend
    // requires it for 'tempo' too (Zod + a Postgres CHECK), this is just the
    // fast client-side echo of that rule.
    if (this.paymentMethod === 'tempo' && !this.selectedCustomerId) {
      this.commonState.errorMsg = 'Pelanggan wajib dipilih dari daftar untuk pembayaran tempo!';
      return;
    }

    this.commonState.processing = true;
    this.commonState.errorMsg = '';

    try {
      const payload = {
        branchId: this.productsState.selectedBranchId,
        customerName: this.customerNameInput || undefined,
        customerId: this.selectedCustomerId || undefined,
        serviceTicketId: undefined,
        paymentMethod: this.paymentMethod,
        discountAmount: this.cartState.discountAmount,
        items: this.cartState.cart.map((item: any) =>
          item.sourceType === 'labor' || item.sourceType === 'fee'
            ? {
                sourceType: item.sourceType,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice
              }
            : {
                sourceType: 'part',
                inventoryItemId: item.inventoryItemId,
                partBrandId: item.partBrandId || undefined,
                quantity: item.quantity,
                unitPrice: item.unitPrice
              }
        )
      };

      const res = await fetch(`${API_BASE}/pos/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`,
          'Idempotency-Key': this.idempotencyKey
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
