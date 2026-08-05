<script lang="ts">
  // R2.1 — dipindahkan APA ADANYA dari TicketWorkspace.svelte (baris 280–329).
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<!-- Tahap B — hasil diagnosa + estimasi waktu. Muncul di tahap yang
     templatenya menandai requiresDiagnosis, bukan di tahap bernama
     "Diagnosis": toko bebas memindahkannya lewat pengaturan alur. -->
{#if state.diagnosisRequired || state.ticket?.diagnosis}
  <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" data-testid="diagnosis-panel">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hasil Diagnosa &amp; Estimasi Waktu</h3>
      <!-- R1.11-T2 — arah sebaliknya dari sandi/keluhan: ini yang teknisi
           TEMUKAN, jadi kasir membacanya dan tidak menulisnya. Sebelum R1.11
           kasir benar-benar bisa menulis hasil diagnosa (terverifikasi: 200),
           menabrak komentar di db/seed/01-core.ts yang sudah menyatakan
           sebaliknya sejak awal. -->
      {#if !state.diagnosisEditing && state.bolehUbahDiagnosa && state.ticket?.status !== 'closed' && state.ticket?.status !== 'cancelled'}
        <button onclick={() => state.openDiagnosisEdit()} data-testid="ubah-diagnosa" class="text-blue-600 hover:text-blue-800 text-xs font-medium">
          {state.ticket?.diagnosis ? 'Edit' : 'Isi Diagnosa'}
        </button>
      {/if}
    </div>

    {#if state.diagnosisEditing}
      <div class="space-y-3">
        <div>
          <label for="diagnosis" class="block text-xs font-medium text-slate-600 mb-1">Temuan teknisi</label>
          <textarea id="diagnosis" bind:value={state.diagnosisDraft} rows="3"
            placeholder="mis. IC power short, konektor cas rusak"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div>
          <label for="duration" class="block text-xs font-medium text-slate-600 mb-1">Estimasi lama pengerjaan (menit)</label>
          <input id="duration" type="number" min="1" bind:value={state.durationDraft}
            placeholder="mis. 120 untuk 2 jam"
            class="w-full sm:w-64 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="text-xs text-slate-400 mt-1">Yang dijanjikan ke pelanggan adalah durasinya, jadi dicatat sebagai lama pengerjaan — bukan jam selesai.</p>
        </div>
        <div class="flex gap-2">
          <button onclick={() => state.saveDiagnosis()} disabled={state.diagnosisLoading}
            class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg">
            {state.diagnosisLoading ? 'Menyimpan...' : 'Simpan Diagnosa'}
          </button>
          <button onclick={() => state.diagnosisEditing = false} class="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2">Batal</button>
        </div>
      </div>
    {:else}
      <p class="text-sm text-slate-900">{state.ticket?.diagnosis || 'Belum diisi.'}</p>
      {#if state.estimatedDurationText}
        <p class="text-sm text-slate-500 mt-1">Estimasi pengerjaan: <b class="text-slate-700">{state.estimatedDurationText}</b></p>
      {/if}
    {/if}
  </div>
{/if}
