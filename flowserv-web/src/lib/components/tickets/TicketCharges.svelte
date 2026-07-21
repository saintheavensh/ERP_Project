<script lang="ts">
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';

  let { state } = $props<{ state: TicketDetailState }>();

  const idr = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
      .format(typeof n === 'string' ? parseFloat(n) : n);

  const lineTotal = (c: any) => c.quantity * parseFloat(c.unitPrice);

  const statusBadge: Record<string, string> = {
    estimated: 'bg-slate-100 text-slate-600',
    approved: 'bg-blue-100 text-blue-700',
    consumed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600'
  };

  const sourceBadge: Record<string, string> = {
    part: 'bg-indigo-50 text-indigo-600',
    labor: 'bg-amber-50 text-amber-600',
    fee: 'bg-purple-50 text-purple-600'
  };

  // When a part is picked, pre-fill the price from its selling price so the technician
  // sees and can still edit it (the backend would default it anyway).
  function onItemSelected() {
    const item = state.inventoryItems.find((i: any) => i.id === state.chargeForm.inventoryItemId);
    if (item) state.chargeForm.unitPrice = String(parseFloat(item.sellingPrice));
  }

  const hasEstimated = $derived(state.charges.some((c: any) => c.status === 'estimated'));
</script>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
  <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
    <h2 class="font-semibold text-slate-800">Biaya &amp; Estimasi</h2>
    <div class="text-right text-sm">
      <span class="text-slate-500">Estimasi: </span>
      <span class="font-bold text-slate-900">{idr(state.chargeTotals.estimated)}</span>
      {#if state.chargeTotals.approved > 0}
        <span class="text-slate-300 mx-1">|</span>
        <span class="text-slate-500">Disetujui: </span>
        <span class="font-bold text-blue-700">{idr(state.chargeTotals.approved)}</span>
      {/if}
    </div>
  </div>

  <div class="p-6 space-y-5">
    <!-- Charge list -->
    {#if state.charges.length === 0}
      <p class="text-center text-slate-400 py-4 text-sm">Belum ada biaya. Tambahkan sparepart atau jasa di bawah.</p>
    {:else}
      <ul class="divide-y divide-slate-100">
        {#each state.charges as c (c.id)}
          <li class="py-3 flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium px-2 py-0.5 rounded uppercase {sourceBadge[c.sourceType] || 'bg-slate-50 text-slate-500'}">{c.sourceType}</span>
                <span class="font-medium text-slate-800 truncate">{c.description}</span>
                <span class="text-xs px-2 py-0.5 rounded {statusBadge[c.status] || ''}">{c.status}</span>
              </div>
              <p class="text-sm text-slate-500 mt-0.5">{c.quantity} × {idr(c.unitPrice)}</p>
            </div>
            <div class="font-semibold text-slate-900 whitespace-nowrap">{idr(lineTotal(c))}</div>
            {#if c.status === 'estimated'}
              <button onclick={() => state.deleteCharge(c.id)} disabled={state.chargeLoading}
                class="text-slate-400 hover:text-red-600 disabled:opacity-40 p-1" title="Hapus biaya" aria-label="Hapus biaya">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            {:else}
              <span class="w-7"></span>
            {/if}
          </li>
        {/each}
      </ul>

      <!-- Margin summary -->
      <div class="flex justify-end gap-6 text-sm border-t border-slate-100 pt-3 text-slate-500">
        <span>Pendapatan: <span class="font-medium text-slate-700">{idr(state.chargeMargin.revenue)}</span></span>
        <span>Modal: <span class="font-medium text-slate-700">{idr(state.chargeMargin.cost)}</span></span>
        <span>Margin: <span class="font-semibold {state.chargeMargin.margin >= 0 ? 'text-green-700' : 'text-red-600'}">{idr(state.chargeMargin.margin)}</span></span>
      </div>
    {/if}

    <!-- Add charge form -->
    {#if state.ticket?.status !== 'closed' && state.ticket?.status !== 'cancelled'}
      <div class="bg-slate-50 rounded-lg p-4 space-y-3">
        <div class="flex gap-2">
          {#each ['part', 'labor', 'fee'] as t}
            <button onclick={() => { state.chargeForm.sourceType = t as any; state.resetChargeForm(); state.chargeForm.sourceType = t as any; }}
              class="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors {state.chargeForm.sourceType === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}">
              {t === 'part' ? 'Sparepart' : t === 'labor' ? 'Jasa' : 'Biaya Lain'}
            </button>
          {/each}
        </div>

        <div class="grid grid-cols-12 gap-2">
          {#if state.chargeForm.sourceType === 'part'}
            <select bind:value={state.chargeForm.inventoryItemId} onchange={onItemSelected}
              class="col-span-6 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm">
              <option value="">-- Pilih Sparepart --</option>
              {#each state.inventoryItems as item}
                <option value={item.id}>{item.name} ({idr(item.sellingPrice)})</option>
              {/each}
            </select>
          {:else}
            <input bind:value={state.chargeForm.description} placeholder={state.chargeForm.sourceType === 'labor' ? 'Deskripsi jasa' : 'Deskripsi biaya'}
              class="col-span-6 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          {/if}
          <input type="number" min="1" bind:value={state.chargeForm.quantity} placeholder="Qty"
            class="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <input type="number" min="0" bind:value={state.chargeForm.unitPrice} placeholder="Harga satuan"
            class="col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>

        <div class="flex justify-end">
          <button onclick={() => state.addCharge()} disabled={state.chargeLoading}
            class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            + Tambah Biaya
          </button>
        </div>
      </div>

      <!-- Request approval -->
      <div class="flex items-center justify-between pt-1">
        <p class="text-xs text-slate-500">
          {#if state.isQuoted}
            Quote sudah dikirim untuk persetujuan pelanggan.
          {:else}
            Bekukan estimasi menjadi quote untuk disetujui pelanggan.
          {/if}
        </p>
        <button onclick={() => state.requestApproval()} disabled={state.chargeLoading || !hasEstimated}
          class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40">
          Minta Persetujuan
        </button>
      </div>
    {/if}
  </div>
</div>
