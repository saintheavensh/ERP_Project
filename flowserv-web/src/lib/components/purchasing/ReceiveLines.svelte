<script lang="ts">
  import type { PurchaseReceiveState } from '$lib/states/purchasing/receive.svelte';

  let { state } = $props<{ state: PurchaseReceiveState }>();
</script>

<div class="space-y-6">
  {#each state.lines as line, lineIndex}
    <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 class="font-bold text-slate-900">{line.name}</h3>
          <p class="text-sm text-slate-500">SKU: {line.sku}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Pesanan (Qty)</p>
          <p class="text-xl font-bold text-slate-800">{line.orderedQty}</p>
          {#if line.alreadyReceivedQty > 0}
            <p class="text-xs text-blue-600 mt-1">
              Sudah diterima: {line.alreadyReceivedQty} &middot; Sisa: {line.remainingQty}
            </p>
          {/if}
        </div>
      </div>
      <div class="p-4 bg-white">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-xs font-medium text-slate-500 border-b border-slate-100">
              <th class="pb-2 w-1/2">Pilih Merk yang Datang (Opsional)</th>
              <th class="pb-2 w-1/3">Jumlah Fisik Diterima</th>
              <th class="pb-2 w-1/6"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            {#each line.splits as split, splitIndex}
              <tr>
                <td class="py-3 pr-4">
                  <select bind:value={split.partBrandId} required={state.isBrandRequired(line.categoryName)} class="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    {#if state.isBrandRequired(line.categoryName)}
                      <option value="" disabled selected>-- Wajib Pilih Merk --</option>
                    {:else}
                      <option value="">-- Tanpa Merk (Opsional) --</option>
                    {/if}
                    {#each state.partBrands as brand}
                      <option value={brand.id}>{brand.name}</option>
                    {/each}
                  </select>
                </td>
                <td class="py-3 pr-4">
                  <input type="number" min="0" bind:value={split.receivedQuantity} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-slate-900">
                </td>
                <td class="py-3 text-right">
                  {#if line.splits.length > 1}
                    <button type="button" onclick={() => state.removeSplit(lineIndex, splitIndex)} class="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded-lg">
                      Hapus
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <div class="mt-3">
          <button type="button" onclick={() => state.addSplit(lineIndex)} class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Tambah Merk Lain untuk Item ini
          </button>
        </div>
      </div>
    </div>
  {/each}
</div>
