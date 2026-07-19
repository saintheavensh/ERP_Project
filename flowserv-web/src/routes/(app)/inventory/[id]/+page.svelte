<script lang="ts">
  import InventoryHeader from '$lib/components/inventory/InventoryHeader.svelte';
  import StockBatches from '$lib/components/inventory/StockBatches.svelte';
  import BrandPricing from '$lib/components/inventory/BrandPricing.svelte';
  import CompatibilityManager from '$lib/components/inventory/CompatibilityManager.svelte';
  import PricingSimulator from '$lib/components/inventory/PricingSimulator.svelte';

  let { data } = $props();
  let item = $derived(data.item);
  let allModels = $derived(data.allModels || []);

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

  async function handleApplyPrice(brandId: string, customPrice: number) {
    try {
      const res = await fetch(`http://localhost:3001/v1/inventory/${item.id}/brands/${brandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({ sellingPrice: customPrice })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to save');
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
  </div>

  {#if item}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Kolom Kiri: Info Dasar & Stok -->
      <div class="lg:col-span-1 space-y-6">
        <InventoryHeader {item} />
        <StockBatches batches={item.stockBatches} />
      </div>
      
      <!-- Kolom Kanan: Kompatibilitas & Harga Merk -->
      <div class="lg:col-span-2 space-y-6">
        <BrandPricing 
          {item} 
          token={data.token} 
          onOpenSimulator={handleOpenSimulator} 
        />
        
        <CompatibilityManager 
          {item} 
          token={data.token} 
          {allModels} 
        />
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-slate-500">
      Loading product details...
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
