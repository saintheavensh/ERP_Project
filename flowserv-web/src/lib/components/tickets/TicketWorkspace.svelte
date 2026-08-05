<script lang="ts">
  // ---------------------------------------------------------------------------
  // R2.1 (2026-08-06) — berkas ini **menyusun**, tidak lagi merender.
  //
  // Sebelumnya 543 baris berisi delapan bagian berbeda dalam satu berkas, dan
  // itu yang membuat R2 mustahil dikerjakan dengan rapi: "halaman tiket
  // menyesuaikan peran" berarti memutuskan bagian mana yang muncul untuk siapa,
  // dan bagian-bagiannya belum pernah punya batas.
  //
  // Yang SENGAJA tidak ikut dipecah: `TicketDetailState` (855 baris) tetap satu
  // objek, diteruskan apa adanya ke tiap bagian. Memecah tampilan dan memecah
  // state sekaligus membuat kegagalan sulit dilacak — dan tampilan yang salah
  // masih bisa dilihat mata, sedangkan state yang salah tidak.
  //
  // Bukti bahwa ini refactor MURNI, bukan perubahan yang menyamar: spec
  // `p4-ticket-detail-polish` dan `intake-to-close` lulus **tanpa satu baris pun
  // di spec itu disunting**. Kalau spec-nya sampai perlu disunting, ini bukan
  // refactor lagi dan harus dihentikan.
  //
  // Header + banner error tetap di sini: keduanya bukan "bagian", melainkan
  // bingkai halaman — dan tak satu peran pun akan kehilangan keduanya.
  // ---------------------------------------------------------------------------
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import CustomerDeviceSection from './sections/CustomerDeviceSection.svelte';
  import PrintSection from './sections/PrintSection.svelte';
  import DiagnosisSection from './sections/DiagnosisSection.svelte';
  import TechnicianSection from './sections/TechnicianSection.svelte';
  import ChargesSection from './sections/ChargesSection.svelte';
  import ChecklistSection from './sections/ChecklistSection.svelte';
  import StageSection from './sections/StageSection.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<div class="flex-1 space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-4">
      <a href="/tickets" class="text-slate-500 hover:text-slate-800" aria-label="Back to tickets">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </a>
      <h1 class="text-2xl font-bold text-slate-900">Workspace</h1>
    </div>
    <div class="flex items-center gap-3">
      {#if state.canCancel}
        <button
          onclick={() => state.openCancelModal()}
          class="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-full border border-red-200 hover:bg-red-50 transition-colors"
        >
          Batalkan Tiket
        </button>
      {/if}
      <div class="px-3 py-1 bg-slate-800 text-white text-sm font-medium rounded-full">
        {state.ticket?.status.toUpperCase()}
      </div>
    </div>
  </div>

  <!-- Error Banner -->
  {#if state.errorMsg}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
      <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span>{state.errorMsg}</span>
    </div>
  {/if}

  <CustomerDeviceSection {state} />
  <PrintSection {state} />
  <DiagnosisSection {state} />
  <TechnicianSection {state} />
  <ChargesSection {state} />
  <ChecklistSection {state} />
  <StageSection {state} />
</div>
