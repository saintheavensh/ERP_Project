<script lang="ts">
  import { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import TicketWorkspace from '$lib/components/tickets/TicketWorkspace.svelte';
  import TicketTimeline from '$lib/components/tickets/TicketTimeline.svelte';
  import TicketCustomerModals from '$lib/components/tickets/TicketCustomerModals.svelte';

  let { data } = $props();
  
  // svelte-ignore state_referenced_locally
  const state = new TicketDetailState(data, data.token);
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
