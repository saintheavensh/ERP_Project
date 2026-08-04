<script lang="ts">
  import type { ReceivablesState } from '$lib/states/finance/receivables.svelte';
  import ReceivableDetailModal from './ReceivableDetailModal.svelte';

  let { state } = $props<{ state: ReceivablesState }>();
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
 <div class="overflow-x-auto">
  <table class="w-full min-w-[900px] text-left border-collapse">
    <thead>
      <tr class="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
        <th class="p-4 font-medium">Pelanggan</th>
        <th class="p-4 font-medium text-center">Nota</th>
        <th class="p-4 font-medium text-right">Total Tagihan</th>
        <th class="p-4 font-medium text-right">Sisa Piutang</th>
        <th class="p-4 font-medium">Tanggal</th>
        <th class="p-4 font-medium text-center">Status</th>
        <th class="p-4 font-medium text-right">Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#if state.groups.length === 0}
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-500">
            Tidak ada piutang pelanggan aktif. Semua tagihan sudah lunas! 🎉
          </td>
        </tr>
      {:else}
        <!-- R1.9-T2 — satu baris per PELANGGAN; notanya muncul saat dibentang.
             Pelanggan dengan SATU nota sengaja tetap satu baris datar tanpa
             tombol bentang: menambah satu klik yang tidak mengungkap apa pun
             justru menambah kerumitan yang track penyederhanaan (S1–S5) ada
             untuk mengurangi. Yang pemilik minta muncul saat memang ada dua. -->
        {#each state.groups as grup (grup.key)}
          {#if grup.invoices.length === 1}
            {@const inv = grup.invoices[0]}
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-testid="ar-nota">
              <td class="p-4">
                <div class="font-medium text-slate-900">{grup.customerName}</div>
                <div class="text-xs text-slate-500 mt-0.5">{inv.invoiceNumber}</div>
              </td>
              <td class="p-4 text-center text-xs text-slate-400">1 nota</td>
              <td class="p-4 text-right text-slate-700 font-medium">{state.formatMoney(inv.grandTotal)}</td>
              <td class="p-4 text-right text-red-600 font-bold">{state.formatMoney(state.outstandingBalance(inv))}</td>
              <td class="p-4">
                <div class="text-sm font-medium text-slate-800">{state.formatDate(inv.createdAt)}</div>
              </td>
              <td class="p-4 text-center">
                <span class="inline-block px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full capitalize">
                  {inv.paymentStatus}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                  <!-- R1.8-T2 — kasir yang menagih perlu tahu tagihan ini isinya
                       apa sebelum menerima uang (uji-R1.7 A1). -->
                  <button
                    class="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-100 transition-colors"
                    onclick={() => state.openDetail(inv)}
                    data-testid="ar-rincian"
                  >
                    Rincian
                  </button>
                  <button
                    class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    onclick={() => state.openPayModal(inv)}
                  >
                    Bayar
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            {@const terbentang = state.isExpanded(grup.key)}
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-testid="ar-grup">
              <td class="p-4">
                <button
                  type="button"
                  class="flex items-center gap-2 text-left font-medium text-slate-900 hover:text-blue-700"
                  onclick={() => state.toggleGroup(grup.key)}
                  aria-expanded={terbentang}
                  data-testid="ar-grup-toggle"
                >
                  <svg class="w-4 h-4 shrink-0 text-slate-400 transition-transform {terbentang ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                  <span data-testid="ar-grup-nama">{grup.customerName}</span>
                </button>
              </td>
              <td class="p-4 text-center">
                <span class="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full" data-testid="ar-grup-jumlah">
                  {grup.invoices.length} nota
                </span>
              </td>
              <td class="p-4 text-right text-slate-700 font-medium">
                {state.formatMoney(grup.totalBilled)}
              </td>
              <td class="p-4 text-right text-red-600 font-bold" data-testid="ar-grup-subtotal">
                {state.formatMoney(grup.totalOutstanding)}
              </td>
              <td class="p-4 text-sm text-slate-400" colspan="3">
                {terbentang ? '' : 'Klik nama untuk melihat rincian per nota'}
              </td>
            </tr>

            {#if terbentang}
              {#each grup.invoices as inv (inv.id)}
                <tr class="border-b border-slate-100 bg-slate-50/60" data-testid="ar-nota">
                  <td class="p-4 pl-12">
                    <div class="font-medium text-slate-900">{inv.invoiceNumber}</div>
                  </td>
                  <td class="p-4"></td>
                  <td class="p-4 text-right text-slate-700 font-medium">{state.formatMoney(inv.grandTotal)}</td>
                  <td class="p-4 text-right text-red-600 font-bold">{state.formatMoney(state.outstandingBalance(inv))}</td>
                  <td class="p-4">
                    <div class="text-sm font-medium text-slate-800">{state.formatDate(inv.createdAt)}</div>
                  </td>
                  <td class="p-4 text-center">
                    <span class="inline-block px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full capitalize">
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        class="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-100 transition-colors"
                        onclick={() => state.openDetail(inv)}
                        data-testid="ar-rincian"
                      >
                        Rincian
                      </button>
                      <button
                        class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        onclick={() => state.openPayModal(inv)}
                      >
                        Bayar
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          {/if}
        {/each}
      {/if}
    </tbody>
  </table>
 </div>
</div>

<ReceivableDetailModal {state} />

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
