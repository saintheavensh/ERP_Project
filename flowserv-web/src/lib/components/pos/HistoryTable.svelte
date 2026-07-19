<script lang="ts">
  import type { PosHistoryState } from '$lib/states/pos/history.svelte';

  let { state } = $props<{ state: PosHistoryState }>();
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
          <th class="p-4 font-medium">Tanggal</th>
          <th class="p-4 font-medium">No. Invoice</th>
          <th class="p-4 font-medium">Pelanggan</th>
          <th class="p-4 font-medium">Pembayaran</th>
          <th class="p-4 font-medium text-right">Total</th>
          <th class="p-4 font-medium text-center">Status</th>
          <th class="p-4 font-medium">Kasir</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#if state.invoices.length === 0}
          <tr>
            <td colspan="7" class="p-8 text-center text-slate-500">
              Belum ada transaksi
            </td>
          </tr>
        {/if}
        
        {#each state.invoices as inv}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <tr class="hover:bg-blue-50 cursor-pointer transition-colors" onclick={() => state.viewDetail(inv)}>
            <td class="p-4 text-sm text-slate-600">{state.formatDate(inv.createdAt)}</td>
            <td class="p-4 text-sm font-medium text-slate-800">{inv.invoiceNumber}</td>
            <td class="p-4 text-sm text-slate-700">{inv.customerName || '-'}</td>
            <td class="p-4 text-sm text-slate-600 capitalize">{inv.paymentMethod}</td>
            <td class="p-4 text-sm font-bold text-slate-800 text-right">{state.formatRp(inv.grandTotal)}</td>
            <td class="p-4 text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                inv.paymentStatus === 'voided' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }">
                {inv.paymentStatus === 'paid' ? 'Lunas' : inv.paymentStatus === 'voided' ? 'Batal (Void)' : 'Belum Lunas'}
              </span>
            </td>
            <td class="p-4 text-sm text-slate-500">{inv.creator?.name || 'Sistem'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
