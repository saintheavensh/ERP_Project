<script lang="ts">
  import { API_BASE } from '$lib/api/config';
  import InventoryHeader from '$lib/components/inventory/InventoryHeader.svelte';
  import StockBatches from '$lib/components/inventory/StockBatches.svelte';
  import BrandPricing from '$lib/components/inventory/BrandPricing.svelte';
  import SupplierComparison from '$lib/components/inventory/SupplierComparison.svelte';
  import CompatibilityManager from '$lib/components/inventory/CompatibilityManager.svelte';
  import PricingSimulator from '$lib/components/inventory/PricingSimulator.svelte';
  import EditItemModal from '$lib/components/inventory/EditItemModal.svelte';

  let { data } = $props();
  let item = $derived(data.item);
  let allModels = $derived(data.allModels || []);
  let categories = $derived(data.categories || []);
  let branches = $derived(data.branches || []);

  // F4 — edit master data (name, category, universal code, unit, price, reorder point, margin)
  let showEditModal = $state(false);

  // Simulator Modal State
  let showSimModal = $state(false);
  let simBrandId = $state<string | null>(null);
  let simBrandName = $state('');
  let simSellingPrice = $state(0);

  function handleOpenSimulator(brandId: string, name: string, currentPrice: number) {
    simBrandId = brandId;
    simBrandName = name;
    simSellingPrice = currentPrice;
    showSimModal = true;
  }

  function handleCloseSimulator() {
    showSimModal = false;
    simBrandId = null;
  }

  // P1 (4C.2) — the server now judges this price against the item's margin
  // config. A below-target price still saves (with a warning); a below-cost
  // price is rejected (422 PRICE_BELOW_COST) unless the user deliberately
  // confirms a clearance price, retried here with allowBelowCost: true.
  async function handleApplyPrice(brandId: string, customPrice: number, allowBelowCost = false) {
    try {
      const res = await fetch(`${API_BASE}/inventory/${item.id}/brands/${brandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({ sellingPrice: customPrice, allowBelowCost })
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.error?.code === 'PRICE_BELOW_COST') {
          const proceed = confirm(`${result.error.message}\n\nLanjutkan dan simpan harga ini sebagai harga cuci gudang?`);
          if (proceed) return handleApplyPrice(brandId, customPrice, true);
          return;
        }
        throw new Error(result.error?.message || 'Failed to save');
      }
      if (result.data?.marginWarning) {
        const w = result.data.marginWarning;
        alert(
          `Harga tersimpan, tapi di bawah target margin.\n` +
          `Margin aktual: ${w.actualMargin.toFixed(1)}% (target: ${w.targetMargin}%)\n` +
          `Rekomendasi harga: Rp ${Math.round(w.recommendedPrice).toLocaleString('id-ID')}`
        );
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }
</script>

<svelte:head>
  <title>Detail Produk - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <a href="/inventory" class="text-slate-400 hover:text-slate-600" aria-label="Kembali ke Daftar Inventory">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">{item?.name || 'Detail Produk'}</h1>
        <p class="text-slate-500 mt-1">SKU: {item?.sku} &bull; Kategori: {item?.category?.name || '-'}</p>
      </div>
    </div>
    {#if item}
      <button
        onclick={() => showEditModal = true}
        class="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors"
      >
        Ubah Produk
      </button>
    {/if}
  </div>

  {#if item}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Kolom Kiri: Info Dasar & Stok -->
      <div class="lg:col-span-1 space-y-6">
        <InventoryHeader {item} />
        <StockBatches batches={item.stockBatches} {branches} />
      </div>
      
      <!-- Kolom Kanan: Kompatibilitas & Harga Merk -->
      <div class="lg:col-span-2 space-y-6">
        <BrandPricing 
          {item} 
          token={data.token} 
          onOpenSimulator={handleOpenSimulator}
        />

        <SupplierComparison {item} />

        <CompatibilityManager
          {item} 
          token={data.token} 
          {allModels} 
        />
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-slate-500">
      Memuat rincian produk...
    </div>
  {/if}
</div>

{#if showSimModal && simBrandId}
  <PricingSimulator
    {item}
    {simBrandId}
    {simBrandName}
    initialSellingPrice={simSellingPrice}
    onClose={handleCloseSimulator}
    onApplyPrice={handleApplyPrice}
  />
{/if}

{#if showEditModal && item}
  <EditItemModal
    {item}
    {categories}
    token={data.token}
    onClose={() => showEditModal = false}
    onSaved={() => window.location.reload()}
  />
{/if}
