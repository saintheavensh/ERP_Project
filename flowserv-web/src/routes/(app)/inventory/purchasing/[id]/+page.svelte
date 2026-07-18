<script lang="ts">
  let { data } = $props();
  let order = $derived(data.order);
  let inv = $derived(order?.supplierInvoices?.[0]);
  
  let loading = $state(false);
  
  async function updateStatus(newStatus: string) {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    loading = true;
    
    try {
      const res = await fetch(`http://localhost:3001/v1/purchasing/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      loading = false;
    }
  }
  async function deleteOrder() {
    let warning = `Are you sure you want to delete this PO?`;
    if (order.status === 'received' || order.status === 'completed') {
      warning = `WARNING: This PO is already ${order.status}. Deleting it in dev-mode will rollback all stock batches and movements, which may cause negative stock levels! Do you want to proceed?`;
    }
    
    if (!confirm(warning)) return;
    loading = true;
    
    try {
      const res = await fetch(`http://localhost:3001/v1/purchasing/orders/${order.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to delete order');
      window.location.href = '/inventory/purchasing';
    } catch (err: any) {
      alert(err.message);
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>PO {order?.poNumber} - FlowServ</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/inventory/purchasing" class="text-slate-500 hover:text-slate-800" aria-label="Back">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Purchase Order: {order?.poNumber}</h1>
        <p class="text-slate-500 mt-1">Supplier: {order?.supplier?.name}</p>
      </div>
    </div>
    
    <!-- Actions & Timeline -->
    <div>
      <button disabled={loading} onclick={deleteOrder} class="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
        Delete PO
      </button>
    </div>
  </div>

  <!-- Step-by-Step Flow -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <!-- Step 1: Draft/Ordered -->
    <div class="p-4 rounded-xl border {order?.status === 'draft' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}">
      <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 1</div>
      <div class="font-semibold text-slate-900 mb-3">Pemesanan (PO)</div>
      {#if order?.status === 'draft'}
        <button disabled={loading} onclick={() => updateStatus('ordered')} class="w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium transition-colors">Tandai Dipesan</button>
      {:else}
        <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Selesai Dipesan
        </div>
      {/if}
    </div>

    <!-- Step 2: Receive -->
    <div class="p-4 rounded-xl border {order?.status === 'ordered' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}">
      <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 2 (Bag. Gudang)</div>
      <div class="font-semibold text-slate-900 mb-3">Terima Fisik Barang</div>
      {#if order?.status === 'ordered'}
        <a href={`/inventory/purchasing/${order?.id}/receive`} class="block text-center w-full text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">Buka Form Penerimaan</a>
      {:else if order?.status === 'received' || order?.status === 'completed'}
        <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Barang Diterima
        </div>
      {:else}
        <div class="text-sm text-slate-400">Menunggu Step 1</div>
      {/if}
    </div>

    <!-- Step 3: Costing -->
    <div class="p-4 rounded-xl border {order?.status === 'received' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}">
      <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 3 (Manajer)</div>
      <div class="font-semibold text-slate-900 mb-3">Input Harga & Invoice</div>
      {#if order?.status === 'received'}
        <a href={`/inventory/purchasing/${order?.id}/invoice`} class="block text-center w-full text-sm bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">Input Costing</a>
      {:else if order?.status === 'completed'}
        <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Harga Ditetapkan
        </div>
      {:else}
        <div class="text-sm text-slate-400">Menunggu Step 2</div>
      {/if}
    </div>

    <!-- Step 4: Payment -->
    <div class="p-4 rounded-xl border {order?.status === 'completed' && inv?.status !== 'paid' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-slate-200 bg-white'}">
      <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 4 (Finance)</div>
      <div class="font-semibold text-slate-900 mb-3">Status Pembayaran</div>
      {#if order?.status === 'completed'}
        {#if inv}
          {#if inv.status === 'paid'}
            <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Lunas ({inv.paymentMethod})
            </div>
          {:else}
            <a href="/finance/payables" class="block text-center w-full text-sm bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium transition-colors">Tagihan Tempo (Bayar)</a>
          {/if}
        {:else}
          <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Lunas (Cash)
          </div>
        {/if}
      {:else}
        <div class="text-sm text-slate-400">Menunggu Step 3</div>
      {/if}
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="p-6 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6">
      <div>
        <p class="text-sm text-slate-500">Status</p>
        <p class="font-medium text-slate-900 uppercase mt-1">{order?.status}</p>
      </div>
      <div>
        <p class="text-sm text-slate-500">Created At</p>
        <p class="font-medium text-slate-900 mt-1">{new Date(order?.createdAt).toLocaleDateString()}</p>
      </div>
      <div>
        <p class="text-sm text-slate-500">Expected Delivery</p>
        <p class="font-medium text-slate-900 mt-1">{order?.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '-'}</p>
      </div>
      <div>
        <p class="text-sm text-slate-500">Invoice Number</p>
        <p class="font-medium text-slate-900 mt-1">{order?.invoiceNumber || '-'}</p>
      </div>
    </div>

    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">Item Name</th>
          <th class="p-4 text-center">Qty Ordered</th>
          <th class="p-4 text-center">Qty Received</th>
          <th class="p-4 text-right">Est. Unit Price</th>
          <th class="p-4 text-right">Act. Unit Price</th>
          <th class="p-4 text-right">Total</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each order?.purchaseOrderLines || [] as line}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 text-slate-900">
              <span class="font-medium">{line.inventoryItem?.name}</span>
              <br>
              <span class="text-xs text-slate-500">SKU: {line.inventoryItem?.sku}</span>
            </td>
            <td class="p-4 text-center font-medium">{line.quantity}</td>
            <td class="p-4 text-center font-medium {line.receivedQuantity > 0 ? 'text-green-600' : 'text-slate-500'}">{line.receivedQuantity}</td>
            <td class="p-4 text-right text-slate-500">Rp {parseFloat(line.unitPrice).toLocaleString('id-ID')}</td>
            <td class="p-4 text-right font-medium">
              {#if line.actualUnitPrice}
                Rp {parseFloat(line.actualUnitPrice).toLocaleString('id-ID')}
              {:else}
                -
              {/if}
            </td>
            <td class="p-4 text-right font-medium text-slate-900">
              {#if order.status === 'completed' && line.actualUnitPrice}
                Rp {(parseFloat(line.actualUnitPrice) * line.receivedQuantity).toLocaleString('id-ID')}
              {:else}
                Rp {(parseFloat(line.unitPrice) * line.quantity).toLocaleString('id-ID')} (Est)
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
      <tfoot class="bg-slate-50 border-t border-slate-200 font-medium">
        <tr>
          <td colspan="5" class="p-4 text-right text-slate-700">Estimated Total:</td>
          <td class="p-4 text-right text-slate-900">Rp {parseFloat(order?.estimatedTotal || 0).toLocaleString('id-ID')}</td>
        </tr>
        {#if order?.status === 'completed'}
          <tr>
            <td colspan="5" class="p-4 text-right text-slate-700">Actual Total (Invoice):</td>
            <td class="p-4 text-right text-slate-900 font-bold text-lg">Rp {parseFloat(order?.actualTotal || 0).toLocaleString('id-ID')}</td>
          </tr>
        {/if}
      </tfoot>
    </table>
  </div>
</div>
