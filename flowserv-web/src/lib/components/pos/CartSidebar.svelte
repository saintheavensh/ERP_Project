<script lang="ts">
  let { pos } = $props<{ pos: any }>();
</script>

<div class="w-96 flex flex-col bg-white shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
  <div class="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
    <h2 class="font-semibold flex items-center"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>Keranjang ({pos.cart.length})</h2>
    {#if pos.cart.length > 0}
      <button class="text-xs text-slate-300 hover:text-white transition-colors" onclick={() => pos.clearCart()}>Kosongkan</button>
    {/if}
  </div>
  
  <!-- Cart Items -->
  <div class="flex-1 overflow-y-auto p-4">
    {#if pos.cart.length === 0}
      <div class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <svg class="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
        <p>Keranjang masih kosong</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each pos.cart as item, i}
          <div class="flex flex-col bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h4 class="text-sm font-medium text-slate-800 leading-tight">{item.name}</h4>
                <span class="text-[10px] font-mono text-slate-500">{item.sku}</span>
              </div>
              <span class="text-sm font-semibold text-slate-700">{pos.formatRp(item.unitPrice * item.quantity)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500">{pos.formatRp(item.unitPrice)} /pcs</span>
              <div class="flex items-center space-x-3 bg-white border border-slate-200 rounded-md">
                <button class="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-l-md" onclick={() => pos.updateQty(i, -1)}>-</button>
                <span class="text-sm font-medium w-4 text-center">{item.quantity}</span>
                <button class="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-r-md" onclick={() => pos.updateQty(i, 1)}>+</button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Cart Footer / Totals -->
  <div class="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
    <div class="space-y-2 mb-4">
      <div class="flex justify-between text-sm text-slate-600">
        <span>Subtotal</span>
        <span>{pos.formatRp(pos.subtotal)}</span>
      </div>
      <div class="flex justify-between text-sm items-center">
        <span class="text-slate-600">Diskon (Rp)</span>
        <input type="number" bind:value={pos.discountAmount} min="0" max={pos.subtotal} class="w-24 text-right px-2 py-1 border border-slate-300 rounded text-sm bg-white outline-none focus:border-blue-500">
      </div>
      <div class="pt-2 mt-2 border-t border-slate-200 flex justify-between items-end">
        <span class="font-medium text-slate-800">Total</span>
        <span class="text-xl font-bold text-blue-600">{pos.formatRp(pos.grandTotal)}</span>
      </div>
    </div>
    
    <button 
      onclick={pos.openCheckout}
      disabled={pos.cart.length === 0}
      class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
    >
      <span>Lanjut Pembayaran</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
    </button>
  </div>
</div>
