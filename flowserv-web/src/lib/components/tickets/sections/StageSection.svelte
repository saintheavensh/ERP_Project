<script lang="ts">
  // R2.1 — dipindahkan APA ADANYA dari TicketWorkspace.svelte (baris 511–563).
  //
  // Ini bagian yang R2.4 akan ubah paling banyak (form per tahap + gerbang
  // "data tahapnya lengkap"). Memisahkannya lebih dulu justru itu gunanya:
  // perubahan besar nanti terjadi di satu berkas 60-baris, bukan di tengah
  // berkas 543-baris.
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<!-- Action Forms (Phase 3 Hardcoded dynamic forms) -->
<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
  <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
    <!-- R1.11-T3 — testid dipasang di sini karena inilah yang pemilik lihat
         tidak berubah: "di halaman detail kasir masih intake posisinya".
         (Label "Current Stage" masih bahasa Inggris — sisa yang lolos dari S1.
         Sengaja TIDAK diganti di sini: itu perubahan teks yang tak diminta di
         fase ini, dan R1.11 sudah punya scope sendiri. Dicatat sebagai R4.) -->
    <h2 class="font-semibold text-slate-800">Current Stage: <span class="text-blue-600" data-testid="tahap-saat-ini">{state.currentNode?.name}</span></h2>
    <p class="text-xs text-slate-500 mt-1">{state.currentNode?.description}</p>
  </div>

  <div class="p-6">
    {#if state.ticket?.status === 'closed' || state.ticket?.status === 'cancelled'}
      <div class="text-center text-slate-500 py-8">
        This ticket is already closed. No further actions can be taken.
      </div>
    {:else if state.availableTransitions.length === 0}
      <div class="text-center text-slate-500 py-8">
        This is the final stage. No further transitions available.
      </div>
    {:else}
      <!-- Form Panel -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="next">Pilih Tahap Berikutnya</label>
          <select id="next" value={state.selectedTransition} onchange={(e) => state.selectTransition(e.currentTarget.value)} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">-- Select Action --</option>
            {#each state.availableTransitions as t}
              <option value={t.toNodeId}>{t.name} &rarr; {t.targetNodeName}</option>
            {/each}
          </select>
        </div>

        {#if state.selectedTransition}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="notes">Action Notes</label>
            <textarea id="notes" bind:value={state.transitionNotes} rows="3" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Required parts, diagnosis result, or reason..."></textarea>
          </div>

          <div class="flex justify-end pt-2">
            <button
              onclick={() => state.executeTransition()}
              disabled={state.loading}
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center">
              {#if state.loading} Processing... {:else} Execute {/if}
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
