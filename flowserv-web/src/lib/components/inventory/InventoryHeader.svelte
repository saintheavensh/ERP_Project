<script lang="ts">
  let { item } = $props<{ item: any }>();
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
  <h3 class="font-bold text-slate-900 mb-4">Informasi Produk</h3>
  <dl class="space-y-3 text-sm">
    <div>
      <dt class="text-slate-500">Kode Universal</dt>
      <dd class="font-medium text-slate-900">{item.universalCode || '-'}</dd>
    </div>
    <div>
      <dt class="text-slate-500">Harga Jual Dasar</dt>
      <dd class="font-medium text-slate-900">Rp {parseFloat(item.sellingPrice || '0').toLocaleString('id-ID')}</dd>
    </div>
    <div>
      <dt class="text-slate-500">Unit Satuan</dt>
      <dd class="font-medium text-slate-900">{item.unitOfMeasure}</dd>
    </div>
    <div>
      <dt class="text-slate-500">Batas Reorder</dt>
      <dd class="font-medium text-slate-900">{item.reorderPoint}</dd>
    </div>
    <div>
      <dt class="text-slate-500">Strategi Margin</dt>
      <dd class="font-medium text-slate-900">
        {#if item.marginStrategy === 'markup'}
          Markup {item.targetMargin != null ? `(${Number(item.targetMargin)}%)` : ''}
        {:else if item.marginStrategy === 'gross_margin'}
          Gross Margin {item.targetMargin != null ? `(${Number(item.targetMargin)}%)` : ''}
        {:else}
          <span class="text-slate-400">Ikuti kategori / default</span>
        {/if}
      </dd>
    </div>
    <div>
      <dt class="text-slate-500">Status Inisialisasi</dt>
      <dd class="font-medium">
        {#if item.isStockInitialized}
          <span class="text-green-600">Sudah Diinisialisasi</span>
        {:else}
          <span class="text-amber-600">Belum Diinisialisasi</span>
        {/if}
      </dd>
    </div>
    <div>
      <dt class="text-slate-500">Status Kompatibilitas</dt>
      <dd class="font-medium">
        {#if item.unresolvedCompatibility && item.unresolvedCompatibility.length > 0}
          <span class="text-amber-600 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Perlu Perhatian
          </span>
        {:else if item.compatibility && item.compatibility.length > 0}
          <span class="text-green-600 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Terhubung Sempurna
          </span>
        {:else}
          <span class="text-slate-500">Belum Ada Model</span>
        {/if}
      </dd>
    </div>
  </dl>
</div>
