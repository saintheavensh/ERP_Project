<script lang="ts">
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
  <h2 class="font-bold text-slate-900 mb-6 flex items-center">
    <svg class="w-5 h-5 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    Stage History
  </h2>
  
  <div class="relative border-l-2 border-slate-200 ml-3 space-y-8">
    {#each state.history as h, i}
      <div class="relative pl-6">
        <!-- Timeline dot -->
        <div class={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${i === 0 ? 'bg-blue-600 border-blue-200' : 'bg-slate-300 border-white'}`}></div>
        
        <div class="font-medium text-slate-900 text-sm">{h.nodeName}</div>
        <div class="text-xs text-slate-500 mt-1">{new Date(h.enteredAt).toLocaleString()}</div>
        {#if h.notes}
          <div class="mt-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
            "{h.notes}"
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
