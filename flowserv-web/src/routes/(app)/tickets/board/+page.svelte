<script lang="ts">
  import { goto } from '$app/navigation';
  import { TicketBoardState } from '$lib/states/tickets/ticket.board.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const board = new TicketBoardState(data, data.token);

  // Keep in sync after invalidateAll() (a move re-runs the load) — same pattern
  // as TicketDetailState / TicketWorkspace.
  $effect(() => {
    board.data = data;
  });

  function switchTemplate(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    goto(`/tickets/board?flowTemplateId=${id}`);
  }

  function daysSince(dateStr: string) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return days <= 0 ? 'Hari ini' : `${days} hari`;
  }

  // Desktop-only progressive enhancement — native HTML5 drag-and-drop. Touch
  // devices don't fire these events at all, so tap-to-move (below) stays the
  // one interaction every viewport can rely on.
  function onDragStart(e: DragEvent, ticketId: string) {
    board.dragTicketId = ticketId;
    e.dataTransfer?.setData('text/plain', ticketId);
  }
  function onDragOverColumn(e: DragEvent, nodeId: string) {
    e.preventDefault();
    board.dragOverNodeId = nodeId;
  }
  function onDropColumn(e: DragEvent, nodeId: string) {
    e.preventDefault();
    board.dragOverNodeId = '';
    const ticketId = e.dataTransfer?.getData('text/plain') || board.dragTicketId;
    const ticket = board.tickets.find((t: any) => t.id === ticketId);
    if (!ticket || !board.canDrop(ticket, nodeId)) return; // invalid edge = silent no-op, not a failed API call
    board.move(ticketId, nodeId);
  }
</script>

<svelte:head>
  <title>Papan Servis | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-full">
  <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
    <div class="flex items-center gap-3 flex-wrap">
      <h1 class="text-2xl font-bold text-slate-900">Papan Servis</h1>
      {#if board.templates.length > 1}
        <select
          class="text-sm border-slate-300 rounded-lg py-1.5"
          value={board.selectedTemplateId}
          onchange={switchTemplate}
        >
          {#each board.templates as t}
            <option value={t.id}>{t.name}</option>
          {/each}
        </select>
      {/if}
    </div>
    <a href="/tickets" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
      &larr; Daftar Servis
    </a>
  </div>

  {#if board.errorMsg}
    <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
      {board.errorMsg}
    </div>
  {/if}

  {#if board.columns.length === 0}
    <div class="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
      Tidak ada alur servis yang tersedia.
    </div>
  {:else}
    <!-- Mobile-first: horizontal column scroll (per specification/08-ui-ux.md #3),
         not shrinking columns to unreadable width. -->
    <div class="flex gap-4 overflow-x-auto pb-4">
      {#each board.columns as col (col.node.id)}
        <div
          class="w-72 shrink-0 bg-slate-100 rounded-xl border border-slate-200 flex flex-col {board.dragOverNodeId === col.node.id ? 'ring-2 ring-blue-400' : ''}"
          ondragover={(e) => onDragOverColumn(e, col.node.id)}
          ondragleave={() => (board.dragOverNodeId = '')}
          ondrop={(e) => onDropColumn(e, col.node.id)}
          role="list"
        >
          <div class="px-3 py-2.5 flex items-center justify-between border-b border-slate-200">
            <span class="font-semibold text-slate-800 text-sm">{col.node.name}</span>
            <span class="text-xs font-medium bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
              {col.tickets.length}
            </span>
          </div>

          <div class="p-2 space-y-2 max-h-[65vh] overflow-y-auto">
            {#each col.tickets as ticket (ticket.id)}
              {@const targets = board.targetsFor(ticket)}
              <div
                class="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                draggable="true"
                ondragstart={(e) => onDragStart(e, ticket.id)}
                role="listitem"
              >
                <button
                  type="button"
                  class="w-full text-left p-3"
                  onclick={() => board.toggleMovePanel(ticket.id)}
                  aria-expanded={board.activeTicketId === ticket.id}
                >
                  <div class="font-medium text-slate-900 text-sm leading-tight">{ticket.customerName}</div>
                  <div class="text-slate-500 text-xs mt-0.5">{ticket.assetType} - {ticket.brand || ''} {ticket.model || ''}</div>
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-[11px] text-slate-400">{daysSince(ticket.createdAt)}</span>
                    {#if ticket.assignedTechnicianName}
                      <span class="text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5">
                        {ticket.assignedTechnicianName}
                      </span>
                    {/if}
                  </div>
                </button>

                {#if board.activeTicketId === ticket.id}
                  <div class="border-t border-slate-100 p-2 space-y-1.5 bg-slate-50 rounded-b-lg">
                    {#if targets.length === 0}
                      <p class="text-xs text-slate-400 px-1 py-1">Tidak ada langkah lanjutan.</p>
                    {:else}
                      {#each targets as target}
                        <button
                          type="button"
                          disabled={board.moving}
                          class="w-full text-left text-xs font-medium px-2 py-1.5 bg-white border border-slate-200 rounded-md hover:border-blue-400 hover:text-blue-700 transition-colors disabled:opacity-50"
                          onclick={() => board.move(ticket.id, target.targetNodeId)}
                        >
                          &rarr; {target.targetNodeName}
                        </button>
                      {/each}
                    {/if}
                    <a href={`/tickets/${ticket.id}`} class="block text-center text-xs text-blue-600 hover:text-blue-800 pt-1">
                      Detail &rarr;
                    </a>
                  </div>
                {/if}
              </div>
            {:else}
              <p class="text-xs text-slate-400 text-center py-6">Kosong</p>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
