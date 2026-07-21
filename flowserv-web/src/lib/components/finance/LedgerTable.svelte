<script lang="ts">
  import type { LedgerState } from '$lib/states/finance/ledger.svelte';

  let { state } = $props<{ state: LedgerState }>();
</script>

{#if !state.reconcile.isClean}
  <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
    <div class="font-semibold">{state.reconcile.gaps.length} invoice(s) not fully reconciled</div>
    <div class="mt-1">
      Posted revenue doesn't match invoice totals for these invoices — likely a gap between a
      sale committing and its ledger entry posting. Re-run the backfill script or investigate.
    </div>
    <ul class="mt-2 space-y-0.5 font-mono text-xs">
      {#each state.reconcile.gaps as gap}
        <li>{gap.invoiceId}: expected {state.formatMoney(gap.expectedRevenue)}, posted {state.formatMoney(gap.postedRevenue)}</li>
      {/each}
    </ul>
  </div>
{/if}

<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  <table class="w-full text-left border-collapse">
    <thead>
      <tr class="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
        <th class="p-4 font-medium">Tanggal</th>
        <th class="p-4 font-medium">Tipe</th>
        <th class="p-4 font-medium">Referensi</th>
        <th class="p-4 font-medium text-right">Jumlah</th>
      </tr>
    </thead>
    <tbody>
      {#if state.entries.length === 0}
        <tr>
          <td colspan="4" class="p-8 text-center text-slate-500">Belum ada entri ledger.</td>
        </tr>
      {:else}
        {#each state.entries as entry}
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4 text-sm text-slate-700">{state.formatDate(entry.postedAt)}</td>
            <td class="p-4">
              <span class="inline-block px-2.5 py-1 text-xs rounded-full capitalize {state.entryTypeColor(entry.entryType)}">
                {entry.entryType}
              </span>
            </td>
            <td class="p-4 text-sm text-slate-600">
              <span class="capitalize">{entry.referenceType?.replace(/_/g, ' ') ?? '-'}</span>
              <div class="text-xs text-slate-400 font-mono">{entry.referenceId ?? ''}</div>
            </td>
            <td class="p-4 text-right font-medium {Number(entry.amount) < 0 ? 'text-red-600' : 'text-slate-900'}">
              {state.formatMoney(entry.amount)}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
