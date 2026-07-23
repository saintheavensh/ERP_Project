<script lang="ts">
  let { data } = $props();
  let orders = $derived(data.orders || []);
</script>

<svelte:head>
  <title>Purchase Invoices (Costing) - FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Purchase Invoices & Costing</h1>
      <p class="text-slate-500 mt-1">Daftar PO yang sudah diterima gudang dan membutuhkan input harga asli serta metode pembayaran (Invoice/Tempo).</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
   <div class="overflow-x-auto">
    <table class="w-full min-w-[720px] text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">PO Number</th>
          <th class="p-4">Date</th>
          <th class="p-4">Supplier</th>
          <th class="p-4">Status</th>
          <th class="p-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each orders as order}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-medium text-slate-900">{order.poNumber}</td>
            <td class="p-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
            <td class="p-4 text-slate-900">{order.supplier?.name}</td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">Menunggu Costing (Manager)</span>
            </td>
            <td class="p-4 text-right flex justify-end gap-2">
              <a href={`/inventory/purchasing/${order.id}`} class="text-slate-600 hover:text-slate-800 text-sm font-medium border px-3 py-1 rounded">Lihat PO</a>
              <a href={`/inventory/purchasing/${order.id}/invoice`} class="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1 rounded transition-colors">Input Costing</a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="5" class="p-8 text-center text-slate-500">
              Tidak ada PO yang membutuhkan input harga saat ini.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
   </div>
  </div>
</div>
