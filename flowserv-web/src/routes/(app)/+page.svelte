<script lang="ts">
  import StatCard from '$lib/components/dashboard/StatCard.svelte';

  let { data } = $props();

  function formatRp(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }
</script>

<svelte:head>
  <title>Dashboard | FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
  <h1 class="text-2xl font-bold text-slate-900 mb-4">Dashboard</h1>

  {#if data.overview}
    {@const o = data.overview}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard title="Tiket Terbuka" value={String(o.openTicketsTotal)} subtitle="Semua cabang" href="/tickets/board" />
      <StatCard
        title="Stok Menipis"
        value={String(o.lowStockCount)}
        subtitle={o.lowStockCount > 0 ? 'Perlu perhatian' : 'Aman'}
        tone={o.lowStockCount > 0 ? 'warning' : 'success'}
        href="/inventory"
      />
      <StatCard title="Piutang (AR)" value={formatRp(o.arTotal)} subtitle={`${o.arCount} faktur belum lunas`} href="/finance/receivables" />
      <StatCard title="Hutang (AP)" value={formatRp(o.apTotal)} subtitle={`${o.apCount} tagihan belum lunas`} href="/finance/payables" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h2 class="font-semibold text-slate-800 mb-3">Tiket per Tahap</h2>
        {#if o.byStage.length === 0}
          <p class="text-sm text-slate-400">Tidak ada tiket terbuka.</p>
        {:else}
          <div class="space-y-2">
            {#each o.byStage as stage}
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">{stage.name}</span>
                <span class="font-medium bg-slate-100 rounded-full px-2.5 py-0.5 text-slate-700">{stage.count}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-slate-800">Penjualan Hari Ini</h2>
          <a href="/pos/history" class="text-xs text-blue-600 hover:text-blue-800 font-medium">Riwayat &rarr;</a>
        </div>
        <div class="text-3xl font-bold text-slate-900">{formatRp(o.todaySalesTotal)}</div>
        <p class="text-sm text-slate-400 mt-1">{o.todaySalesCount} transaksi</p>

        {#if o.lowStockItems.length > 0}
          <div class="mt-4 pt-4 border-t border-slate-100">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Stok Terendah</h3>
            <div class="space-y-1.5">
              {#each o.lowStockItems as item}
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-600 truncate">{item.name}</span>
                  <span class="text-amber-700 font-medium">{item.totalAvailable} / {item.reorderPoint}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else if data.technician}
    {@const t = data.technician}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <StatCard title="Tugas Saya" value={String(t.total)} subtitle="Tiket terbuka yang ditugaskan" href="/tickets/board" />
      <StatCard
        title="Tahap Terbanyak"
        value={t.byStage[0]?.name || '-'}
        subtitle={t.byStage[0] ? `${t.byStage[0].count} tiket` : ''}
      />
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 class="font-semibold text-slate-800 mb-3">Tiket Terbaru Saya</h2>
      {#if t.recent.length === 0}
        <p class="text-sm text-slate-400">Belum ada tiket yang ditugaskan ke Anda.</p>
      {:else}
        <div class="divide-y divide-slate-100">
          {#each t.recent as ticket}
            <a href={`/tickets/${ticket.id}`} class="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors">
              <div>
                <div class="text-sm font-medium text-slate-800">{ticket.customerName}</div>
                <div class="text-xs text-slate-500">{ticket.assetType} - {ticket.brand || ''} {ticket.model || ''}</div>
              </div>
              <span class="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-600">{ticket.nodeName}</span>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  {:else if data.cashier}
    {@const cs = data.cashier}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard title="Penjualan Hari Ini" value={formatRp(cs.todaySalesTotal)} subtitle={`${cs.todaySalesCount} transaksi`} href="/pos" />
      <StatCard title="Piutang (AR)" value={formatRp(cs.arTotal)} subtitle={`${cs.arCount} faktur belum lunas`} href="/finance/receivables" />
    </div>
  {:else}
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
      Tidak ada dashboard untuk peran Anda saat ini.
    </div>
  {/if}
</div>
