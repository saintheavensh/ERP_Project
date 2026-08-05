<script lang="ts">
  // R2.1 — dipindahkan APA ADANYA dari TicketWorkspace.svelte (baris 380–410).
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import TicketCharges from '../TicketCharges.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<!-- H7 — Charges (parts / labor / fees), running total, request approval.
     Tahap B — dikunci sampai tiket melewati node persetujuan: sebelum
     didiagnosis & disetujui pelanggan, memilih sparepart hanya menebak
     (keputusan pemilik 2026-07-27). Ditampilkan sebagai kartu terkunci,
     bukan disembunyikan, supaya teknisi tahu bagian ini ada dan kapan
     terbuka — bukan mengira fiturnya hilang. -->
{#if state.chargesUnlocked}
  <TicketCharges {state} />
{:else}
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-testid="charges-locked">
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
      </svg>
      <div>
        <h2 class="font-semibold text-slate-800">Sparepart &amp; Biaya</h2>
        <p class="text-sm text-slate-500 mt-1">
          {#if state.firstChargeNodeName}
            Terbuka mulai tahap <b class="text-slate-700">{state.firstChargeNodeName}</b>.
          {:else}
            Belum ada tahap yang mengizinkan input biaya di alur ini.
          {/if}
          Unit didiagnosis dulu, baru sparepart dan jasanya dicatat.
          <span class="block mt-1 text-xs text-slate-400">
            Aturan ini mengikuti template alur servis — bisa diubah di pengaturan alur.
          </span>
        </p>
      </div>
    </div>
  </div>
{/if}
