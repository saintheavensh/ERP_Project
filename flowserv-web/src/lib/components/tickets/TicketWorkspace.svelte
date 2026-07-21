<script lang="ts">
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import TicketCharges from './TicketCharges.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<div class="flex-1 space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/tickets" class="text-slate-500 hover:text-slate-800" aria-label="Back to tickets">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </a>
      <h1 class="text-2xl font-bold text-slate-900">Workspace</h1>
    </div>
    <div class="px-3 py-1 bg-slate-800 text-white text-sm font-medium rounded-full">
      {state.ticket?.status.toUpperCase()}
    </div>
  </div>

  <!-- Error Banner -->
  {#if state.errorMsg}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
      <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span>{state.errorMsg}</span>
    </div>
  {/if}

  <!-- Customer & Device Overview -->
  <div class="grid grid-cols-2 gap-4">
    <!-- Customer Box -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
      <button onclick={() => state.openEditCustomer()} class="absolute top-4 right-4 text-slate-400 hover:text-blue-600 transition-colors" title="Edit Customer">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
      </button>
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer</h3>
      <p class="font-bold text-lg text-slate-900">{state.customer?.name}</p>
      <p class="text-slate-600 text-sm mt-1">📞 {state.customer?.phone || 'No Phone'}</p>
      <p class="text-slate-600 text-sm">✉️ {state.customer?.email || 'No Email'}</p>
    </div>
    <!-- Device Box -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Device Info</h3>
      <p class="font-bold text-lg text-slate-900">
        <span class="text-blue-600">{state.asset?.assetType}</span> {state.asset?.brand || ''} {state.asset?.model || ''}
      </p>
      <p class="text-slate-600 text-sm mt-1 font-mono">SN: {state.asset?.serialNumber || 'N/A'}</p>
    </div>
  </div>

  <!-- H7 — Charges (parts / labor / fees), running total, request approval -->
  <TicketCharges {state} />

  <!-- Action Forms (Phase 3 Hardcoded dynamic forms) -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
      <h2 class="font-semibold text-slate-800">Current Stage: <span class="text-blue-600">{state.currentNode?.name}</span></h2>
      <p class="text-xs text-slate-500 mt-1">{state.currentNode?.description}</p>
    </div>
    
    <div class="p-6">
      {#if state.ticket?.status === 'closed' || state.ticket?.status === 'cancelled'}
        <div class="text-center text-slate-500 py-8">
          This ticket is already closed. No further actions can be taken.
        </div>
      {:else if state.availableTransitions.length === 0}
        <div class="text-center text-slate-500 py-8">
          This is the final stage. No further transitions available.
        </div>
      {:else}
        <!-- Form Panel -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="next">Select Next Step / Decision</label>
            <select id="next" value={state.selectedTransition} onchange={(e) => state.selectTransition(e.currentTarget.value)} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">-- Select Action --</option>
              {#each state.availableTransitions as t}
                <option value={t.toNodeId}>{t.name} &rarr; {t.targetNodeName}</option>
              {/each}
            </select>
          </div>
          
          {#if state.selectedTransition}
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="notes">Action Notes</label>
              <textarea id="notes" bind:value={state.transitionNotes} rows="3" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Required parts, diagnosis result, or reason..."></textarea>
            </div>
            
            <div class="flex justify-end pt-2">
              <button 
                onclick={() => state.executeTransition()}
                disabled={state.loading}
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center">
                {#if state.loading} Processing... {:else} Execute {/if}
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
