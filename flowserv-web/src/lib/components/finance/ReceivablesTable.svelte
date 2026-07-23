<script lang="ts">
  import type { ReceivablesState } from '$lib/states/finance/receivables.svelte';

  let { state } = $props<{ state: ReceivablesState }>();
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
 <div class="overflow-x-auto">
  <table class="w-full min-w-[900px] text-left border-collapse">
    <thead>
      <tr class="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
        <th class="p-4 font-medium">Invoice</th>
        <th class="p-4 font-medium">Pelanggan</th>
        <th class="p-4 font-medium text-right">Total Tagihan</th>
        <th class="p-4 font-medium text-right">Sisa Piutang</th>
        <th class="p-4 font-medium">Tanggal</th>
        <th class="p-4 font-medium text-center">Status</th>
        <th class="p-4 font-medium text-right">Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#if state.receivables.length === 0}
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-500">
            Tidak ada piutang pelanggan aktif. Semua tagihan sudah lunas! 🎉
          </td>
        </tr>
      {:else}
        {#each state.receivables as inv}
          {@const sisaPiutang = state.outstandingBalance(inv)}
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4">
              <div class="font-medium text-slate-900">{inv.invoiceNumber}</div>
            </td>
            <td class="p-4 text-slate-700 text-sm">{inv.customer?.name || inv.customerName || 'Unknown'}</td>
            <td class="p-4 text-right text-slate-700 font-medium">
              {state.formatMoney(inv.grandTotal)}
            </td>
            <td class="p-4 text-right text-red-600 font-bold">
              {state.formatMoney(sisaPiutang)}
            </td>
            <td class="p-4">
              <div class="text-sm font-medium text-slate-800">
                {state.formatDate(inv.createdAt)}
              </div>
            </td>
            <td class="p-4 text-center">
              <span class="inline-block px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full capitalize">
                {inv.paymentStatus}
              </span>
            </td>
            <td class="p-4 text-right">
              <button
                class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                onclick={() => state.openPayModal(inv)}
              >
                Bayar
              </button>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
 </div>
</div>

{#if state.payingInvoice}
  {@const invoice = state.payingInvoice}
  {@const sisaPiutang = state.outstandingBalance(invoice)}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Terima Pembayaran Pelanggan</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => state.closePayModal()}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); state.submitPayment(); }} class="p-6 space-y-4">
        <div class="text-sm text-slate-500">
          <div>{invoice.customer?.name || invoice.customerName || 'Unknown'} &middot; Inv: {invoice.invoiceNumber}</div>
          <div class="mt-1">Sisa Piutang: <span class="font-semibold text-red-600">{state.formatMoney(sisaPiutang)}</span></div>
        </div>

        {#if state.payError}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {state.payError}
          </div>
        {/if}

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="ar-pay-amount">Jumlah Bayar *</label>
          <input id="ar-pay-amount" type="number" min="1" max={sisaPiutang} bind:value={state.payAmount} required
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="ar-pay-method">Metode Pembayaran</label>
          <select id="ar-pay-method" bind:value={state.payMethod}
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="cash">Tunai</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="ar-pay-ref">No. Referensi (Opsional)</label>
          <input id="ar-pay-ref" type="text" bind:value={state.payReferenceNumber}
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="mis. No. Referensi Transfer">
        </div>

        <div class="pt-4 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => state.closePayModal()}>Batal</button>
          <button type="submit" disabled={state.paySubmitting} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {state.paySubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
