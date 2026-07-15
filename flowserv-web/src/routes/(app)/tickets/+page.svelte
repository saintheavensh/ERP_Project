<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props();
  let tickets = $derived(data.tickets);
</script>

<svelte:head>
  <title>Service Tickets | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-slate-900">Service Tickets</h1>
    <a href="/tickets/intake"
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      New Intake
    </a>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <table class="w-full text-left text-sm">
      <thead class="bg-slate-50 text-slate-500 border-b border-gray-200">
        <tr>
          <th class="px-6 py-4 font-medium">Customer & Device</th>
          <th class="px-6 py-4 font-medium">Service Type</th>
          <th class="px-6 py-4 font-medium">Current Stage</th>
          <th class="px-6 py-4 font-medium">Status</th>
          <th class="px-6 py-4 font-medium">Date</th>
          <th class="px-6 py-4 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each tickets as ticket}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4">
              <div class="font-medium text-slate-900">{ticket.customerName}</div>
              <div class="text-slate-500 text-xs mt-0.5">{ticket.assetType} - {ticket.brand || ''} {ticket.model || ''}</div>
            </td>
            <td class="px-6 py-4 text-slate-700">{ticket.flowTemplateName}</td>
            <td class="px-6 py-4">
              <span class="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium text-xs">
                {ticket.nodeName || 'No Stage'}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class={`inline-block px-2.5 py-1 rounded text-xs font-medium capitalize ${
                ticket.status === 'open' ? 'bg-green-50 text-green-700 border border-green-200' :
                ticket.status === 'closed' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {ticket.status}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-500">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 text-right">
              <a href={`/tickets/${ticket.id}`} class="text-blue-600 hover:text-blue-800 font-medium">
                Workspace &rarr;
              </a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-slate-500">
              <svg class="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
              <div class="text-lg font-medium text-slate-900 mb-1">No tickets found</div>
              <p>Click "New Intake" to create your first service ticket.</p>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
