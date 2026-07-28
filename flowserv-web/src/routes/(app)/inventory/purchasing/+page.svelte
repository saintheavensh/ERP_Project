<script lang="ts">
  import { page } from '$app/stores';

  /**
   * S3 (track penyederhanaan) — SATU layar pembelian.
   *
   * Sebelumnya ada enam: dashboard, Purchase Orders, Goods Receipt, Receive PO
   * (Warehouse), Purchase Invoices, dan Input Invoice & Costing. Empat di
   * antaranya membaca daftar PO yang SAMA dan hanya berbeda saringan status —
   * dua bahkan identik (`/inventory/receive` dan `/inventory/purchasing/receipts`
   * sama-sama menampilkan PO berstatus 'ordered'). Namanya pun tak bisa
   * dibedakan, jadi pemakai harus menghafal, bukan membaca.
   *
   * Sekarang: satu daftar, tab status, dan tombol aksi yang MENYESUAIKAN baris.
   * Pekerjaan "terima barang" tak lagi jadi tujuan yang harus dicari di menu —
   * ia muncul sebagai tombol di PO yang memang sedang menunggu barang.
   */

  let { data } = $props();
  let orders = $derived(data.orders || []);

  const TABS = [
    { id: 'semua', label: 'Semua', match: () => true },
    { id: 'menunggu', label: 'Menunggu Barang', match: (o: any) => o.status === 'ordered' || o.status === 'partial' },
    { id: 'nota', label: 'Perlu Nota', match: (o: any) => o.status === 'received' },
    { id: 'draft', label: 'Draft', match: (o: any) => o.status === 'draft' },
    { id: 'selesai', label: 'Selesai', match: (o: any) => o.status === 'completed' }
  ];

  // ?status= di URL, pola yang sama dengan ?tab= di Setelan & ?mode= di Keuangan —
  // supaya tab yang sedang dibuka bisa di-bookmark dan bertahan saat halaman dimuat ulang.
  let activeTab = $derived($page.url.searchParams.get('status') || 'semua');
  let activeMatch = $derived((TABS.find((t) => t.id === activeTab) ?? TABS[0]).match);
  let visible = $derived(orders.filter(activeMatch));

  function countOf(tab: (typeof TABS)[number]) {
    return orders.filter(tab.match).length;
  }

  /** Tahapan PO dalam bahasa toko, bukan istilah sistem. */
  function stageOf(order: any) {
    if (order.status === 'draft') return { text: 'Draft', color: 'bg-slate-100 text-slate-700' };
    if (order.status === 'ordered') return { text: 'Menunggu barang', color: 'bg-yellow-100 text-yellow-700' };
    if (order.status === 'partial') return { text: 'Diterima sebagian', color: 'bg-orange-100 text-orange-700' };
    if (order.status === 'received') return { text: 'Perlu nota & harga', color: 'bg-blue-100 text-blue-700' };
    if (order.status === 'completed') {
      const inv = order.supplierInvoices?.[0];
      if (inv?.status === 'paid') return { text: 'Lunas', color: 'bg-green-100 text-green-700' };
      if (inv?.status === 'partial') return { text: 'Hutang sebagian', color: 'bg-orange-100 text-orange-700' };
      if (inv) return { text: 'Belum dibayar', color: 'bg-red-100 text-red-700' };
      return { text: 'Selesai', color: 'bg-green-100 text-green-700' };
    }
    return { text: order.status, color: 'bg-slate-100 text-slate-700' };
  }

  /**
   * Aksi utama sebuah PO ditentukan oleh keadaannya sekarang. Inilah yang
   * menggantikan dua layar terpisah: tak perlu tahu harus buka layar mana,
   * tombolnya sudah ada di baris yang tepat.
   */
  function primaryAction(order: any): { href: string; label: string } | null {
    if (order.status === 'ordered' || order.status === 'partial') {
      return { href: `/inventory/purchasing/${order.id}/receive`, label: 'Terima Barang' };
    }
    if (order.status === 'received') {
      return { href: `/inventory/purchasing/${order.id}/invoice`, label: 'Catat Nota' };
    }
    return null;
  }

  function rupiah(v: unknown) {
    return `Rp ${parseFloat(String(v ?? 0)).toLocaleString('id-ID')}`;
  }
</script>

<svelte:head>
  <title>Pembelian - FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Pembelian</h1>
      <p class="text-slate-500 mt-1">Dari pesan ke supplier, barang datang, catat nota, sampai lunas.</p>
    </div>
    <a href="/inventory/purchasing/new" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
      Pesan Barang
    </a>
  </div>

  <!-- Tab menggulir mendatar di ponsel, tak pernah membuat halaman meluber. -->
  <div class="flex gap-1 overflow-x-auto border-b border-slate-200 -mb-px" data-testid="purchasing-tabs">
    {#each TABS as tab (tab.id)}
      <a
        href={tab.id === 'semua' ? '/inventory/purchasing' : `/inventory/purchasing?status=${tab.id}`}
        data-testid="tab-{tab.id}"
        class="shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors
          {activeTab === tab.id
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'}"
      >
        {tab.label}
        <span class="ml-1 text-xs text-slate-400">{countOf(tab)}</span>
      </a>
    {/each}
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
   <div class="overflow-x-auto">
    <table class="w-full min-w-[900px] text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">Nomor PO</th>
          <th class="p-4">Tanggal</th>
          <th class="p-4">Supplier</th>
          <th class="p-4">Keadaan</th>
          <th class="p-4 text-right">Nilai</th>
          <th class="p-4 text-center">Jatuh Tempo</th>
          <th class="p-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each visible as order (order.id)}
          {@const stage = stageOf(order)}
          {@const action = primaryAction(order)}
          <tr class="hover:bg-slate-50 transition-colors" data-testid="po-row">
            <td class="p-4 font-medium text-slate-900">{order.poNumber}</td>
            <td class="p-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
            <td class="p-4 text-slate-900">{order.supplier?.name}</td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium {stage.color}">
                {stage.text}
              </span>
            </td>
            <td class="p-4 text-right">
              {#if order.status === 'completed' && order.actualTotal}
                <div class="font-bold text-slate-900">{rupiah(order.actualTotal)}</div>
                <div class="text-xs text-green-600">harga final</div>
              {:else}
                <div class="text-slate-600">{rupiah(order.estimatedTotal)}</div>
                <div class="text-xs text-slate-400">perkiraan</div>
              {/if}
            </td>
            <td class="p-4 text-center">
              {#if order.supplierInvoices?.[0]?.dueDate}
                <div class="text-sm font-medium text-slate-800">
                  {new Date(order.supplierInvoices[0].dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              {:else}
                <span class="text-slate-400 text-sm">-</span>
              {/if}
            </td>
            <td class="p-4">
              <div class="flex justify-end gap-2">
                {#if action}
                  <a href={action.href} data-testid="po-primary-action"
                    class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded">
                    {action.label}
                  </a>
                {/if}
                <a href={`/inventory/purchasing/${order.id}`}
                  class="text-slate-600 hover:text-slate-900 text-sm font-medium border px-3 py-1.5 rounded">
                  Lihat
                </a>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="7" class="p-8 text-center text-slate-500">
              {activeTab === 'semua' ? 'Belum ada pembelian.' : 'Tidak ada PO di tahap ini.'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
   </div>
  </div>
</div>
