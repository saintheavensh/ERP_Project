<script lang="ts">
  import { TicketIntakeState } from '$lib/states/tickets/ticket.intake.svelte';
  import IntakeForm from '$lib/components/tickets/IntakeForm.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new TicketIntakeState(data, data.token);
</script>

<svelte:head>
  <title>Terima Unit | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-4xl mx-auto">
  <div class="mb-6 flex items-center gap-4">
    <a href="/tickets" class="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Back to tickets">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
    </a>
    <h1 class="text-2xl font-bold text-slate-900">Terima Unit</h1>
  </div>

  <!-- R1.5D — bukti tiket tersimpan, tanpa memindahkan kasir dari form.
       Nomor tiketnya WAJIB tampil: itu satu-satunya pegangan kasir untuk
       menempelkannya di unit. Tetap terlihat sampai unit berikutnya disimpan,
       bukan hilang sendiri setelah beberapa detik — kasir yang sedang
       melayani orang tidak selalu sempat membaca toast yang keburu lenyap. -->
  {#if state.sukses}
    <div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4" role="status">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-start">
          <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class="font-semibold text-sm text-green-900">
              Tiket {state.sukses.ticketNumber} berhasil dibuat
            </h3>
            <p class="text-sm mt-1 text-green-800">
              Form sudah dikosongkan — langsung lanjut ke unit berikutnya.
            </p>
            {#if state.printMessage}
              <p class="text-sm mt-1 text-amber-700" data-testid="intake-print-status">{state.printMessage}</p>
            {/if}

            <!-- R1.9-T5 — kasir memilih sendiri apa yang dicetak (uji R1.8 F5).
                 Jalur cetaknya SAMA dengan cetak otomatis (`autoPrint()`), jadi
                 pemilihan printer & template per cabang tak bisa berbeda antara
                 keduanya. -->
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                class="text-xs font-medium border border-green-300 text-green-900 bg-white rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors disabled:opacity-50"
                disabled={state.cetakSedangJalan !== null}
                onclick={() => state.cetakDokumen(state.sukses!.id, 'label')}
                data-testid="intake-cetak-label"
              >
                {state.cetakSedangJalan === `${state.sukses.id}:label` ? 'Mencetak…' : 'Cetak Label'}
              </button>
              <button
                type="button"
                class="text-xs font-medium border border-green-300 text-green-900 bg-white rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors disabled:opacity-50"
                disabled={state.cetakSedangJalan !== null}
                onclick={() => state.cetakDokumen(state.sukses!.id, 'tanda_terima')}
                data-testid="intake-cetak-tanda-terima"
              >
                {state.cetakSedangJalan === `${state.sukses.id}:tanda_terima` ? 'Mencetak…' : 'Cetak Tanda Terima'}
              </button>
            </div>
          </div>
        </div>
        <a href="/tickets/{state.sukses.id}"
          class="text-sm font-medium text-green-800 underline hover:text-green-900 whitespace-nowrap">
          Lihat tiket
        </a>
      </div>
    </div>
  {/if}

  {#if state.errorMsg}
    <div class="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
      <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <h3 class="font-medium text-sm">Gagal menyimpan unit masuk</h3>
        <p class="text-sm mt-1">{state.errorMsg}</p>
      </div>
    </div>
  {/if}

  <IntakeForm {state} />

  <!-- R1.7 — pemilik (uji-R1.6 E1): "tinggal tambahkan riwayat input tiket
       service di bagian kasir untuk memastikannya". Di bawah form, bukan di
       atasnya: yang dikerjakan kasir adalah mengisi form, dan riwayat ini
       untuk memeriksa, bukan untuk dilihat lebih dulu. -->
  {#if state.riwayat.length > 0}
    <div class="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-4" data-testid="intake-riwayat">
      <h2 class="font-semibold text-slate-800 mb-1">Unit Masuk Terbaru</h2>
      <p class="text-sm text-slate-500 mb-3">Untuk memastikan unit yang barusan Anda catat sudah tersimpan.</p>
      <div class="divide-y divide-slate-100">
        {#each state.riwayat as item}
          <a
            href={`/tickets/${item.id}`}
            class="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
            data-testid="intake-riwayat-row"
          >
            <div class="min-w-0">
              <div class="text-sm font-medium text-slate-800 truncate">{item.customerName}</div>
              <div class="text-xs text-slate-500 truncate">{item.unit || 'Unit tidak dicatat'}</div>
            </div>
            <span class="shrink-0 font-mono text-xs text-slate-500">{item.ticketNumber}</span>
          </a>
        {/each}
      </div>
      <!-- R1.9-T5 — cetak ulang untuk unit yang sudah lewat: label copot, atau
           pelanggan minta tanda terimanya lagi. Baris di atas adalah TAUTAN ke
           halaman tiket, jadi tombolnya di luar tautan (tombol di dalam <a>
           adalah HTML yang tak sah dan klik-nya ikut membuka tautannya). -->
      <div class="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <span class="text-xs text-slate-500">Cetak ulang untuk unit terakhir:</span>
        <button
          type="button"
          class="text-xs font-medium border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
          disabled={state.cetakSedangJalan !== null}
          onclick={() => state.cetakDokumen(state.riwayat[0].id, 'label')}
          data-testid="riwayat-cetak-label"
        >
          Cetak Label
        </button>
        <button
          type="button"
          class="text-xs font-medium border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
          disabled={state.cetakSedangJalan !== null}
          onclick={() => state.cetakDokumen(state.riwayat[0].id, 'tanda_terima')}
          data-testid="riwayat-cetak-tanda-terima"
        >
          Cetak Tanda Terima
        </button>
      </div>
    </div>
  {/if}
</div>
