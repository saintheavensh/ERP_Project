<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';

  interface Props {
    onSelect: (product: any) => void;
  }

  let { onSelect }: Props = $props();

  let query = $state('');
  let results = $state<any[]>([]);
  let showResults = $state(false);
  let isSearching = $state(false);
  let selectedIndex = $state(-1);

  let searchTimeout: any;

  async function performSearch() {
    if (!query || query.length < 2) {
      results = [];
      return;
    }

    isSearching = true;
    try {
      const res = await fetch(`http://localhost:3000/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        results = data.data;
        showResults = results.length > 0;
        selectedIndex = -1;
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      isSearching = false;
    }
  }

  function handleInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300);
  }

  function selectProduct(product: any) {
    onSelect(product);
    query = '';
    results = [];
    showResults = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault();
        selectProduct(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      showResults = false;
    }
  }
</script>

<div class="relative w-full">
  <div class="relative group">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500">
      <span class="text-slate-400">🔍</span>
    </div>
    <input
      type="text"
      bind:value={query}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      onfocus={() => query.length >= 2 && (showResults = true)}
      placeholder="Cari Nama Barang atau Scan Barcode..."
      class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-slate-400 placeholder:font-normal"
    />
    
    {#if isSearching}
      <div class="absolute right-3 top-1/2 -translate-y-1/2">
        <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {/if}
  </div>

  {#if showResults && results.length > 0}
    <div 
      class="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto"
      transition:slide={{ duration: 150 }}
    >
      <div class="p-2 border-b border-slate-50 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Hasil Pencarian ({results.length})
      </div>
      {#each results as product, i}
        <button
          class="w-full flex items-center justify-between p-3 transition-colors text-left group
          {selectedIndex === i ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'}"
          onclick={() => selectProduct(product)}
        >
          <div class="flex-1">
            <div class="font-bold truncate">{product.name}</div>
            <div class="text-[11px] {selectedIndex === i ? 'text-primary-500' : 'text-slate-400'} flex gap-2">
              <span>SKU: {product.sku || '-'}</span>
              <span>•</span>
              <span>Stok: {product.currentStock} {product.unit}</span>
            </div>
          </div>
          <div class="ml-3 text-right">
            <div class="font-black text-sm {selectedIndex === i ? 'text-primary-600' : 'text-slate-900'}">
              Rp {product.defaultPrice?.toLocaleString('id-ID') || 0}
            </div>
            <div class="text-[9px] text-slate-400 font-bold uppercase">Harga Jual</div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
