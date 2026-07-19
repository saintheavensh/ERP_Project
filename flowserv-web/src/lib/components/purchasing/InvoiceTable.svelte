<script lang="ts">
  import type { PurchaseInvoiceState } from '$lib/states/purchasing/invoice.svelte';

  let { state } = $props<{ state: PurchaseInvoiceState }>();
</script>

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
      {#each state.batches as batch}
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
          <td class="p-4 align-top">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <span class="text-slate-500 sm:text-sm">Rp</span>
              </div>
              <input type="number" min="0" bind:value={batch.actualUnitCost} required class="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-medium">
            </div>
          </td>
          <td class="p-4 align-top">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <span class="text-slate-500 sm:text-sm">Rp</span>
              </div>
              <input type="number" min="0" bind:value={batch.sellingPrice} required class="w-full pl-8 pr-2 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-right font-medium">
            </div>
            {#if state.getMarginWarning(batch)}
              <div class="mt-1 text-[10px] text-red-600 font-medium text-right leading-tight">
                {state.getMarginWarning(batch)}
              </div>
            {/if}
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
      <td class="p-4 text-right text-slate-900 font-bold text-lg">Rp {state.actualTotal.toLocaleString('id-ID')}</td>
    </tr>
  </tfoot>
</table>
</div>
