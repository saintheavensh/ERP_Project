<script lang="ts">
  import { untrack } from 'svelte';
  let { data } = $props();
  let order = $derived(data.order);
  let partBrands = $derived(data.partBrands || []);
  
  let lines = $state(untrack(() => 
    data.order.purchaseOrderLines.map((l: any) => ({
      lineId: l.id,
      name: l.inventoryItem.name,
      sku: l.inventoryItem.sku,
      categoryName: l.inventoryItem.category?.name || '',
      orderedQty: l.quantity,
      splits: [
        { partBrandId: '', receivedQuantity: l.quantity }
      ]
    }))
  ));
  
  function isBrandRequired(categoryName: string) {
    const name = categoryName.toLowerCase();
    // Jika bukan aksesoris, baut, solatip, tools, dsb -> wajib isi merk.
    // Asumsi utama: LCD, Sparepart, Baterai wajib merk.
    if (name.includes('baut') || name.includes('solatip') || name.includes('tools') || name.includes('aksesoris')) {
      return false;
    }
    return true; // Default wajib pilih merk untuk Sparepart, LCD, dll.
  }
  
  let loading = $state(false);
  let errorMsg = $state('');
  
  function addSplit(lineIndex: number) {
    lines[lineIndex].splits = [...lines[lineIndex].splits, { partBrandId: '', receivedQuantity: 0 }];
  }
  
  function removeSplit(lineIndex: number, splitIndex: number) {
    lines[lineIndex].splits = lines[lineIndex].splits.filter((_: any, i: number) => i !== splitIndex);
  }
  
  async function submitReceiving() {
    loading = true;
    errorMsg = '';
    
    try {
      const payload = {
        lines: lines.map((l: any) => ({ 
          lineId: l.lineId, 
          splits: l.splits.map((s: any) => ({
            partBrandId: s.partBrandId || null,
            receivedQuantity: s.receivedQuantity
          }))
        }))
      };
      
      const res = await fetch(`http://localhost:3001/v1/purchasing/orders/${order.id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error?.message || 'Failed to submit receiving');
      
      window.location.href = `/inventory/purchasing/${order.id}`;
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Receive PO {order?.poNumber} - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href={`/inventory/purchasing/${order?.id}`} class="text-slate-500 hover:text-slate-800" aria-label="Back">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Receive Items (Warehouse)</h1>
      <p class="text-slate-500 mt-1">PO: {order?.poNumber} &bull; Supplier: {order?.supplier?.name}</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
    <div class="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
      <strong>Tugas Gudang:</strong> Silakan hitung fisik barang yang diterima. Anda bisa memecah 1 item pesanan menjadi beberapa merk yang berbeda jika supplier mengirimkan merk campuran.
    </div>

    <form onsubmit={(e) => { e.preventDefault(); submitReceiving(); }} class="space-y-8">
      {#if errorMsg}
        <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {errorMsg}
        </div>
      {/if}
      
      <div class="space-y-6">
        {#each lines as line, lineIndex}
          <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div class="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 class="font-bold text-slate-900">{line.name}</h3>
                <p class="text-sm text-slate-500">SKU: {line.sku}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Pesanan (Qty)</p>
                <p class="text-xl font-bold text-slate-800">{line.orderedQty}</p>
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
                        <select bind:value={split.partBrandId} required={isBrandRequired(line.categoryName)} class="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                          {#if isBrandRequired(line.categoryName)}
                            <option value="" disabled selected>-- Wajib Pilih Merk --</option>
                          {:else}
                            <option value="">-- Tanpa Merk (Opsional) --</option>
                          {/if}
                          {#each partBrands as brand}
                            <option value={brand.id}>{brand.name}</option>
                          {/each}
                        </select>
                      </td>
                      <td class="py-3 pr-4">
                        <input type="number" min="0" bind:value={split.receivedQuantity} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-slate-900">
                      </td>
                      <td class="py-3 text-right">
                        {#if line.splits.length > 1}
                          <button type="button" onclick={() => removeSplit(lineIndex, splitIndex)} class="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded-lg">
                            Hapus
                          </button>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              <div class="mt-3">
                <button type="button" onclick={() => addSplit(lineIndex)} class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Tambah Merk Lain untuk Item ini
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="flex justify-end pt-4 border-t border-slate-100">
        <button type="submit" disabled={loading} class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Konfirmasi Penerimaan Barang'}
        </button>
      </div>
    </form>
  </div>
</div>
