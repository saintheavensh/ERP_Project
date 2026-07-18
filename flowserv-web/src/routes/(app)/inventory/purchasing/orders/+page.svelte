<script lang="ts">
  let { data } = $props();
  let orders = $derived(data.orders || []);

  function getPoStage(order: any) {
    if (order.status === 'draft') return { step: 1, label: 'Bikin PO', text: 'Draft', color: 'bg-slate-100 text-slate-700' };
    if (order.status === 'ordered') return { step: 1, label: 'Tunggu Barang', text: 'Ordered', color: 'bg-yellow-100 text-yellow-700' };
    return { step: 0, label: 'Unknown', text: 'Unknown', color: 'bg-slate-100 text-slate-700' };
  }
</script>

<svelte:head>
  <title>Purchase Orders - FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Purchase Orders</h1>
      <p class="text-slate-500 mt-1">Buat PO baru dan pantau pesanan yang belum datang.</p>
    </div>
    <a href="/inventory/purchasing/new" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
      New PO
    </a>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">PO Number</th>
          <th class="p-4">Date</th>
          <th class="p-4">Supplier</th>
          <th class="p-4">Status</th>
          <th class="p-4 text-right">Estimated Total</th>
          <th class="p-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each orders as order}
          {@const stage = getPoStage(order)}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-medium text-slate-900">{order.poNumber}</td>
            <td class="p-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
            <td class="p-4 text-slate-900">{order.supplier?.name}</td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium {stage.color}">
                {stage.text}
              </span>
            </td>
            <td class="p-4 text-right text-slate-600">Rp {parseFloat(order.estimatedTotal).toLocaleString('id-ID')}</td>
            <td class="p-4 text-right">
              <a href={`/inventory/purchasing/${order.id}`} class="text-blue-600 hover:text-blue-800 text-sm font-medium">Buka PO</a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="p-8 text-center text-slate-500">
              Tidak ada Purchase Order aktif (semua sudah diterima).
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
