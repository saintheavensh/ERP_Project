<script lang="ts">
  import { API_BASE } from '$lib/api/config';
  import { claimTicket } from '$lib/api/tickets';
  import { passcodeText } from '$lib/utils/pattern';

  /**
   * R1.7 — popup "lihat dulu, baru ambil" untuk antrian teknisi.
   *
   * Pemilik (uji-R1.6 B1): "untuk detailnya jangan buka halaman baru jika ingin
   * lihat detail munculkan popup saja... muncul popup semua yang di inputkan
   * kasir keluhan nama tanggal pola dan lain sebagainya nanti teknisi tersebut
   * memutuskan jika ingin mengambil pekerjaan tersebut tinggal klik ambil
   * pekerjaan".
   *
   * Isinya diambil dari `GET /v1/tickets/:id` saat popup DIBUKA, bukan dari
   * baris daftarnya. Alasannya bukan kerapian: daftar tiket tidak mengembalikan
   * keluhan, nomor telepon, maupun sandi/pola — dan menambahkannya ke daftar
   * berarti mengirim sandi setiap unit ke setiap layar yang memuat daftar
   * (papan Kanban, daftar kasir), padahal yang butuh cuma popup ini.
   *
   * Sengaja HANYA untuk antrian (memutuskan mau mengambil atau tidak).
   * Tiket yang sudah dipegang tetap membuka halaman kerja penuh — di sana ada
   * biaya, daftar periksa, dan perpindahan tahap, yang tak muat di popup.
   */

  let {
    ticketId,
    token,
    onclose,
    onclaimed,
  }: {
    ticketId: string;
    token: string;
    onclose: () => void;
    onclaimed: () => void;
  } = $props();

  let detail = $state<any>(null);
  let loadError = $state('');
  let claiming = $state(false);
  let claimError = $state('');

  $effect(() => {
    const id = ticketId;
    let dibatalkan = false;
    (async () => {
      detail = null;
      loadError = '';
      try {
        const res = await fetch(`${API_BASE}/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (dibatalkan) return;
        if (!res.ok) {
          loadError = 'Gagal memuat rincian tiket.';
          return;
        }
        detail = (await res.json()).data;
      } catch {
        if (!dibatalkan) loadError = 'Tidak bisa menghubungi server.';
      }
    })();
    return () => {
      dibatalkan = true;
    };
  });

  async function ambil() {
    claiming = true;
    claimError = '';
    const hasil = await claimTicket(token, ticketId);
    claiming = false;
    if (hasil.ok) onclaimed();
    else claimError = hasil.message;
  }

  function tanggal(nilai: string | undefined) {
    if (!nilai) return '-';
    return new Date(nilai).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<!-- Latar gelap. Klik di luar kotak = tutup, sama seperti modal lain di app ini. -->
<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
  role="presentation"
  onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
>
  <div
    class="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-label="Rincian tiket menunggu diambil"
    data-testid="antrian-detail-dialog"
  >
    <div class="flex items-start justify-between gap-3 p-5 border-b border-slate-200 sticky top-0 bg-white">
      <div>
        <h2 class="font-semibold text-slate-900">Rincian Unit Masuk</h2>
        <p class="text-xs text-slate-500 mt-0.5">Dicatat kasir di konter. Putuskan mau mengambilnya atau tidak.</p>
      </div>
      <button
        type="button"
        onclick={onclose}
        aria-label="Tutup"
        class="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="p-5">
      {#if loadError}
        <p class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loadError}</p>
      {:else if !detail}
        <p class="text-sm text-slate-400">Memuat…</p>
      {:else}
        {@const t = detail.ticket}
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="text-xs uppercase tracking-wider text-slate-400">Pelanggan</dt>
            <dd class="font-medium text-slate-900">{detail.customer?.name ?? '-'}</dd>
            {#if detail.customer?.phone}
              <dd class="text-slate-600">{detail.customer.phone}</dd>
            {/if}
          </div>

          <div>
            <dt class="text-xs uppercase tracking-wider text-slate-400">Unit</dt>
            <dd class="font-medium text-slate-900">
              {detail.asset?.assetType ?? '-'} — {detail.asset?.brand ?? ''} {detail.asset?.model ?? ''}
            </dd>
            {#if detail.asset?.serialNumber}
              <dd class="text-slate-600">No. seri: {detail.asset.serialNumber}</dd>
            {/if}
          </div>

          <div>
            <dt class="text-xs uppercase tracking-wider text-slate-400">Keluhan</dt>
            <dd class="text-slate-900 whitespace-pre-wrap" data-testid="antrian-keluhan">
              {t?.reportedComplaint || 'Tidak dicatat.'}
            </dd>
          </div>

          <!-- Sandi/pola ditampilkan penuh: teknisi TIDAK bisa mengerjakan unit
               terkunci tanpanya, dan itu justru alasan kasir mencatatnya. -->
          <div>
            <dt class="text-xs uppercase tracking-wider text-slate-400">Sandi / Pola</dt>
            <dd class="text-slate-900 font-mono" data-testid="antrian-sandi">
              {t?.devicePasscode ? passcodeText(t.devicePasscode) : 'Tidak terkunci / tidak dicatat.'}
            </dd>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <dt class="text-xs uppercase tracking-wider text-slate-400">Masuk</dt>
              <dd class="text-slate-900">{tanggal(t?.createdAt)}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wider text-slate-400">No. Antrian</dt>
              <dd class="text-slate-900">{t?.queueNumber ?? '-'}</dd>
            </div>
          </div>

          <div>
            <dt class="text-xs uppercase tracking-wider text-slate-400">Tahap Sekarang</dt>
            <dd class="text-slate-900">{detail.node?.name ?? '-'}</dd>
          </div>
        </dl>

        {#if claimError}
          <p class="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="antrian-claim-error">
            {claimError}
          </p>
        {/if}

        <div class="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <a
            href={`/tickets/${ticketId}`}
            class="text-center px-4 min-h-[44px] flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
          >
            Buka halaman kerja
          </a>
          <button
            type="button"
            onclick={ambil}
            disabled={claiming}
            class="px-5 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
            data-testid="antrian-ambil"
          >
            {claiming ? 'Mengambil…' : 'Ambil Pekerjaan'}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
