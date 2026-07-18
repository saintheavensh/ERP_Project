<script lang="ts">
  let { data } = $props();
  let orders = $derived(data.orders || []);

  function getPoStage(order: any) {
    if (order.status === 'draft') return { step: 1, label: 'Bikin PO', text: 'Draft', color: 'bg-slate-100 text-slate-700' };
    if (order.status === 'ordered') return { step: 1, label: 'Tunggu Barang', text: 'Ordered', color: 'bg-yellow-100 text-yellow-700' };
    if (order.status === 'received') return { step: 2, label: 'Tunggu Harga', text: 'Received (Butuh Costing)', color: 'bg-blue-100 text-blue-700' };
    if (order.status === 'completed') {
      const inv = order.supplierInvoices?.[0];
      if (inv) {
        if (inv.status === 'paid') return { step: 4, label: 'Lunas', text: 'Paid', color: 'bg-green-100 text-green-700' };
        if (inv.status === 'partial') return { step: 3, label: 'Hutang', text: 'Partial', color: 'bg-orange-100 text-orange-700' };
        return { step: 3, label: 'Hutang', text: 'Tempo / Unpaid', color: 'bg-red-100 text-red-700' };
      }
      return { step: 4, label: 'Lunas', text: 'Completed', color: 'bg-green-100 text-green-700' };
    }
    return { step: 0, label: 'Unknown', text: 'Unknown', color: 'bg-slate-100 text-slate-700' };
  }
</script>

<svelte:head>
  <title>Purchase Orders - FlowServ</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Master Purchasing Dashboard</h1>
      <p class="text-slate-500 mt-1">Lacak seluruh alur belanja dari Bikin PO, Terima Fisik, Costing (Harga), hingga Lunas.</p>
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
          <th class="p-4">Tahapan (Status)</th>
          <th class="p-4 text-right">Total Nominal</th>
          <th class="p-4 text-center">Jatuh Tempo</th>
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
              <div class="flex flex-col gap-1 items-start">
                <span class="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Step {stage.step}: {stage.label}</span>
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium {stage.color}">
                  {stage.text}
                </span>
              </div>
            </td>
            <td class="p-4 text-right">
              {#if order.status === 'completed' && order.actualTotal}
                <div class="font-bold text-slate-900">Rp {parseFloat(order.actualTotal).toLocaleString('id-ID')}</div>
                <div class="text-xs text-green-600">Actual (Final)</div>
              {:else}
                <div class="text-slate-600">Rp {parseFloat(order.estimatedTotal).toLocaleString('id-ID')}</div>
                <div class="text-xs text-slate-400">Estimated</div>
              {/if}
            </td>
            <td class="p-4 text-center">
              {#if order.supplierInvoices?.[0]?.dueDate}
                <div class="text-sm font-medium text-slate-800">
                  {new Date(order.supplierInvoices[0].dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              {:else}
                <span class="text-slate-400 text-sm">-</span>
              {/if}
            </td>
            <td class="p-4 text-right">
              <a href={`/inventory/purchasing/${order.id}`} class="text-blue-600 hover:text-blue-800 text-sm font-medium border px-3 py-1 rounded">Lihat PO</a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="p-8 text-center text-slate-500">
              No purchase orders found.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
