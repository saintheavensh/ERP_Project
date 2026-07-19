import { createPosProducts } from './pos.products.svelte';
import { createPosCart } from './pos.cart.svelte';
import { createPosCheckout } from './pos.checkout.svelte';
import { createPosDrafts } from './pos.drafts.svelte';

export function createPosState(data: any) {
  // Shared common UI state
  let processing = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');

  const commonState = {
    get processing() { return processing; },
    set processing(val) { processing = val; },
    get errorMsg() { return errorMsg; },
    set errorMsg(val) { errorMsg = val; },
    get successMsg() { return successMsg; },
    set successMsg(val) { successMsg = val; },
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  // Instantiate composable state modules
  const productsState = createPosProducts(data);
  const cartState = createPosCart(productsState);
  const checkoutState = createPosCheckout(data, productsState, cartState, commonState);
  const draftsState = createPosDrafts(data, productsState, cartState, commonState);

  // Return a single glued object so the UI components don't break
  return {
    ...productsState,
    ...cartState,
    ...checkoutState,
    ...draftsState,
    ...commonState,
    formatRp
  };
}
