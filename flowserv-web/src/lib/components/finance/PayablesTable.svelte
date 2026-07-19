<script lang="ts">
  import type { PayablesState } from '$lib/states/finance/payables.svelte';

  let { state } = $props<{ state: PayablesState }>();
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  <table class="w-full text-left border-collapse">
    <thead>
      <tr class="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
        <th class="p-4 font-medium">Invoice Supplier</th>
        <th class="p-4 font-medium">Nomor PO</th>
        <th class="p-4 font-medium text-right">Total Tagihan</th>
        <th class="p-4 font-medium text-right">Sisa Hutang</th>
        <th class="p-4 font-medium">Jatuh Tempo</th>
        <th class="p-4 font-medium text-center">Status</th>
        <th class="p-4 font-medium text-right">Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#if state.payables.length === 0}
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-500">
            Tidak ada data hutang aktif. Semua tagihan sudah lunas! 🎉
          </td>
        </tr>
      {:else}
        {#each state.payables as p}
          {@const sisaHutang = Number(p.totalAmount) - Number(p.amountPaid)}
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4">
              <div class="font-medium text-slate-900">{p.supplier?.name || 'Unknown Supplier'}</div>
              <div class="text-xs text-slate-500">Inv: {p.invoiceNumber || '-'}</div>
            </td>
            <td class="p-4 text-slate-700 text-sm">{p.purchaseOrder?.poNumber || '-'}</td>
            <td class="p-4 text-right text-slate-700 font-medium">
              {state.formatMoney(p.totalAmount)}
            </td>
            <td class="p-4 text-right text-red-600 font-bold">
              {state.formatMoney(sisaHutang)}
            </td>
            <td class="p-4">
              {#if p.dueDate}
                <div class="text-sm font-medium text-slate-800">
                  {state.formatDate(p.dueDate)}
                </div>
                <div class="text-[11px] mt-0.5 px-2 py-0.5 rounded-full inline-block {state.getStatusColor(p.dueDate)}">
                  {state.getStatusText(p.dueDate)}
                </div>
              {:else}
                <span class="text-slate-400 text-sm">Tidak ada</span>
              {/if}
            </td>
            <td class="p-4 text-center">
              <span class="inline-block px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full capitalize">
                {p.status}
              </span>
            </td>
            <td class="p-4 text-right">
              <button class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors">
                Bayar
              </button>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
