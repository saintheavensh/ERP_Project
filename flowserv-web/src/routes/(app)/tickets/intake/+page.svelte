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
</div>
