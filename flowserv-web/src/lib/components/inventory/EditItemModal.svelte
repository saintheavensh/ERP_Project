<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  type MarginStrategy = 'markup' | 'gross_margin';
  interface ItemForm {
    name: string;
    categoryId: string; // '' = no category
    universalCode: string;
    unitOfMeasure: string;
    sellingPrice: string;
    reorderPoint: string;
    marginStrategy: MarginStrategy | ''; // '' = inherit from category
    targetMargin: string; // '' = inherit
  }

  let { item, categories, token, onClose, onSaved } = $props<{
    item: any;
    categories: any[];
    token: string;
    onClose: () => void;
    onSaved: () => void;
  }>();

  function toForm(it: any): ItemForm {
    return {
      name: it.name ?? '',
      categoryId: it.categoryId ?? '',
      universalCode: it.universalCode ?? '',
      unitOfMeasure: it.unitOfMeasure ?? 'pcs',
      sellingPrice: it.sellingPrice != null ? String(Number(it.sellingPrice)) : '0',
      reorderPoint: it.reorderPoint != null ? String(it.reorderPoint) : '0',
      marginStrategy: (it.marginStrategy ?? '') as MarginStrategy | '',
      targetMargin: it.targetMargin != null ? String(Number(it.targetMargin)) : ''
    };
  }

  // svelte-ignore state_referenced_locally
  let form = $state<ItemForm>(toForm(item));
  let loading = $state(false);
  let errorMsg = $state('');

  function toPayload(f: ItemForm, allowBelowCost = false) {
    return {
      name: f.name,
      categoryId: f.categoryId === '' ? null : f.categoryId,
      universalCode: f.universalCode.trim() === '' ? null : f.universalCode.trim(),
      unitOfMeasure: f.unitOfMeasure,
      sellingPrice: Number(f.sellingPrice),
      reorderPoint: Number(f.reorderPoint),
      marginStrategy: f.marginStrategy === '' ? null : f.marginStrategy,
      targetMargin: f.targetMargin.trim() === '' ? null : Number(f.targetMargin),
      allowBelowCost
    };
  }

  // P1 (4C.2) — the server judges sellingPrice against the item's margin config.
  // Below target still saves (warning); below cost is rejected (422
  // PRICE_BELOW_COST) unless deliberately confirmed as a clearance price.
  async function save(allowBelowCost = false) {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(toPayload(form, allowBelowCost))
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.error?.code === 'PRICE_BELOW_COST') {
          const proceed = confirm(`${result.error.message}\n\nLanjutkan dan simpan harga ini sebagai harga cuci gudang?`);
          if (proceed) { loading = false; return save(true); }
          loading = false;
          return;
        }
        throw new Error(result.error?.message || 'Gagal menyimpan perubahan');
      }
      if (result.data?.marginWarning) {
        const w = result.data.marginWarning;
        alert(
          `Harga tersimpan, tapi di bawah target margin.\n` +
          `Margin aktual: ${w.actualMargin.toFixed(1)}% (target: ${w.targetMargin}%)\n` +
          `Rekomendasi harga: Rp ${Math.round(w.recommendedPrice).toLocaleString('id-ID')}`
        );
      }
      onSaved();
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
      <h3 class="font-semibold text-lg text-slate-900">Edit Produk</h3>
      <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={onClose}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
      {#if errorMsg}
        <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{errorMsg}</div>
      {/if}

      <p class="text-xs text-slate-400">SKU <span class="font-mono">{item.sku}</span> tidak bisa diubah di sini.</p>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="item-name">Nama Produk *</label>
        <input id="item-name" type="text" bind:value={form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="item-category">Kategori</label>
        <select id="item-category" bind:value={form.categoryId} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="">Tanpa kategori</option>
          {#each categories as cat}
            <option value={cat.id}>{cat.name}</option>
          {/each}
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="item-code">Kode Universal</label>
          <input id="item-code" type="text" bind:value={form.universalCode} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. BLP673">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="item-uom">Unit Satuan</label>
          <input id="item-uom" type="text" bind:value={form.unitOfMeasure} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="pcs">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="item-price">Harga Jual Dasar</label>
          <input id="item-price" type="number" min="0" step="1" bind:value={form.sellingPrice} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="item-reorder">Batas Reorder</label>
          <input id="item-reorder" type="number" min="0" step="1" bind:value={form.reorderPoint} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="item-strategy">Strategi Margin</label>
          <select id="item-strategy" bind:value={form.marginStrategy} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="">Ikuti kategori / default</option>
            <option value="markup">Markup (harga = biaya × (1 + m%))</option>
            <option value="gross_margin">Gross Margin (harga = biaya ÷ (1 − m%))</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="item-target">Target Margin %</label>
          <input id="item-target" type="number" min="0" step="0.01" bind:value={form.targetMargin} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. 30">
        </div>
      </div>
      <p class="text-xs text-slate-400">Gross margin harus di bawah 100%. Kosongkan keduanya untuk mengikuti kategori.</p>

      <div class="pt-4 flex justify-end gap-3">
        <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={onClose}>Batal</button>
        <button type="submit" disabled={loading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  </div>
</div>
