<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { API_BASE } from '$lib/api/config';
  import StatCard from '$lib/components/dashboard/StatCard.svelte';
  import AntrianDetailDialog from '$lib/components/tickets/AntrianDetailDialog.svelte';

  let { data } = $props();

  // R1.5A — diisi penjaga layout saat sebuah peran membuka halaman yang bukan
  // haknya. Mengatakannya terus terang lebih baik daripada pentalan diam yang
  // terlihat seperti tautan rusak.
  //
  // R1.7 — datang dari cookie sekali pakai yang sudah dihapus server saat
  // dibaca, bukan dari `?ditolak=` di alamat. Alamatnya tak pernah kotor, jadi
  // tak ada yang perlu dibersihkan di browser — dan "hilang setelah refresh"
  // dijamin, bukan diusahakan. Lihat DITOLAK_COOKIE di `(app)/+layout.server.ts`
  // untuk kenapa tiga percobaan pembersihan dari sisi klien semuanya rapuh.
  const ditolak = $derived(data.ditolak ?? '');

  // R1.7 — antrian tak bertuan bisa dilihat isinya lewat popup sebelum diambil,
  // tanpa berpindah halaman (uji-R1.6 B1).
  let antrianTerpilih = $state('');

  async function antrianDiambil() {
    antrianTerpilih = '';
    await invalidateAll();
  }

  function formatRp(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }

  // P11 — quick actions on the Technician dashboard. Same transition call the
  // Kanban board's move() makes, scoped here to a single ticket row instead of
  // a drag/tap-panel — the point of "quick" is not needing to open the board.
  let movingTicketId = $state('');
  let quickActionError = $state('');

  async function quickMove(ticketId: string, targetNodeId: string) {
    movingTicketId = ticketId;
    quickActionError = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.token}`,
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ targetNodeId }),
      });
      const result = await res.json();
      if (!res.ok) {
        quickActionError = result.error?.message || 'Gagal memindahkan tiket';
        return;
      }
      await invalidateAll();
    } catch {
      quickActionError = 'Network error';
    } finally {
      movingTicketId = '';
    }
  }
</script>

<svelte:head>
  <title>Dashboard | FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
  <h1 class="text-2xl font-bold text-slate-900 mb-4">Beranda</h1>

  {#if ditolak}
    <div class="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
      <p class="font-semibold">Halaman itu bukan untuk peran Anda</p>
      <p class="mt-1">
        <code class="rounded bg-amber-100 px-1 py-0.5">{ditolak}</code>
        hanya bisa dibuka oleh peran yang berwenang. Bila Anda memang membutuhkannya,
        minta pemilik atau admin mengubah peran akun Anda.
      </p>
    </div>
  {/if}

  {#if data.overview}
    {@const o = data.overview}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard title="Tiket Terbuka" value={String(o.openTicketsTotal)} subtitle="Semua cabang" href="/tickets/board" />
      <StatCard
        title="Stok Menipis"
        value={String(o.lowStockCount)}
        subtitle={o.lowStockCount > 0 ? 'Perlu perhatian' : 'Aman'}
        tone={o.lowStockCount > 0 ? 'warning' : 'success'}
        href="/inventory?lowStock=true"
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <StatCard title="Tugas Saya" value={String(t.total)} subtitle="Tiket terbuka yang ditugaskan" href="/tickets/board" />
      <!-- R1 — pekerjaan yang menunggu diambil. Ditautkan ke /tickets, tempat
           kelompok "Menunggu Diambil" berada; tone amber saat ada isinya supaya
           terbaca sebagai "ada yang perlu diambil", bukan sekadar angka. -->
      <StatCard
        title="Menunggu Diambil"
        value={String(t.unassignedTotal ?? 0)}
        subtitle="Tiket yang belum ada teknisinya"
        tone={(t.unassignedTotal ?? 0) > 0 ? 'warning' : 'default'}
        href="/tickets"
      />
      <StatCard
        title="Tahap Terbanyak"
        value={t.byStage[0]?.name || '-'}
        subtitle={t.byStage[0] ? `${t.byStage[0].count} tiket` : ''}
      />
    </div>

    <!-- R1.7 — antrian pindah ke beranda, lengkap dengan barisnya. Ditaruh DI
         ATAS "Tiket Terbaru Saya" karena pekerjaan yang menunggu diambil adalah
         hal pertama yang perlu dilihat teknisi saat membuka aplikasi — urutan
         yang sama dengan halaman /tickets. -->
    {#if (t.unassignedRecent?.length ?? 0) > 0}
      <div class="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-6" data-testid="beranda-antrian">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <h2 class="font-semibold text-slate-800">Menunggu Diambil</h2>
          <span class="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
            {t.unassignedTotal}
          </span>
        </div>
        <p class="text-sm text-slate-500 mb-3">
          Ketuk salah satu untuk melihat catatan kasir, lalu putuskan mau mengambilnya.
        </p>

        <div class="divide-y divide-slate-100">
          {#each t.unassignedRecent as ticket}
            <button
              type="button"
              onclick={() => (antrianTerpilih = ticket.id)}
              class="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-amber-50/50 -mx-2 px-2 rounded transition-colors"
              data-testid="beranda-antrian-row"
            >
              <div class="min-w-0">
                <div class="text-sm font-medium text-slate-800 truncate">{ticket.customerName}</div>
                <div class="text-xs text-slate-500 truncate">
                  {ticket.assetType} - {ticket.brand || ''} {ticket.model || ''}
                </div>
              </div>
              <span class="shrink-0 text-xs font-medium text-blue-700">Lihat &amp; Ambil &rarr;</span>
            </button>
          {/each}
        </div>

        {#if t.unassignedTotal > t.unassignedRecent.length}
          <a href="/tickets" class="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-800">
            Lihat semua {t.unassignedTotal} antrian &rarr;
          </a>
        {/if}
      </div>
    {/if}

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 class="font-semibold text-slate-800 mb-3">Tiket Terbaru Saya</h2>

      {#if quickActionError}
        <div class="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {quickActionError}
        </div>
      {/if}

      {#if t.recent.length === 0}
        <p class="text-sm text-slate-400">Belum ada tiket yang ditugaskan ke Anda.</p>
      {:else}
        <div class="divide-y divide-slate-100">
          {#each t.recent as ticket}
            <div class="py-2.5" data-testid="technician-ticket-row">
              <a href={`/tickets/${ticket.id}`} class="flex items-center justify-between gap-2 hover:bg-slate-50 -mx-2 px-2 py-1 rounded transition-colors">
                <div class="min-w-0">
                  <div class="text-sm font-medium text-slate-800 truncate">{ticket.customerName}</div>
                  <div class="text-xs text-slate-500 truncate">{ticket.assetType} - {ticket.brand || ''} {ticket.model || ''}</div>
                </div>
                <span class="shrink-0 text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-600">{ticket.nodeName}</span>
              </a>

              {#if ticket.quickActions?.length > 0}
                <div class="flex flex-wrap gap-2 mt-2">
                  {#each ticket.quickActions as action}
                    <button
                      type="button"
                      disabled={movingTicketId === ticket.id}
                      onclick={() => quickMove(ticket.id, action.targetNodeId)}
                      class="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {movingTicketId === ticket.id ? 'Memproses...' : `→ ${action.targetNodeName}`}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
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

{#if antrianTerpilih}
  <AntrianDetailDialog
    ticketId={antrianTerpilih}
    token={data.token}
    onclose={() => (antrianTerpilih = '')}
    onclaimed={antrianDiambil}
  />
{/if}
