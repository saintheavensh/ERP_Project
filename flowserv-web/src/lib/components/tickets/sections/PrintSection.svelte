<script lang="ts">
  // R2.1 — dipindahkan APA ADANYA dari TicketWorkspace.svelte (baris 249–278).
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import PrintButton from '$lib/components/print/PrintButton.svelte';

  let { state } = $props<{ state: TicketDetailState }>();

  // R2.2 — pemilik (2026-08-06): "teknisi boleh cetak label saja". Label
  // menempel di unit yang ada di mejanya dan memuat sandi/pola untuk QC, jadi
  // ia harus bisa mencetaknya ulang tanpa memanggil kasir. Nota & tanda terima
  // adalah dokumen konter.
  //
  // ⚠️ Ini kerapian, BUKAN keamanan: `GET /v1/print/documents/...` hanya
  // `requireAuth` sejak 6A.4 ("mencetak penjualanmu sendiri bukan tindakan
  // admin-printer"), jadi teknisi yang memanggil API-nya langsung tetap bisa.
  // Ditulis terbuka di `ticket-view.ts`, tidak disamarkan sebagai gerbang.
  const semuaDokumen = $derived(state.view.printableDocuments === 'semua');
</script>

<!-- Tahap A — go-live gap Tier-1 #3 (print triggers). Each button appears
     once its document is actually meaningful to print — never forced/auto-
     printed, matching how every other "Cetak" action in this app already
     works (a manual click, not a side effect of a transition). -->
{#if state.canPrintLabel || (semuaDokumen && (state.canPrintTandaTerima || state.invoice))}
  <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumen Cetak</h3>
      <!-- Tahap B — status auto-cetak saat intake baru tersimpan. Hanya
           muncul bila ada yang perlu diketahui (gagal / sedang berjalan). -->
      {#if state.autoPrintMessage}
        <span class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1" data-testid="ticket-print-status">
          {state.autoPrintMessage}
        </span>
      {/if}
    </div>
    <div class="flex flex-wrap gap-2">
      {#if state.canPrintLabel}
        <PrintButton token={state.token} documentType="label" id={state.ticket.id} label="Cetak Label" />
      {/if}
      {#if state.canPrintTandaTerima && semuaDokumen}
        <PrintButton token={state.token} documentType="tanda_terima" id={state.ticket.id} label="Cetak Tanda Terima" />
      {/if}
      {#if state.invoice && semuaDokumen}
        <PrintButton token={state.token} documentType="receipt" id={state.invoice.id} label="Cetak Struk" />
        <PrintButton token={state.token} documentType="invoice_a4" id={state.invoice.id} label="Cetak Nota (A4)" />
      {/if}
    </div>
  </div>
{/if}
