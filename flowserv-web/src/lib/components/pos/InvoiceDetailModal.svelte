<script lang="ts">
  import type { PosHistoryState } from '$lib/states/pos/history.svelte';

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
        <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
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
        </div>

        <h4 class="font-semibold text-slate-800 mb-3 border-b pb-2">Item Pembelian</h4>
        
        {#if state.loadingDetail}
          <div class="py-8 text-center text-slate-500">
            <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Memuat item...
          </div>
        {:else if state.selectedInvoiceDetail.lines && state.selectedInvoiceDetail.lines.length > 0}
          <div class="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-left text-sm">
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
                      <p class="font-medium text-slate-800">{line.inventoryItem?.name || 'Unknown Item'}</p>
                      <p class="text-xs text-slate-500">{line.inventoryItem?.sku || '-'}</p>
                    </td>
                    <td class="p-3 text-center">{line.quantity}</td>
                    <td class="p-3 text-right">{state.formatRp(line.unitPrice)}</td>
                    <td class="p-3 text-right font-medium">{state.formatRp(line.subtotal)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
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
      
      <div class="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          {#if state.selectedInvoiceDetail.status !== 'voided'}
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
