<script lang="ts">
  import { untrack } from 'svelte';
  let { data } = $props();
  let order = $derived(data.order);
  
  let invoiceNumber = $state(untrack(() => order.invoiceNumber || ''));
  // Format dates for input type="date"
  let invoiceDate = $state(untrack(() => order.invoiceDate ? new Date(order.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
  let invoiceDueDate = $state(untrack(() => order.invoiceDueDate ? new Date(order.invoiceDueDate).toISOString().split('T')[0] : ''));
  
  let batches = $state(untrack(() => {
    const allBatches: any[] = [];
    data.order.purchaseOrderLines.forEach((l: any) => {
      if (l.stockBatches) {
        l.stockBatches.forEach((b: any) => {
          if (b.quantityReceived > 0) {
            allBatches.push({
              batchId: b.id,
              name: l.inventoryItem.name,
              sku: l.inventoryItem.sku,
              brandName: b.partBrand ? b.partBrand.name : 'Tanpa Merk',
              receivedQuantity: b.quantityReceived,
              actualUnitCost: b.unitCost ? parseFloat(b.unitCost) : 0,
              sellingPrice: l.inventoryItem.sellingPrice ? parseFloat(l.inventoryItem.sellingPrice) : 0
            });
          }
        });
      }
    });
    return allBatches;
  }));
  
  let actualTotal = $derived(
    batches.reduce((sum: number, batch: any) => sum + (batch.receivedQuantity * batch.actualUnitCost), 0)
  );
  
  let loading = $state(false);
  let errorMsg = $state('');
  
  async function submitInvoice() {
    if (!invoiceNumber) {
      errorMsg = 'Invoice number is required.';
      return;
    }
    
    // Validasi harga
    for (const batch of batches) {
      if (!batch.actualUnitCost || batch.actualUnitCost <= 0) {
        errorMsg = `Harga beli untuk item ${batch.name} (${batch.brandName}) belum di set atau bernilai 0.`;
        return;
      }
      if (!batch.sellingPrice || batch.sellingPrice <= 0) {
        errorMsg = `Harga jual untuk item ${batch.name} (${batch.brandName}) belum di set atau bernilai 0.`;
        return;
      }
    }
    
    const hasLoss = batches.some(b => b.sellingPrice < b.actualUnitCost);
    if (hasLoss) {
      const confirmLoss = confirm('Peringatan: Ada item dengan Harga Jual di bawah Harga Beli! Apakah Anda yakin ingin menyimpan?');
      if (!confirmLoss) return;
    } else {
      const confirmNormal = confirm('Apakah Harga Beli aktual dan Harga Jual baru sudah sesuai? Data HPP akan otomatis dihitung ulang setelah ini.');
      if (!confirmNormal) return;
    }
    
    loading = true;
    errorMsg = '';
    
    try {
      const payload = {
        invoiceNumber,
        invoiceDate,
        invoiceDueDate: invoiceDueDate || undefined,
        batches: batches.map((b: any) => ({ 
          batchId: b.batchId, 
          actualUnitCost: b.actualUnitCost,
          sellingPrice: b.sellingPrice
        }))
      };
      
      const res = await fetch(`http://localhost:3001/v1/purchasing/orders/${order.id}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error?.message || 'Failed to submit invoice');
      
      window.location.href = `/inventory/purchasing/${order.id}`;
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Invoice & Costing PO {order?.poNumber} - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href={`/inventory/purchasing/${order?.id}`} class="text-slate-500 hover:text-slate-800" aria-label="Back">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Input Invoice & Costing (Manager)</h1>
      <p class="text-slate-500 mt-1">PO: {order?.poNumber} &bull; Supplier: {order?.supplier?.name}</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
    <div class="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg text-purple-800 text-sm">
      <strong>Manager Duty:</strong> The items have been physically received. Please enter the final prices according to the supplier's invoice. This will automatically update the Weighted Average Cost (WAC) of the inventory.
    </div>

    <form onsubmit={(e) => { e.preventDefault(); submitInvoice(); }} class="space-y-6">
      {#if errorMsg}
        <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {errorMsg}
        </div>
      {/if}
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="invNum">Supplier Invoice / Nota No. *</label>
          <input id="invNum" type="text" bind:value={invoiceNumber} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="invDate">Invoice Date *</label>
          <input id="invDate" type="date" bind:value={invoiceDate} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="invDue">Due Date (Tempo)</label>
          <input id="invDue" type="date" bind:value={invoiceDueDate} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          <p class="text-xs text-slate-500 mt-1">Leave empty if cash/COD.</p>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
              <th class="p-4">Item</th>
              <th class="p-4">Merk yang Datang</th>
              <th class="p-4 text-center">Qty Received</th>
              <th class="p-4 text-right w-44">Harga Beli Aktual *</th>
              <th class="p-4 text-right w-44">Harga Jual Baru *</th>
              <th class="p-4 text-right w-36">Subtotal Beli</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each batches as batch}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4">
                  <p class="font-medium text-slate-900">{batch.name}</p>
                  <p class="text-xs text-slate-500">SKU: {batch.sku}</p>
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                    {batch.brandName}
                  </span>
                </td>
                <td class="p-4 text-center font-medium text-slate-900">
                  {batch.receivedQuantity}
                </td>
                <td class="p-4">
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <span class="text-slate-500 sm:text-sm">Rp</span>
                    </div>
                    <input type="number" min="0" bind:value={batch.actualUnitCost} required class="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-medium">
                  </div>
                </td>
                <td class="p-4">
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <span class="text-slate-500 sm:text-sm">Rp</span>
                    </div>
                    <input type="number" min="0" bind:value={batch.sellingPrice} required class="w-full pl-8 pr-2 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-right font-medium">
                  </div>
                </td>
                <td class="p-4 text-right font-medium text-slate-900">
                  Rp {(batch.receivedQuantity * batch.actualUnitCost).toLocaleString('id-ID')}
                </td>
              </tr>
            {/each}
          </tbody>
        <tfoot class="bg-slate-50 border-t border-slate-200">
          <tr>
            <td colspan="5" class="p-4 text-right text-slate-700 font-medium">Actual Total Invoice:</td>
            <td class="p-4 text-right text-slate-900 font-bold text-lg">Rp {actualTotal.toLocaleString('id-ID')}</td>
          </tr>
        </tfoot>
      </table>
      </div>
      
      <div class="pt-6 flex justify-end gap-3">
        <a href={`/inventory/purchasing/${order?.id}`} class="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</a>
        <button type="submit" disabled={loading} class="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
          {loading ? 'Processing...' : 'Confirm Invoice & Update HPP'}
        </button>
      </div>
    </form>
  </div>
</div>
