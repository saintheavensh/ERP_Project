<script lang="ts">
  import { onMount } from 'svelte';
  import { createPosState } from '$lib/states/pos/pos.svelte';
  
  import ProductGrid from '$lib/components/pos/ProductGrid.svelte';
  import CartSidebar from '$lib/components/pos/CartSidebar.svelte';
  import CheckoutModal from '$lib/components/pos/CheckoutModal.svelte';
  import DraftsModal from '$lib/components/pos/DraftsModal.svelte';

  let { data } = $props();
  
  // svelte-ignore state_referenced_locally
  const pos = createPosState(data);

  onMount(() => {
    pos.cart.restoreCart();
  });
</script>

<div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
  <!-- Header / Controls -->
  <div class="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between shadow-sm z-10">
    <div class="flex items-center space-x-6">
      <h1 class="text-xl font-bold text-slate-800">Point of Sales</h1>
      
      <div class="flex items-center space-x-2">
        <label for="branch" class="text-sm font-medium text-slate-600">Cabang:</label>
        <select id="branch" bind:value={pos.products.selectedBranchId} class="text-sm border-slate-200 rounded-lg py-1.5 focus:ring-blue-500">
          {#each pos.products.branches as branch}
            <option value={branch.id}>{branch.name}</option>
          {/each}
        </select>
      </div>
    </div>
    
    {#if pos.commonState.successMsg}
      <div class="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
        {pos.commonState.successMsg}
      </div>
    {/if}

    <div class="ml-auto flex items-center space-x-3">
      <button onclick={() => pos.drafts.openDrafts()} class="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors border border-indigo-200">
        Daftar Draft
      </button>
      
      <button onclick={() => pos.drafts.saveDraft()} disabled={pos.cart.cart.length === 0 || pos.commonState.processing} class="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200">
        Simpan Draft
      </button>
      
      <div class="h-6 w-px bg-slate-300 mx-2"></div>

      <a href="/pos/history" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Riwayat
      </a>
    </div>
  </div>

  <!-- Main POS Area -->
  <div class="flex flex-1 overflow-hidden">
    <ProductGrid {pos} />
    <CartSidebar {pos} />
  </div>
</div>

<CheckoutModal {pos} />
<DraftsModal {pos} />
