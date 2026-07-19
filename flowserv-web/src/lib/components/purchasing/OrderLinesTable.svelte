<script lang="ts">
  let { order } = $props<{ order: any }>();
</script>

<table class="w-full text-left border-collapse">
  <thead>
    <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
      <th class="p-4">Nama Barang (SKU)</th>
      <th class="p-4 text-center">Qty Pesan</th>
      {#if order?.status === 'received' || order?.status === 'completed'}
        <th class="p-4 text-center">Qty Terima</th>
      {/if}
      <th class="p-4 text-right">Harga (Est)</th>
      {#if order?.status === 'completed'}
        <th class="p-4 text-right">Harga (Final)</th>
      {/if}
      <th class="p-4 text-right">Subtotal</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-slate-100">
    {#each order?.purchaseOrderLines || [] as line}
      {#if (order.status === 'received' || order.status === 'completed') && line.stockBatches && line.stockBatches.length > 0}
        <!-- Render multiple rows for each received batch -->
        {#each line.stockBatches as batch, index}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 text-slate-900">
              <span class="font-medium">{line.inventoryItem?.name}</span>
              <br>
              <span class="text-xs text-slate-500">SKU: {line.inventoryItem?.sku}</span>
              <div class="inline-flex items-center ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                Merk: {batch.partBrand?.name || 'Tanpa Merk'}
              </div>
            </td>
            <td class="p-4 text-center font-medium">
              {index === 0 ? line.quantity : ''}
            </td>
            <td class="p-4 text-center font-medium text-green-600">
              {batch.quantityReceived}
            </td>
            <td class="p-4 text-right text-slate-500">Rp {parseFloat(line.unitPrice).toLocaleString('id-ID')}</td>
            {#if order?.status === 'completed'}
              <td class="p-4 text-right font-medium text-slate-900">
                {#if batch.unitCost}
                  Rp {parseFloat(batch.unitCost).toLocaleString('id-ID')}
                {:else}
                  -
                {/if}
              </td>
            {/if}
            <td class="p-4 text-right font-medium text-slate-900">
              {#if order.status === 'completed' && batch.unitCost}
                Rp {(parseFloat(batch.unitCost) * batch.quantityReceived).toLocaleString('id-ID')}
              {:else}
                Rp {(parseFloat(line.unitPrice) * batch.quantityReceived).toLocaleString('id-ID')} <span class="text-xs text-slate-400 block">Est (berdasarkan terima)</span>
              {/if}
            </td>
          </tr>
        {/each}
      {:else}
        <!-- Render single row for PO Line (not received yet, or received 0) -->
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-4 text-slate-900">
            <span class="font-medium">{line.inventoryItem?.name}</span>
            <br>
            <span class="text-xs text-slate-500">SKU: {line.inventoryItem?.sku}</span>
          </td>
          <td class="p-4 text-center font-medium">{line.quantity}</td>
          {#if order?.status === 'received' || order?.status === 'completed'}
            <td class="p-4 text-center font-medium text-slate-400">-</td>
          {/if}
          <td class="p-4 text-right text-slate-500">Rp {parseFloat(line.unitPrice).toLocaleString('id-ID')}</td>
          {#if order?.status === 'completed'}
            <td class="p-4 text-right font-medium text-slate-900">-</td>
          {/if}
          <td class="p-4 text-right font-medium text-slate-900">
            Rp {(parseFloat(line.unitPrice) * line.quantity).toLocaleString('id-ID')}
            {#if order?.status === 'received' || order?.status === 'completed'}
              <span class="text-xs text-red-500 block">Belum diterima</span>
            {/if}
          </td>
        </tr>
      {/if}
    {/each}
  </tbody>
</table>
