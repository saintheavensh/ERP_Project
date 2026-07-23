<script lang="ts">
  import StatCard from '$lib/components/dashboard/StatCard.svelte';

  let { data } = $props();

  function formatRp(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }
</script>

<svelte:head>
  <title>Finance Dashboard | FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
  <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <h1 class="text-2xl font-bold text-slate-900">Finance Dashboard</h1>

    <!-- P5 — mode toggle. Two links (?mode=simple|accountant), not a client
         toggle: SSR-friendly, bookmarkable, same idiom the Kanban board uses
         for ?flowTemplateId=. -->
    <div class="inline-flex bg-slate-100 rounded-lg p-1 text-sm font-medium">
      <a
        href="/finance?mode=simple"
        class="px-3 py-1.5 rounded-md transition-colors {data.mode === 'simple' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}"
      >
        Simple
      </a>
      <a
        href="/finance?mode=accountant"
        class="px-3 py-1.5 rounded-md transition-colors {data.mode === 'accountant' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}"
      >
        Accountant
      </a>
    </div>
  </div>

  {#if data.mode === 'simple'}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Pendapatan Hari Ini" value={formatRp(data.today.revenue)} subtitle={`${data.today.entryCount} transaksi`} />
      <StatCard
        title="Estimasi Laba Bulan Ini"
        value={formatRp(data.month.estimatedProfit)}
        subtitle="Pendapatan dikurangi modal"
        tone={data.month.estimatedProfit >= 0 ? 'success' : 'danger'}
      />
      <StatCard title="Piutang (AR)" value={formatRp(data.arTotal)} subtitle={`${data.arCount} faktur belum lunas`} href="/finance/receivables" />
      <StatCard title="Hutang (AP)" value={formatRp(data.apTotal)} subtitle={`${data.apCount} tagihan belum lunas`} href="/finance/payables" />
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-800">Ringkasan Laba Rugi (Bulan Ini)</h2>
          <a href="/finance/ledger" class="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
            Lihat Buku Besar &rarr;
          </a>
        </div>
        <!-- Single-sided ledger, not a real Chart-of-Accounts P&L — see
             plan/P5-finance-dashboard.md for why this is intentionally simple. -->
        <table class="w-full text-sm">
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="py-2.5 text-slate-600">Pendapatan</td>
              <td class="py-2.5 text-right font-medium text-slate-900">{formatRp(data.month.revenue)}</td>
            </tr>
            <tr>
              <td class="py-2.5 text-slate-600">HPP (Modal Barang Terjual)</td>
              <td class="py-2.5 text-right font-medium text-slate-900">({formatRp(data.month.cogs)})</td>
            </tr>
            <tr class="border-t-2 border-slate-200">
              <td class="py-3 font-semibold text-slate-800">Laba Kotor</td>
              <td class="py-3 text-right font-bold {data.month.estimatedProfit >= 0 ? 'text-green-700' : 'text-red-600'}">
                {formatRp(data.month.estimatedProfit)}
              </td>
            </tr>
          </tbody>
        </table>
        <p class="text-xs text-slate-400 mt-3">{data.month.entryCount} entri buku besar bulan ini.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
        <StatCard title="Piutang (AR)" value={formatRp(data.arTotal)} subtitle={`${data.arCount} faktur belum lunas`} href="/finance/receivables" />
        <StatCard title="Hutang (AP)" value={formatRp(data.apTotal)} subtitle={`${data.apCount} tagihan belum lunas`} href="/finance/payables" />
      </div>
    </div>
  {/if}
</div>
