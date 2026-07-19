import type { PosProductsState } from './pos.products.svelte';
import type { PosCartState } from './pos.cart.svelte';
import type { PosCommonState } from './pos.svelte';

export class PosDraftsState {
  data: any = $state({});
  productsState: PosProductsState;
  cartState: PosCartState;
  commonState: PosCommonState;

  showDraftsModal = $state(false);
  drafts: any[] = $state([]);
  loadingDrafts = $state(false);

  constructor(data: any, productsState: PosProductsState, cartState: PosCartState, commonState: PosCommonState) {
    this.data = data;
    this.productsState = productsState;
    this.cartState = cartState;
    this.commonState = commonState;
  }

  async saveDraft() {
    if (this.cartState.cart.length === 0) {
      alert("Keranjang kosong!");
      return;
    }
    const name = prompt("Masukkan nama untuk draft pesanan ini (misal: 'Pesanan WA - Budi'):");
    if (!name) return;

    this.commonState.processing = true;
    try {
      const res = await fetch('http://localhost:3001/v1/pos/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify({
          branchId: this.productsState.selectedBranchId,
          name,
          cartItems: this.cartState.cart
        })
      });
      if (res.ok) {
        this.commonState.successMsg = `Draft '${name}' berhasil disimpan!`;
        this.cartState.clearCart(); 
      } else {
        const err = await res.json();
        alert('Gagal menyimpan draft: ' + err.error?.message);
      }
    } catch (e) {
      alert('Error saat menghubungi server.');
    } finally {
      this.commonState.processing = false;
      setTimeout(() => this.commonState.successMsg = '', 3000);
    }
  }

  async openDrafts() {
    if (!this.productsState.selectedBranchId) {
      alert('Pilih cabang terlebih dahulu');
      return;
    }
    this.showDraftsModal = true;
    this.loadingDrafts = true;
    try {
      const res = await fetch(`http://localhost:3001/v1/pos/drafts?branchId=${this.productsState.selectedBranchId}`, {
        headers: { 'Authorization': `Bearer ${this.data.token}` }
      });
      if (res.ok) {
        this.drafts = (await res.json()).data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingDrafts = false;
    }
  }

  async loadDraft(draft: any) {
    this.cartState.cart = draft.cartItems;
    this.showDraftsModal = false;
    this.commonState.successMsg = `Draft '${draft.name}' dimuat.`;
    setTimeout(() => this.commonState.successMsg = '', 3000);

    fetch(`http://localhost:3001/v1/pos/drafts/${draft.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.data.token}` }
    }).catch(console.error);
  }

  async deleteDraft(id: string, e: Event) {
    e.stopPropagation();
    if (!confirm('Hapus draft ini secara permanen?')) return;
    
    try {
      await fetch(`http://localhost:3001/v1/pos/drafts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.data.token}` }
      });
      this.drafts = this.drafts.filter((d: any) => d.id !== id);
    } catch (e) {
      console.error(e);
    }
  }
}
