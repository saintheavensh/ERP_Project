<script lang="ts">
  import { TicketIntakeState } from '$lib/states/tickets/ticket.intake.svelte';
  import IntakeForm from '$lib/components/tickets/IntakeForm.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new TicketIntakeState(data, data.token);
</script>

<svelte:head>
  <title>New Intake | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-4xl mx-auto">
  <div class="mb-6 flex items-center gap-4">
    <a href="/tickets" class="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Back to tickets">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
    </a>
    <h1 class="text-2xl font-bold text-slate-900">New Service Intake</h1>
  </div>

  {#if state.errorMsg}
    <div class="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
      <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <h3 class="font-medium text-sm">Error creating intake</h3>
        <p class="text-sm mt-1">{state.errorMsg}</p>
      </div>
    </div>
  {/if}

  <IntakeForm {state} />
</div>
