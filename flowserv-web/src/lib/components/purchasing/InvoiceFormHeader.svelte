<script lang="ts">
  import type { PurchaseInvoiceState } from '$lib/states/purchasing/invoice.svelte';

  let { state } = $props<{ state: PurchaseInvoiceState }>();
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" for="invNum">Supplier Invoice / Nota No. *</label>
    <input id="invNum" type="text" bind:value={state.invoiceNumber} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase">
  </div>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" for="invDate">Invoice Date *</label>
    <input id="invDate" type="date" bind:value={state.invoiceDate} onchange={() => state.updateDueDate()} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
  </div>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" for="invDue">Due Date (Tempo)</label>
    <input id="invDue" type="date" bind:value={state.invoiceDueDate} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" disabled={state.paymentMethod !== 'tempo'}>
    <p class="text-xs text-slate-500 mt-1">Hanya aktif jika Tempo dipilih.</p>
  </div>
  <div>
    <label class="block text-sm font-medium text-slate-700 mb-1" for="payMeth">Metode Pembayaran</label>
    <select id="payMeth" bind:value={state.paymentMethod} onchange={() => state.updateDueDate()} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
      <option value="cash">Cash / Tunai</option>
      <option value="transfer">Transfer Bank</option>
      <option value="tempo">Tempo (Kredit)</option>
    </select>
  </div>
</div>
