<script lang="ts">
  import type { PosHistoryState } from '$lib/states/pos/history.svelte';
  import PrintButton from '$lib/components/print/PrintButton.svelte';

  let { state } = $props<{ state: PosHistoryState }>();
</script>

{#if state.selectedInvoiceDetail}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-800">Detail Invoice: {state.selectedInvoiceDetail.invoiceNumber}</h3>
        <button aria-label="Tutup" onclick={() => state.selectedInvoiceDetail = null} class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p class="text-slate-500">Tanggal Transaksi</p>
            <p class="font-medium text-slate-800">{state.formatDate(state.selectedInvoiceDetail.createdAt)}</p>
          </div>
          <div>
            <p class="text-slate-500">Pelanggan</p>
            <p class="font-medium text-slate-800">{state.selectedInvoiceDetail.customerName || 'Umum'}</p>
          </div>
          <div>
            <p class="text-slate-500">Metode Pembayaran</p>
            <p class="font-medium text-slate-800 capitalize">{state.selectedInvoiceDetail.paymentMethod}</p>
          </div>
          <div>
            <p class="text-slate-500">Kasir</p>
            <p class="font-medium text-slate-800">{state.selectedInvoiceDetail.creator?.name || '-'}</p>
          </div>
          <div>
            <p class="text-slate-500">Status Pembayaran</p>
            <p class="font-medium text-slate-800 capitalize">
              {state.selectedInvoiceDetail.paymentStatus}
              <span class="text-xs text-slate-500 font-normal normal-case">
                ({state.formatRp(state.selectedInvoiceDetail.amountPaid)} / {state.formatRp(state.selectedInvoiceDetail.grandTotal)})
              </span>
            </p>
          </div>
          {#if state.selectedInvoiceDetail.paymentStatus !== 'paid'}
            <div>
              <p class="text-slate-500">Sisa Tagihan</p>
              <p class="font-bold text-red-600">{state.formatRp(state.outstandingBalance(state.selectedInvoiceDetail))}</p>
            </div>
          {/if}
        </div>

        {#if state.selectedInvoiceDetail.payments && state.selectedInvoiceDetail.payments.length > 0}
          <h4 class="font-semibold text-slate-800 mb-3 border-b pb-2">Riwayat Pembayaran</h4>
          <div class="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mb-6">
           <div class="overflow-x-auto">
            <table class="w-full min-w-[500px] text-left text-sm">
              <thead class="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th class="p-3 font-medium text-slate-600">Tanggal</th>
                  <th class="p-3 font-medium text-slate-600">Metode</th>
                  <th class="p-3 font-medium text-slate-600">No. Referensi</th>
                  <th class="p-3 font-medium text-slate-600 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {#each state.selectedInvoiceDetail.payments as payment}
                  <tr>
                    <td class="p-3">{state.formatDate(payment.paidAt)}</td>
                    <td class="p-3 capitalize">{payment.method}</td>
                    <td class="p-3">{payment.referenceNumber || '-'}</td>
                    <td class="p-3 text-right font-medium">{state.formatRp(payment.amount)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
           </div>
          </div>
        {/if}

        <h4 class="font-semibold text-slate-800 mb-3 border-b pb-2">Item Pembelian</h4>
        
        {#if state.loadingDetail}
          <div class="py-8 text-center text-slate-500">
            <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Memuat item...
          </div>
        {:else if state.selectedInvoiceDetail.lines && state.selectedInvoiceDetail.lines.length > 0}
          <div class="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
           <div class="overflow-x-auto">
            <table class="w-full min-w-[500px] text-left text-sm">
              <thead class="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th class="p-3 font-medium text-slate-600">Item</th>
                  <th class="p-3 font-medium text-slate-600 text-center">Qty</th>
                  <th class="p-3 font-medium text-slate-600 text-right">Harga Satuan</th>
                  <th class="p-3 font-medium text-slate-600 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {#each state.selectedInvoiceDetail.lines as line}
                  <tr>
                    <td class="p-3">
                      <p class="font-medium text-slate-800">{line.description || line.inventoryItem?.name || 'Unknown Item'}</p>
                      {#if line.sourceType === 'labor' || line.sourceType === 'fee'}
                        <p class="text-[10px] uppercase tracking-wide text-indigo-500 font-medium">{line.sourceType === 'labor' ? 'Jasa' : 'Biaya Lain'}</p>
                      {:else}
                        <p class="text-xs text-slate-500">{line.inventoryItem?.sku || '-'}</p>
                      {/if}
                    </td>
                    <td class="p-3 text-center">{line.quantity}</td>
                    <td class="p-3 text-right">{state.formatRp(line.unitPrice)}</td>
                    <td class="p-3 text-right font-medium">{state.formatRp(line.subtotal)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
           </div>
          </div>
          
          <div class="mt-4 space-y-1 text-sm flex flex-col items-end border-t border-dashed pt-4">
            <div class="flex justify-between w-64">
              <span class="text-slate-600">Subtotal:</span>
              <span class="font-medium text-slate-800">{state.formatRp(state.selectedInvoiceDetail.subtotal)}</span>
            </div>
            <div class="flex justify-between w-64">
              <span class="text-slate-600">Diskon:</span>
              <span class="font-medium text-slate-800">{state.formatRp(state.selectedInvoiceDetail.discountAmount)}</span>
            </div>
            <div class="flex justify-between w-64 pt-2 border-t mt-1 text-base">
              <span class="font-bold text-slate-800">Total:</span>
              <span class="font-bold text-blue-600">{state.formatRp(state.selectedInvoiceDetail.grandTotal)}</span>
            </div>
          </div>
        {:else}
          <p class="text-slate-500 italic">Tidak ada detail item yang ditemukan.</p>
        {/if}
      </div>
      
      <div class="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
        <div class="flex flex-wrap gap-2">
          <PrintButton token={state.token} documentType="receipt" invoiceId={state.selectedInvoiceDetail.id} label="Cetak Struk" />
          <PrintButton token={state.token} documentType="invoice_a4" invoiceId={state.selectedInvoiceDetail.id} label="Cetak Invoice A4" />
          {#if state.selectedInvoiceDetail.status !== 'voided'}
            {#if state.selectedInvoiceDetail.paymentStatus !== 'paid'}
              <button onclick={() => state.openPayModal(state.selectedInvoiceDetail)} class="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg transition-colors border border-green-200 mr-2">
                Bayar
              </button>
            {/if}
            <button onclick={() => state.handleVoid(state.selectedInvoiceDetail.id)} class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors border border-red-200 mr-2">
              Void (Batal)
            </button>
            <button onclick={() => state.handleEdit(state.selectedInvoiceDetail)} class="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-lg transition-colors border border-amber-200">
              Edit & Re-Cart
            </button>
          {/if}
        </div>
        <button onclick={() => state.selectedInvoiceDetail = null} class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors">
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

{#if state.payingInvoice}
  {@const invoice = state.payingInvoice}
  {@const sisa = state.outstandingBalance(invoice)}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Bayar Invoice {invoice.invoiceNumber}</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => state.closePayModal()}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); state.submitPayment(); }} class="p-6 space-y-4">
        <div class="text-sm text-slate-500">
          <div>{invoice.customerName || 'Pelanggan Umum'}</div>
          <div class="mt-1">Sisa Tagihan: <span class="font-semibold text-red-600">{state.formatRp(sisa)}</span></div>
        </div>

        {#if state.payError}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {state.payError}
          </div>
        {/if}

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="pos-pay-amount">Jumlah Bayar *</label>
          <input id="pos-pay-amount" type="number" min="1" max={sisa} bind:value={state.payAmount} required
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="pos-pay-method">Metode Pembayaran</label>
          <select id="pos-pay-method" bind:value={state.payMethod}
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="cash">Tunai</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="pos-pay-ref">No. Referensi (Opsional)</label>
          <input id="pos-pay-ref" type="text" bind:value={state.payReferenceNumber}
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
