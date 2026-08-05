<script lang="ts">
  // R2.1 — dipindahkan APA ADANYA dari TicketWorkspace.svelte (baris 331–378).
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<!-- F1 — Technician assignment (wires H8's previously-orphaned POST /:id/assign) -->
<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
  <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
    <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Technician</h3>
    <!-- Tahap B — "teknisi bisa mengambil pekerjaan dari yang menunggu
         antrian". Hanya muncul saat tiket belum bertuan; menugaskan diri
         sendiri, bukan orang lain (izinnya pun beda di backend). -->
    {#if !state.assignedTechnician && state.ticket?.status === 'open'}
      <button
        onclick={() => state.claim()}
        disabled={state.assignLoading}
        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
        data-testid="claim-ticket"
      >
        {state.assignLoading ? 'Mengambil...' : 'Ambil Pekerjaan'}
      </button>
    {/if}
  </div>
  {#if state.ticket?.queueNumber}
    <p class="text-xs text-slate-400 mb-2">Nomor antrian {state.ticket.queueNumber}</p>
  {/if}
  {#if state.ticket?.status === 'closed' || state.ticket?.status === 'cancelled' || !state.canAssignOthers}
    <!-- R1.7 — teknisi hanya MEMBACA siapa pemegang tiket. Menugaskan orang
         lain adalah wewenang manajer, dan backend memang sudah menolaknya;
         dropdown-nya hanya membingungkan. Tombol "Ambil Pekerjaan" di atas
         tidak ikut hilang — itu menugaskan DIRI SENDIRI, izinnya beda. -->
    <p class="font-bold text-lg text-slate-900" data-testid="assigned-technician-name">
      {state.assignedTechnician?.name || 'Belum ditugaskan'}
    </p>
  {:else}
    <div class="flex items-center gap-3">
      <select
        value={state.assignedTechnician?.id || ''}
        onchange={(e) => state.assign(e.currentTarget.value)}
        disabled={state.assignLoading}
        class="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
      >
        <option value="" disabled selected={!state.assignedTechnician}>-- Pilih Teknisi --</option>
        {#each state.technicians as tech}
          <option value={tech.id} selected={tech.id === state.assignedTechnician?.id}>{tech.name}</option>
        {/each}
      </select>
      {#if state.assignLoading}
        <span class="text-sm text-slate-500">Menugaskan...</span>
      {/if}
    </div>
  {/if}
</div>
