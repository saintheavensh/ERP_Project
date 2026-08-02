<script lang="ts">
  import type { ReceivablesState } from '$lib/states/finance/receivables.svelte';

  /**
   * R1.8-T2 — rincian satu tagihan piutang, untuk kasir yang sedang menagih.
   *
   * SENGAJA BUKAN memakai ulang `pos/InvoiceDetailModal.svelte`, walau isinya
   * mirip. Modal POS itu membawa tombol **Void** dan **Ubah & Masukkan
   * Keranjang**, dan keduanya digerbangi izin yang kasir TIDAK punya
   * (`pos.void_transaction`). Menampilkannya di sini berarti memasang kontrol
   * yang pasti gagal saat ditekan — anti-pattern yang Track F ada untuk
   * membasminya, dan yang R1.7-T3 baru saja bereskan pada pemilih teknisi.
   *
   * Yang ditampilkan di sini persis yang dibutuhkan untuk menagih: isi
   * tagihannya apa, sudah dibayar berapa, sisanya berapa. Tidak lebih.
   */
  let { state } = $props<{ state: ReceivablesState }>();
</script>

{#if state.detailInvoice}
  {@const inv = state.detailInvoice}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" data-testid="ar-detail-modal">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-800">Rincian Tagihan: {inv.invoiceNumber}</h3>
        <button aria-label="Tutup" onclick={() => state.closeDetail()} class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p class="text-slate-500">Pelanggan</p>
            <p class="font-medium text-slate-800" data-testid="ar-detail-customer">
              {inv.customer?.name || inv.customerName || 'Umum'}
            </p>
          </div>
          <div>
            <p class="text-slate-500">Tanggal</p>
            <p class="font-medium text-slate-800">{state.formatDate(inv.createdAt)}</p>
          </div>
          <div>
            <p class="text-slate-500">Sudah Dibayar</p>
            <p class="font-medium text-slate-800">{state.formatMoney(inv.amountPaid)}</p>
          </div>
          <div>
            <p class="text-slate-500">Sisa Piutang</p>
            <p class="font-bold text-red-600" data-testid="ar-detail-sisa">{state.formatMoney(state.outstandingBalance(inv))}</p>
          </div>
        </div>

        {#if state.detailError}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 mb-4">
            {state.detailError}
          </div>
        {/if}

        {#if inv.payments && inv.payments.length > 0}
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
                  {#each inv.payments as payment}
                    <tr>
                      <td class="p-3">{state.formatDate(payment.paidAt)}</td>
                      <td class="p-3 capitalize">{payment.method}</td>
                      <td class="p-3">{payment.referenceNumber || '-'}</td>
                      <td class="p-3 text-right font-medium">{state.formatMoney(payment.amount)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <h4 class="font-semibold text-slate-800 mb-3 border-b pb-2">Isi Tagihan</h4>

        {#if state.loadingDetail}
          <div class="py-8 text-center text-slate-500" data-testid="ar-detail-loading">Memuat rincian...</div>
        {:else if inv.lines && inv.lines.length > 0}
          <div class="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[500px] text-left text-sm" data-testid="ar-detail-lines">
                <thead class="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th class="p-3 font-medium text-slate-600">Item</th>
                    <th class="p-3 font-medium text-slate-600 text-center">Jumlah</th>
                    <th class="p-3 font-medium text-slate-600 text-right">Harga Satuan</th>
                    <th class="p-3 font-medium text-slate-600 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  {#each inv.lines as line}
                    <tr>
                      <td class="p-3">
                        <p class="font-medium text-slate-800">{line.description || line.inventoryItem?.name || 'Item'}</p>
                        {#if line.sourceType === 'labor' || line.sourceType === 'fee'}
                          <p class="text-[10px] uppercase tracking-wide text-indigo-500 font-medium">
                            {line.sourceType === 'labor' ? 'Jasa' : 'Biaya Lain'}
                          </p>
                        {:else}
                          <p class="text-xs text-slate-500">{line.inventoryItem?.sku || '-'}</p>
                        {/if}
                      </td>
                      <td class="p-3 text-center">{line.quantity}</td>
                      <td class="p-3 text-right">{state.formatMoney(line.unitPrice)}</td>
                      <td class="p-3 text-right font-medium">{state.formatMoney(line.subtotal)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-4 space-y-1 text-sm flex flex-col items-end border-t border-dashed pt-4">
            <div class="flex justify-between w-64">
              <span class="text-slate-600">Subtotal:</span>
              <span class="font-medium text-slate-800">{state.formatMoney(inv.subtotal)}</span>
            </div>
            <div class="flex justify-between w-64">
              <span class="text-slate-600">Diskon:</span>
              <span class="font-medium text-slate-800">{state.formatMoney(inv.discountAmount)}</span>
            </div>
            <div class="flex justify-between w-64 pt-2 border-t mt-1 text-base">
              <span class="font-bold text-slate-800">Total:</span>
              <span class="font-bold text-blue-600">{state.formatMoney(inv.grandTotal)}</span>
            </div>
          </div>
        {:else}
          <p class="text-slate-500 italic">Tidak ada rincian item untuk tagihan ini.</p>
        {/if}
      </div>

      <div class="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-end items-center gap-2">
        <button onclick={() => state.closeDetail()} class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors">
          Tutup
        </button>
        <button
          onclick={() => { const i = state.detailInvoice; state.closeDetail(); state.openPayModal(i); }}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          data-testid="ar-detail-bayar"
        >
          Bayar
        </button>
      </div>
    </div>
  </div>
{/if}
