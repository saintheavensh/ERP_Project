<script lang="ts">
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

{#if state.showCancelModal}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2 text-center">Batalkan Tiket?</h2>
      <p class="text-slate-600 mb-4 text-center text-sm">
        Semua sparepart yang sudah direservasi (disetujui tapi belum dipasang) akan dilepas
        kembali ke stok. Sparepart yang sudah dipasang tidak otomatis dikembalikan.
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="cancel-reason">Alasan Pembatalan *</label>
        <textarea
          id="cancel-reason"
          bind:value={state.cancelReason}
          rows="3"
          class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Contoh: Customer tidak jadi servis, barang diambil kembali..."
        ></textarea>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button onclick={() => state.showCancelModal = false} disabled={state.cancelLoading} class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50">
          Batal
        </button>
        <button
          onclick={() => state.confirmCancelTicket()}
          disabled={state.cancelLoading || !state.cancelReason.trim()}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {#if state.cancelLoading} Membatalkan... {:else} Ya, Batalkan Tiket {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
