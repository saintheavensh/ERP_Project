<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  
  let ticketData = $derived(data.data);
  let template = $derived(data.template);
  
  let ticket = $derived(ticketData?.ticket);
  let customer = $derived(ticketData?.customer);
  let asset = $derived(ticketData?.asset);
  let history = $derived(ticketData?.history || []);
  let currentNode = $derived(ticketData?.node);
  
  // Find valid next transitions
  let availableTransitions = $derived.by(() => {
    if (!template || !currentNode) return [];
    return template.transitions
      .filter((t: any) => t.fromNodeId === currentNode.id)
      .map((t: any) => {
        const target = template.nodes.find((n: any) => n.id === t.toNodeId);
        return { ...t, targetNodeName: target?.name || 'Unknown' };
      });
  });

  // State
  let loading = $state(false);
  let errorMsg = $state('');

  // Transition form
  let selectedTransition = $state('');
  let transitionNotes = $state('');

  async function executeTransition() {
    if (!selectedTransition) return;
    loading = true;
    errorMsg = '';
    
    try {
      const res = await fetch(`http://localhost:3001/v1/tickets/${ticket.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({
          targetNodeId: selectedTransition,
          notes: transitionNotes
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        selectedTransition = '';
        transitionNotes = '';
        await invalidateAll();
      } else {
        errorMsg = result.error?.message || 'Transition failed. You might not have the required role.';
      }
    } catch (e) {
      errorMsg = 'Network error';
    } finally {
      loading = false;
    }
  }

  // Customer Edit
  let showEditWarning = $state(false);
  let showEditForm = $state(false);
  let editCustomerData = $state({ name: '', phone: '', email: '' });

  function openEditCustomer() {
    editCustomerData = { name: customer.name, phone: customer.phone || '', email: customer.email || '' };
    showEditWarning = true;
  }
  
  function proceedToEdit() {
    showEditWarning = false;
    showEditForm = true;
  }

  async function saveCustomer() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`http://localhost:3001/v1/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(editCustomerData)
      });
      
      const result = await res.json();
      if (res.ok) {
        showEditForm = false;
        await invalidateAll();
      } else {
        errorMsg = result.error?.message || 'Failed to update customer';
      }
    } catch (e) {
      errorMsg = 'Network error';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Ticket Workspace | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-7xl mx-auto flex gap-6">
  <!-- Left Col: Ticket & Workspace -->
  <div class="flex-1 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/tickets" class="text-slate-500 hover:text-slate-800" aria-label="Back to tickets">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </a>
        <h1 class="text-2xl font-bold text-slate-900">Workspace</h1>
      </div>
      <div class="px-3 py-1 bg-slate-800 text-white text-sm font-medium rounded-full">
        {ticket?.status.toUpperCase()}
      </div>
    </div>

    <!-- Error Banner -->
    {#if errorMsg}
      <div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
        <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>{errorMsg}</span>
      </div>
    {/if}

    <!-- Customer & Device Overview -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Customer Box -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
        <button onclick={openEditCustomer} class="absolute top-4 right-4 text-slate-400 hover:text-blue-600 transition-colors" title="Edit Customer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </button>
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer</h3>
        <p class="font-bold text-lg text-slate-900">{customer?.name}</p>
        <p class="text-slate-600 text-sm mt-1">📞 {customer?.phone || 'No Phone'}</p>
        <p class="text-slate-600 text-sm">✉️ {customer?.email || 'No Email'}</p>
      </div>
      <!-- Device Box -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Device Info</h3>
        <p class="font-bold text-lg text-slate-900">
          <span class="text-blue-600">{asset?.assetType}</span> {asset?.brand || ''} {asset?.model || ''}
        </p>
        <p class="text-slate-600 text-sm mt-1 font-mono">SN: {asset?.serialNumber || 'N/A'}</p>
      </div>
    </div>

    <!-- Action Forms (Phase 3 Hardcoded dynamic forms) -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h2 class="font-semibold text-slate-800">Current Stage: <span class="text-blue-600">{currentNode?.name}</span></h2>
        <p class="text-xs text-slate-500 mt-1">{currentNode?.description}</p>
      </div>
      
      <div class="p-6">
        {#if ticket?.status === 'closed' || ticket?.status === 'cancelled'}
          <div class="text-center text-slate-500 py-8">
            This ticket is already closed. No further actions can be taken.
          </div>
        {:else if availableTransitions.length === 0}
          <div class="text-center text-slate-500 py-8">
            This is the final stage. No further transitions available.
          </div>
        {:else}
          <!-- Form Panel -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="next">Select Next Step / Decision</label>
              <select id="next" bind:value={selectedTransition} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">-- Select Action --</option>
                {#each availableTransitions as t}
                  <option value={t.toNodeId}>{t.name} &rarr; {t.targetNodeName}</option>
                {/each}
              </select>
            </div>
            
            {#if selectedTransition}
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="notes">Action Notes</label>
                <textarea id="notes" bind:value={transitionNotes} rows="3" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Required parts, diagnosis result, or reason..."></textarea>
              </div>
              
              <div class="flex justify-end pt-2">
                <button 
                  onclick={executeTransition}
                  disabled={loading}
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center">
                  {#if loading} Processing... {:else} Execute {/if}
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Right Col: Timeline -->
  <div class="w-80 space-y-6">
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 class="font-bold text-slate-900 mb-6 flex items-center">
        <svg class="w-5 h-5 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Stage History
      </h2>
      
      <div class="relative border-l-2 border-slate-200 ml-3 space-y-8">
        {#each history as h, i}
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
  </div>
</div>

<!-- Warning Modal -->
{#if showEditWarning}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
      <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Edit Master Data?</h2>
      <p class="text-slate-600 mb-6">
        Perhatian: Anda akan mengubah data induk (Master Data) milik pelanggan ini. 
        Perubahan ini akan berdampak pada <strong>seluruh riwayat servis lama</strong> milik pelanggan. Pastikan data yang dimasukkan akurat.
      </p>
      <div class="flex justify-center gap-3">
        <button onclick={() => showEditWarning = false} class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">Batal</button>
        <button onclick={proceedToEdit} class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors">Ya, Saya Mengerti</button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Form Modal -->
{#if showEditForm}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-bold mb-4 text-slate-900">Edit Customer Info</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Name *</label>
          <input id="name" type="text" bind:value={editCustomerData.name} class="w-full px-4 py-2 border border-slate-200 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="phone">Phone (Optional)</label>
          <input id="phone" type="text" bind:value={editCustomerData.phone} class="w-full px-4 py-2 border border-slate-200 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email (Optional)</label>
          <input id="email" type="email" bind:value={editCustomerData.email} class="w-full px-4 py-2 border border-slate-200 rounded-lg">
        </div>
      </div>
      
      <div class="mt-6 flex justify-end gap-3">
        <button onclick={() => showEditForm = false} class="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
        <button onclick={saveCustomer} disabled={loading || !editCustomerData.name} class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Save Changes</button>
      </div>
    </div>
  </div>
{/if}
