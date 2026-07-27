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

  // D2 — only manager/owner may apply a discount (matches the pos.apply_discount
  // grant on the backend). Cashier doesn't see the field at all.
  const canDiscount = $derived(data.roleName === 'Super Admin' || data.roleName === 'Manager');

  onMount(() => {
    pos.cart.restoreCart();
  });
</script>

<!-- Mobile: the header can wrap to 2 lines depending on content, so a rigid
     bounded-height flex split (the desktop behavior) would fight over how much is
     left for the product grid + cart and could squeeze one to near-zero. Simpler
     and robust: let the whole page scroll on mobile; only lock to a fixed
     viewport-height, non-scrolling split from lg up. -->
<div class="flex flex-col min-h-[calc(100vh-4rem)] overflow-y-auto lg:h-[calc(100vh-4rem)] lg:overflow-hidden bg-slate-50">
  <!-- Header / Controls -->
  <div class="bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 shrink-0 flex flex-wrap items-center gap-3 justify-between shadow-sm z-10">
    <div class="flex flex-wrap items-center gap-3 md:space-x-6">
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

    <div class="flex items-center gap-2 md:gap-3 md:ml-auto">
      <button onclick={() => pos.drafts.openDrafts()} class="px-3 md:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors border border-indigo-200">
        Daftar Draft
      </button>

      <button onclick={() => pos.drafts.saveDraft()} disabled={pos.cart.cart.length === 0 || pos.commonState.processing} class="px-3 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200">
        Simpan Draft
      </button>

      <div class="hidden md:block h-6 w-px bg-slate-300 mx-2"></div>

      <a href="/pos/history" class="px-3 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center">
        <svg class="w-4 h-4 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="hidden md:inline">Riwayat</span>
      </a>
    </div>
  </div>

  <!-- Tahap B — status auto-cetak struk. Muncul sesaat saat berhasil, dan
       BERTAHAN (dengan tombol cetak ulang) saat gagal, supaya kasir tidak
       kehilangan struk hanya karena printer sedang mati. -->
  {#if pos.checkout.printStatus && pos.checkout.printStatus !== 'printing'}
    <div
      class="px-4 md:px-6 py-2 border-b flex flex-wrap items-center gap-3 shrink-0 {pos.checkout.printStatus === 'printed' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}"
      data-testid="print-status"
    >
      <span class="text-sm font-medium {pos.checkout.printStatus === 'printed' ? 'text-green-800' : 'text-amber-800'}">
        {#if pos.checkout.printStatus === 'printed'}
          Struk {pos.checkout.printedInvoice?.invoiceNumber} tercetak.
        {:else}
          {pos.checkout.printMessage}
        {/if}
      </span>
      {#if pos.checkout.printStatus !== 'printed' && pos.checkout.printedInvoice}
        <button
          onclick={() => pos.checkout.printReceipt(pos.checkout.printedInvoice!.id)}
          class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-300 transition-colors"
          data-testid="reprint-receipt"
        >
          Cetak Ulang
        </button>
      {/if}
      <button
        onclick={() => pos.checkout.dismissPrintStatus()}
        class="ml-auto text-sm text-slate-500 hover:text-slate-700 px-2 py-1"
      >
        Tutup
      </button>
    </div>
  {/if}

  <!-- Main POS Area — stacked on phone/tablet (product grid above, cart below,
       each independently scrollable within a bounded height), side-by-side from
       lg up (original desktop behavior, cart back to a fixed-width column). -->
  <div class="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
    <ProductGrid {pos} />
    <CartSidebar {pos} {canDiscount} />
  </div>
</div>

<CheckoutModal {pos} />
<DraftsModal {pos} />
