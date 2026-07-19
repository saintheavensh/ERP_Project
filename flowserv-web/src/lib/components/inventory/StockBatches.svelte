<script lang="ts">
  let { batches } = $props<{ batches: any[] }>();
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
  <h3 class="font-bold text-slate-900 mb-4">Batch Stok Aktif (FIFO)</h3>
  {#if batches && batches.length > 0}
    <div class="space-y-3">
      {#each batches as batch}
        <div class="p-3 border border-slate-100 rounded-lg bg-slate-50">
          <div class="flex justify-between items-center mb-1">
            <span class="font-semibold text-slate-900">{batch.quantityRemaining} <span class="text-xs font-normal">tersedia</span></span>
            <span class="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {batch.partBrand?.name || 'Tanpa Merk'}
            </span>
          </div>
          <div class="text-xs text-slate-500">
            HPP: Rp {parseFloat(batch.unitCost).toLocaleString('id-ID')}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-sm text-slate-500 italic">Tidak ada stok tersisa.</p>
  {/if}
</div>
