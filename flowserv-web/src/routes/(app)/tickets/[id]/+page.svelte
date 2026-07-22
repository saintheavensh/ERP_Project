<script lang="ts">
  import { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import TicketWorkspace from '$lib/components/tickets/TicketWorkspace.svelte';
  import TicketTimeline from '$lib/components/tickets/TicketTimeline.svelte';
  import TicketCustomerModals from '$lib/components/tickets/TicketCustomerModals.svelte';

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
</script>

<svelte:head>
  <title>Ticket Workspace | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-7xl mx-auto flex gap-6">
  <!-- Left Col: Ticket & Workspace -->
  <TicketWorkspace {state} />

  <!-- Right Col: Timeline -->
  <div class="w-80 space-y-6">
    <TicketTimeline {state} />
  </div>
</div>

<TicketCustomerModals {state} />
