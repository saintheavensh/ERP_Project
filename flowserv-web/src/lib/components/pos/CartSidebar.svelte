<script lang="ts">
  let { pos } = $props<{ pos: any }>();

  let showServiceForm = $state(false);
  let serviceType = $state<'labor' | 'fee'>('labor');
  let serviceDescription = $state('');
  let serviceAmount = $state<number | null>(null);

  function addService() {
    pos.cart.addServiceLine(serviceType, serviceDescription, Number(serviceAmount) || 0);
    serviceDescription = '';
    serviceAmount = null;
    showServiceForm = false;
  }
</script>

<div class="w-full lg:w-96 lg:flex-none flex flex-col bg-white shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] lg:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
  <div class="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
    <h2 class="font-semibold flex items-center"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>Keranjang ({pos.cart.cart.length})</h2>
    {#if pos.cart.cart.length > 0}
      <button class="text-xs text-slate-300 hover:text-white transition-colors" onclick={() => pos.cart.clearCart()}>Kosongkan</button>
    {/if}
  </div>
  
  <!-- Add service / labor charge -->
  <div class="px-4 pt-3 shrink-0">
    {#if showServiceForm}
      <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
        <div class="flex space-x-2">
          <select bind:value={serviceType} class="text-xs border-slate-300 rounded-md px-2 py-1.5 bg-white">
            <option value="labor">Jasa Servis</option>
            <option value="fee">Biaya Lain</option>
          </select>
          <input
            type="text"
            bind:value={serviceDescription}
            placeholder="Deskripsi (mis. Jasa ganti LCD)"
            class="flex-1 text-xs px-2 py-1.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500"
          >
        </div>
        <div class="flex space-x-2">
          <input
            type="number"
            bind:value={serviceAmount}
            min="0"
            placeholder="Jumlah (Rp)"
            class="flex-1 text-xs px-2 py-1.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500"
          >
          <button onclick={addService} class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md">Tambah</button>
          <button onclick={() => showServiceForm = false} class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-md">Batal</button>
        </div>
      </div>
    {:else}
      <button
        onclick={() => showServiceForm = true}
        class="w-full py-2 border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium transition-colors"
      >
        + Tambah Jasa / Servis
      </button>
    {/if}
  </div>

  <!-- Cart Items -->
  <div class="flex-1 overflow-y-auto p-4">
    {#if pos.cart.cart.length === 0}
      <div class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <svg class="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
        <p>Keranjang masih kosong</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each pos.cart.cart as item, i}
          <div class="flex flex-col bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h4 class="text-sm font-medium text-slate-800 leading-tight">{item.name}</h4>
                {#if item.sourceType === 'labor' || item.sourceType === 'fee'}
                  <span class="text-[10px] uppercase tracking-wide text-indigo-500 font-medium">{item.sourceType === 'labor' ? 'Jasa' : 'Biaya Lain'}</span>
                {:else}
                  <span class="text-[10px] font-mono text-slate-500">{item.sku}</span>
                {/if}
              </div>
              <span class="text-sm font-semibold text-slate-700">{pos.formatRp(item.unitPrice * item.quantity)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500">{pos.formatRp(item.unitPrice)} /pcs</span>
              <div class="flex items-center space-x-3 bg-white border border-slate-200 rounded-md">
                <button class="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-l-md" onclick={() => pos.cart.updateQty(i, -1)}>-</button>
                <span class="text-sm font-medium w-4 text-center">{item.quantity}</span>
                <button class="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-r-md" onclick={() => pos.cart.updateQty(i, 1)}>+</button>
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
        <span>{pos.formatRp(pos.cart.subtotal)}</span>
      </div>
      <div class="flex justify-between text-sm items-center">
        <span class="text-slate-600">Diskon (Rp)</span>
        <input type="number" bind:value={pos.cart.discountAmount} min="0" max={pos.cart.subtotal} class="w-24 text-right px-2 py-1 border border-slate-300 rounded text-sm bg-white outline-none focus:border-blue-500">
      </div>
      <div class="pt-2 mt-2 border-t border-slate-200 flex justify-between items-end">
        <span class="font-medium text-slate-800">Total</span>
        <span class="text-xl font-bold text-blue-600">{pos.formatRp(pos.cart.grandTotal)}</span>
      </div>
    </div>
    
    <button 
      onclick={() => pos.checkout.openCheckout()}
      disabled={pos.cart.cart.length === 0}
      class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
    >
      <span>Lanjut Pembayaran</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
    </button>
  </div>
</div>
