<script lang="ts">
  let { order, inv, loading, onUpdateStatus } = $props<{ 
    order: any, 
    inv: any, 
    loading: boolean, 
    onUpdateStatus: (status: string) => void 
  }>();
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <!-- Step 1: Draft/Ordered -->
  <div class="p-4 rounded-xl border {order?.status === 'draft' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}">
    <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 1</div>
    <div class="font-semibold text-slate-900 mb-3">Pemesanan (PO)</div>
    {#if order?.status === 'draft'}
      <button disabled={loading} onclick={() => onUpdateStatus('ordered')} class="w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium transition-colors">Tandai Dipesan</button>
    {:else}
      <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Selesai Dipesan
      </div>
    {/if}
  </div>

  <!-- Step 2: Receive -->
  <div class="p-4 rounded-xl border {order?.status === 'ordered' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}">
    <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 2 (Bag. Gudang)</div>
    <div class="font-semibold text-slate-900 mb-3">Terima Fisik Barang</div>
    {#if order?.status === 'ordered'}
      <a href={`/inventory/purchasing/${order?.id}/receive`} class="block text-center w-full text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">Buka Form Penerimaan</a>
    {:else if order?.status === 'received' || order?.status === 'completed'}
      <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Barang Diterima
      </div>
    {:else}
      <div class="text-sm text-slate-400">Menunggu Step 1</div>
    {/if}
  </div>

  <!-- Step 3: Costing -->
  <div class="p-4 rounded-xl border {order?.status === 'received' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}">
    <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 3 (Manajer)</div>
    <div class="font-semibold text-slate-900 mb-3">Input Harga & Invoice</div>
    {#if order?.status === 'received'}
      <a href={`/inventory/purchasing/${order?.id}/invoice`} class="block text-center w-full text-sm bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">Input Costing</a>
    {:else if order?.status === 'completed'}
      <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Harga Ditetapkan
      </div>
    {:else}
      <div class="text-sm text-slate-400">Menunggu Step 2</div>
    {/if}
  </div>

  <!-- Step 4: Payment -->
  <div class="p-4 rounded-xl border {order?.status === 'completed' && inv?.status !== 'paid' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-slate-200 bg-white'}">
    <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 4 (Finance)</div>
    <div class="font-semibold text-slate-900 mb-3">Status Pembayaran</div>
    {#if order?.status === 'completed'}
      {#if inv}
        {#if inv.status === 'paid'}
          <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Lunas ({inv.paymentMethod})
          </div>
        {:else}
          <a href="/finance/payables" class="block text-center w-full text-sm bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium transition-colors">Tagihan Tempo (Bayar)</a>
        {/if}
      {:else}
        <div class="text-sm text-green-600 font-medium flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Lunas (Cash)
        </div>
      {/if}
    {:else}
      <div class="text-sm text-slate-400">Menunggu Step 3</div>
    {/if}
  </div>
</div>
