<script lang="ts">
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import TicketCharges from './TicketCharges.svelte';
  import PrintButton from '$lib/components/print/PrintButton.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<div class="flex-1 space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-4">
      <a href="/tickets" class="text-slate-500 hover:text-slate-800" aria-label="Back to tickets">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </a>
      <h1 class="text-2xl font-bold text-slate-900">Workspace</h1>
    </div>
    <div class="flex items-center gap-3">
      {#if state.canCancel}
        <button
          onclick={() => state.openCancelModal()}
          class="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-full border border-red-200 hover:bg-red-50 transition-colors"
        >
          Batalkan Tiket
        </button>
      {/if}
      <div class="px-3 py-1 bg-slate-800 text-white text-sm font-medium rounded-full">
        {state.ticket?.status.toUpperCase()}
      </div>
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
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <!-- Tahap A — katalog device (gambar/spesifikasi). Cuma tampil kalau asset
           ini match ke entri katalog (deviceModelId terisi saat intake). -->
      {#if state.deviceModel}
        <div class="mt-3 pt-3 border-t border-slate-100 flex gap-3" data-testid="device-catalog-card">
          {#if state.deviceModel.imageUrl}
            <img src={state.deviceModel.imageUrl} alt="" class="w-16 h-16 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
          {/if}
          {#if state.deviceModel.specs && Object.keys(state.deviceModel.specs).length > 0}
            <dl class="text-xs grid grid-cols-2 gap-x-3 gap-y-0.5 content-start">
              {#each Object.entries(state.deviceModel.specs) as [key, value]}
                <div class="contents">
                  <dt class="text-slate-400">{key}</dt>
                  <dd class="text-slate-700">{value}</dd>
                </div>
              {/each}
            </dl>
          {/if}
        </div>
      {/if}

      <!-- Tahap A — go-live gap Tier-1 #2. Sandi/pola: dicatat di intake,
           dikembalikan ke pelanggan saat serah-terima (QC Akhir). -->
      <div class="mt-3 pt-3 border-t border-slate-100">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sandi / Pola</span>
          {#if !state.passcodeEditing}
            <button onclick={() => state.openPasscodeEdit()} class="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
          {/if}
        </div>
        {#if state.passcodeEditing}
          <div class="mt-1 flex items-center gap-2">
            <input
              type="text"
              bind:value={state.passcodeDraft}
              placeholder="mis. 1234 atau pola L-terbalik"
              class="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
            <button onclick={() => state.savePasscode()} disabled={state.passcodeLoading} class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2 py-1 rounded-lg">
              {state.passcodeLoading ? '...' : 'Simpan'}
            </button>
            <button onclick={() => state.passcodeEditing = false} class="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1">Batal</button>
          </div>
        {:else}
          <p class="text-sm font-mono text-slate-900 mt-1">{state.ticket?.devicePasscode || '-'}</p>
        {/if}
      </div>

      <!-- Tahap A — go-live gap Tier-1 #3. Keluhan/kerusakan: feeds the
           label/tanda-terima print documents. -->
      <div class="mt-3 pt-3 border-t border-slate-100">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keluhan / Kerusakan</span>
          {#if !state.complaintEditing}
            <button onclick={() => state.openComplaintEdit()} class="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
          {/if}
        </div>
        {#if state.complaintEditing}
          <div class="mt-1 flex items-start gap-2">
            <textarea
              bind:value={state.complaintDraft}
              rows="2"
              placeholder="mis. LCD retak, tidak bisa charge"
              class="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <div class="flex flex-col gap-1">
              <button onclick={() => state.saveComplaint()} disabled={state.complaintLoading} class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2 py-1 rounded-lg">
                {state.complaintLoading ? '...' : 'Simpan'}
              </button>
              <button onclick={() => state.complaintEditing = false} class="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1">Batal</button>
            </div>
          </div>
        {:else}
          <p class="text-sm text-slate-900 mt-1">{state.ticket?.reportedComplaint || '-'}</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Tahap A — go-live gap Tier-1 #3 (print triggers). Each button appears
       once its document is actually meaningful to print — never forced/auto-
       printed, matching how every other "Cetak" action in this app already
       works (a manual click, not a side effect of a transition). -->
  {#if state.canPrintLabel || state.hasEnteredUnitDisimpan || state.invoice}
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dokumen Cetak</h3>
      <div class="flex flex-wrap gap-2">
        {#if state.canPrintLabel}
          <PrintButton token={state.token} documentType="label" id={state.ticket.id} label="Cetak Label" />
        {/if}
        {#if state.hasEnteredUnitDisimpan}
          <PrintButton token={state.token} documentType="tanda_terima" id={state.ticket.id} label="Cetak Tanda Terima" />
        {/if}
        {#if state.invoice}
          <PrintButton token={state.token} documentType="receipt" id={state.invoice.id} label="Cetak Struk" />
          <PrintButton token={state.token} documentType="invoice_a4" id={state.invoice.id} label="Cetak Nota (A4)" />
        {/if}
      </div>
    </div>
  {/if}

  <!-- F1 — Technician assignment (wires H8's previously-orphaned POST /:id/assign) -->
  <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
    <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assigned Technician</h3>
    {#if state.ticket?.status === 'closed' || state.ticket?.status === 'cancelled'}
      <p class="font-bold text-lg text-slate-900">{state.assignedTechnician?.name || 'Belum ditugaskan'}</p>
    {:else}
      <div class="flex items-center gap-3">
        <select
          value={state.assignedTechnician?.id || ''}
          onchange={(e) => state.assign(e.currentTarget.value)}
          disabled={state.assignLoading}
          class="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
        >
          <option value="" disabled selected={!state.assignedTechnician}>-- Pilih Teknisi --</option>
          {#each state.technicians as tech}
            <option value={tech.id} selected={tech.id === state.assignedTechnician?.id}>{tech.name}</option>
          {/each}
        </select>
        {#if state.assignLoading}
          <span class="text-sm text-slate-500">Menugaskan...</span>
        {/if}
      </div>
    {/if}
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
