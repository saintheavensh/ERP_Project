<script lang="ts">
  // P10.3 — supplier price comparison (SUP-009). Read-only: productSuppliers.lastPrice
  // is the supplier's most recent quoted price, kept in sync with stock_batches by the
  // seed/purchasing flow, but this view doesn't write to it — that stays PO-driven.
  let { item } = $props<{ item: any }>();

  let rows = $derived(
    [...(item.productSuppliers || [])].sort((a: any, b: any) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return parseFloat(a.lastPrice || 0) - parseFloat(b.lastPrice || 0);
    })
  );
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5" data-testid="supplier-comparison">
  <div class="flex justify-between items-center mb-4">
    <h3 class="font-bold text-slate-900 text-lg">Perbandingan Harga Supplier</h3>
  </div>

  {#if rows.length > 0}
    <div class="overflow-x-auto">
      <table class="w-full min-w-[420px] text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
            <th class="p-3">Supplier</th>
            <th class="p-3">Harga Terakhir</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each rows as row (row.id)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-3">
                <a href="/inventory/suppliers/{row.supplier?.id}" class="font-medium text-blue-600 hover:underline">
                  {row.supplier?.name || 'Supplier'}
                </a>
              </td>
              <td class="p-3 font-semibold text-slate-900">
                Rp {parseFloat(row.lastPrice || 0).toLocaleString('id-ID')}
              </td>
              <td class="p-3 text-right">
                {#if row.isPrimary}
                  <span class="text-[11px] font-medium px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-100">
                    Utama
                  </span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
      <p class="text-sm text-slate-500">Belum ada data supplier untuk produk ini.</p>
    </div>
  {/if}
</div>
