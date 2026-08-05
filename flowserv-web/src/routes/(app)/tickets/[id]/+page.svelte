<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import { autoRefresh } from '$lib/utils/auto-refresh';
  import TicketWorkspace from '$lib/components/tickets/TicketWorkspace.svelte';
  import TicketTimeline from '$lib/components/tickets/TicketTimeline.svelte';
  import TicketCustomerModals from '$lib/components/tickets/TicketCustomerModals.svelte';
  import TicketCancelModal from '$lib/components/tickets/TicketCancelModal.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new TicketDetailState(data, data.token);

  // Keep the state's data in sync with the page's data. invalidateAll() after an
  // action (transition, consume charge, generate invoice) re-runs the load and
  // swaps `data`; without this the workspace would keep rendering the pre-action
  // state until a full page reload.
  $effect(() => {
    state.data = data;
  });

  // R1.11-T3 — halaman ini dibaca kasir DAN teknisi pada saat yang sama, jadi
  // ia yang paling sering basi (keluhan pemilik di uji-R1.10 A6). Penyegaran
  // ditunda selama ada pekerjaan pemakai yang belum tersimpan — daftarnya di
  // `sedangSibuk`, dan itu yang menjaga tulisan tidak terhapus diam-diam.
  autoRefresh({ busy: () => state.sedangSibuk });

  // Tahap B — intake baru tersimpan: cetak Label + Tanda Terima otomatis.
  // Dipicu lewat query param dari form intake (bukan "tiket ini masih baru"),
  // supaya membuka kembali tiket lama tidak ikut mencetak ulang. Param langsung
  // dibersihkan dari URL — kalau tertinggal, refresh halaman akan mencetak lagi.
  onMount(() => {
    if (page.url.searchParams.get('autoprint') !== 'intake') return;
    const cleanUrl = new URL(page.url);
    cleanUrl.searchParams.delete('autoprint');
    replaceState(cleanUrl.pathname + cleanUrl.search, page.state);
    void state.autoPrintIntakeDocuments();
  });
</script>

<svelte:head>
  <title>Ticket Workspace | FlowServ</title>
</svelte:head>

<!-- P4 — this page had zero responsive classes (untouched by P1.5's shell +
     worst-offender pass). Stacks below lg (workspace above timeline), unchanged
     side-by-side fixed-w-80 layout from lg up. -->
<div class="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
  <!-- Workspace -->
  <div class="min-w-0 flex-1">
    <TicketWorkspace {state} />
  </div>

  <!-- Timeline -->
  <div class="lg:w-80 lg:shrink-0 space-y-6">
    <TicketTimeline {state} />
  </div>
</div>

<TicketCustomerModals {state} />
<TicketCancelModal {state} />
