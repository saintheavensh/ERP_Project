<script lang="ts">
  let { data } = $props();
  let orders = $derived(data.orders || []);
</script>

<svelte:head>
  <title>Pending Receipts - FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Receive PO (Warehouse)</h1>
      <p class="text-slate-500 mt-1">Daftar Purchase Order yang sedang dalam pengiriman dan menunggu untuk diterima oleh staf gudang.</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
   <div class="overflow-x-auto">
    <table class="w-full min-w-[720px] text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">Nomor PO</th>
          <th class="p-4">Tanggal Order</th>
          <th class="p-4">Supplier</th>
          <th class="p-4">Status</th>
          <th class="p-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each orders as order}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-medium text-slate-900">{order.poNumber}</td>
            <td class="p-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
            <td class="p-4 text-slate-900">{order.supplier?.name}</td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                Menunggu Kedatangan
              </span>
            </td>
            <td class="p-4 text-right">
              <a href={`/inventory/purchasing/${order.id}`} class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm">
                Buka PO & Terima Barang
              </a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="5" class="p-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
              </div>
              <h3 class="text-lg font-medium text-slate-900">Tidak ada barang yang masuk</h3>
              <p class="text-slate-500 mt-1 text-sm">Semua Purchase Order telah diterima atau belum ada yang di-order.</p>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
   </div>
  </div>
</div>
