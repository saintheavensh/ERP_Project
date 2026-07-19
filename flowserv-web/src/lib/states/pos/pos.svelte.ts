import { PosProductsState } from './pos.products.svelte';
import { PosCartState } from './pos.cart.svelte';
import { PosCheckoutState } from './pos.checkout.svelte';
import { PosDraftsState } from './pos.drafts.svelte';

export class PosCommonState {
  processing = $state(false);
  errorMsg = $state('');
  successMsg = $state('');
}

export class PosState {
  commonState = new PosCommonState();
  products: PosProductsState;
  cart: PosCartState;
  checkout: PosCheckoutState;
  drafts: PosDraftsState;

  constructor(data: any) {
    this.products = new PosProductsState(data);
    this.cart = new PosCartState(this.products);
    this.checkout = new PosCheckoutState(data, this.products, this.cart, this.commonState);
    this.drafts = new PosDraftsState(data, this.products, this.cart, this.commonState);
  }

  formatRp(num: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  }
}

export function createPosState(data: any) {
  return new PosState(data);
}
