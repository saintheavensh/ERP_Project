<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { format, differenceInDays } from 'date-fns';
  import { id } from 'date-fns/locale';

  let { data } = $props();
  let payables = $derived(data.payables || []);

  function formatMoney(amount: number | string) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount));
  }

  function getStatusColor(dueDateStr: string | null) {
    if (!dueDateStr) return 'text-slate-500 bg-slate-100';
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) return 'text-red-700 bg-red-100 font-bold'; // Overdue
    if (diff <= 3) return 'text-orange-700 bg-orange-100 font-medium'; // Nearing
    return 'text-green-700 bg-green-100'; // Safe
  }

  function getStatusText(dueDateStr: string | null) {
    if (!dueDateStr) return 'N/A';
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) return `Jatuh Tempo (Lewat ${Math.abs(diff)} hari)`;
    if (diff === 0) return 'Jatuh Tempo Hari Ini';
    return `${diff} hari lagi`;
  }
</script>

<svelte:head>
  <title>Accounts Payable (Hutang) | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Manajemen Hutang (Accounts Payable)</h1>
      <p class="text-sm text-slate-500">Daftar tagihan supplier yang belum lunas atau berstatus tempo.</p>
    </div>
  </div>

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
        {#if payables.length === 0}
          <tr>
            <td colspan="7" class="p-8 text-center text-slate-500">
              Tidak ada data hutang aktif. Semua tagihan sudah lunas! 🎉
            </td>
          </tr>
        {:else}
          {#each payables as p}
            {@const sisaHutang = Number(p.totalAmount) - Number(p.amountPaid)}
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="p-4">
                <div class="font-medium text-slate-900">{p.supplier?.name || 'Unknown Supplier'}</div>
                <div class="text-xs text-slate-500">Inv: {p.invoiceNumber || '-'}</div>
              </td>
              <td class="p-4 text-slate-700 text-sm">{p.purchaseOrder?.poNumber || '-'}</td>
              <td class="p-4 text-right text-slate-700 font-medium">
                {formatMoney(p.totalAmount)}
              </td>
              <td class="p-4 text-right text-red-600 font-bold">
                {formatMoney(sisaHutang)}
              </td>
              <td class="p-4">
                {#if p.dueDate}
                  <div class="text-sm font-medium text-slate-800">
                    {format(new Date(p.dueDate), 'dd MMM yyyy', { locale: id })}
                  </div>
                  <div class="text-[11px] mt-0.5 px-2 py-0.5 rounded-full inline-block {getStatusColor(p.dueDate)}">
                    {getStatusText(p.dueDate)}
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
</div>
