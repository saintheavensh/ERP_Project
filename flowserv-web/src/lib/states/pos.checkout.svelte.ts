import { invalidateAll } from '$app/navigation';

export function createPosCheckout(data: any, productsState: any, cartState: any, commonState: any) {
  let paymentMethods = $derived(data.paymentMethods);
  let customers = $derived(data.customers);

  let showCheckoutModal = $state(false);
  let paymentMethod = $state('cash');
  let selectedCustomerId = $state(''); 
  let customerNameInput = $state(''); 

  $effect(() => {
    if (selectedCustomerId) {
      const cust = customers.find((c: any) => c.id === selectedCustomerId);
      if (cust) customerNameInput = cust.name;
    }
  });

  function openCheckout() {
    if (cartState.cart.length === 0) return;
    commonState.errorMsg = '';
    showCheckoutModal = true;
  }

  async function processCheckout() {
    if (paymentMethod === 'tempo' && !customerNameInput.trim()) {
      commonState.errorMsg = 'Nama pelanggan wajib diisi untuk pembayaran tempo!';
      return;
    }

    commonState.processing = true;
    commonState.errorMsg = '';
    
    try {
      const payload = {
        branchId: productsState.selectedBranchId,
        customerName: customerNameInput,
        serviceTicketId: undefined,
        paymentMethod,
        discountAmount: cartState.discountAmount,
        items: cartState.cart.map((item: any) => ({
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
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal memproses transaksi');
      }

      commonState.successMsg = `Transaksi berhasil! Invoice: ${result.data.invoiceNumber}`;
      
      cartState.clearCart();
      customerNameInput = '';
      selectedCustomerId = '';
      cartState.discountAmount = 0;
      showCheckoutModal = false;
      
      await invalidateAll();
      setTimeout(() => commonState.successMsg = '', 5000);
      
    } catch (err: any) {
      commonState.errorMsg = err.message;
    } finally {
      commonState.processing = false;
    }
  }

  return {
    get paymentMethods() { return paymentMethods; },
    get showCheckoutModal() { return showCheckoutModal; },
    set showCheckoutModal(val) { showCheckoutModal = val; },
    get paymentMethod() { return paymentMethod; },
    set paymentMethod(val) { paymentMethod = val; },
    get customerNameInput() { return customerNameInput; },
    set customerNameInput(val) { customerNameInput = val; },
    openCheckout,
    processCheckout
  };
}
