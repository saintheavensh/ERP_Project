<script lang="ts">
  import { PricingSimulatorState } from '$lib/states/inventory/simulator.svelte';

  let { 
    item, 
    simBrandId, 
    simBrandName, 
    initialSellingPrice, 
    onClose, 
    onApplyPrice 
  } = $props<{ 
    item: any, 
    simBrandId: string, 
    simBrandName: string, 
    initialSellingPrice: number,
    onClose: () => void,
    onApplyPrice: (brandId: string, price: number) => Promise<void>
  }>();

  // svelte-ignore state_referenced_locally
  const state = new PricingSimulatorState(item, simBrandId, simBrandName, initialSellingPrice, onApplyPrice, onClose);
</script>

{#if state.simData}
  <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-slate-100">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Simulasi Proyeksi Laba</h2>
          <p class="text-sm text-slate-500 mt-1">Merk: <span class="font-bold text-slate-700">{state.simBrandName}</span></p>
        </div>
        <button onclick={state.onClose} aria-label="Tutup Simulasi" class="text-slate-400 hover:text-slate-600 p-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 overflow-y-auto flex-1 space-y-6">
        <!-- Input Harga Simulasi -->
        <div class="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <label for="sim-price-input" class="block text-sm font-semibold text-slate-700 mb-2">Simulasikan Harga Jual per Pcs:</label>
            <div class="flex items-center gap-2">
              <span class="text-slate-500 font-medium">Rp</span>
              <input id="sim-price-input" type="number" bind:value={state.simSellingPrice} class="w-48 px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900" min="0" />
            </div>
          </div>
          
          <!-- Recommendation Block -->
          <div class="bg-white p-3 rounded-lg border border-blue-100 shadow-sm text-sm">
            <div class="font-semibold text-slate-700 mb-1">Rekomendasi Pintar (Target Margin {state.simData.targetMarginPct}%):</div>
            <div class="flex flex-col gap-1">
              <button onclick={() => state.setRecommendedTotalNet()} class="text-left text-xs hover:bg-slate-50 p-1 -ml-1 rounded transition-colors text-slate-600">
                Target {state.simData.targetMarginPct}% Laba Bersih Total: <span class="font-bold text-slate-900">Rp {Math.round((state.simData.totalModal * state.simData.targetMultiplier) / state.simData.totalQty).toLocaleString('id-ID')}</span>
              </button>
              <button onclick={() => state.setRecommendedLatestCost()} class="text-left text-xs hover:bg-green-50 p-1 -ml-1 rounded transition-colors text-green-700">
                Target {state.simData.targetMarginPct}% dari Modal Terbaru: <span class="font-bold text-green-800">Rp {Math.round(state.simData.latestCost * state.simData.targetMultiplier).toLocaleString('id-ID')}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Ringkasan Eksekutif -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="text-xs text-slate-500 font-medium mb-1">Total Stok</div>
            <div class="text-lg font-bold text-slate-900">{state.simData.totalQty} <span class="text-xs font-normal">pcs</span></div>
          </div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="text-xs text-slate-500 font-medium mb-1">Potensi Omzet</div>
            <div class="text-lg font-bold text-blue-600">Rp {state.simData.totalOmzet.toLocaleString('id-ID')}</div>
          </div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="text-xs text-slate-500 font-medium mb-1">Total Modal</div>
            <div class="text-lg font-bold text-slate-700">Rp {state.simData.totalModal.toLocaleString('id-ID')}</div>
          </div>
          <div class="p-4 {state.simData.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} rounded-lg border">
            <div class="text-xs text-slate-500 font-medium mb-1">Laba Bersih Akhir</div>
            <div class="text-lg font-bold {state.simData.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}">
              {state.simData.netProfit >= 0 ? '+' : ''}Rp {state.simData.netProfit.toLocaleString('id-ID')}
            </div>
            <div class="text-xs font-bold mt-1 {state.simData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
              Margin: {state.simData.netProfitPct.toFixed(1)}%
            </div>
          </div>
        </div>

        <!-- Pembedahan Laba / Beban -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Rincian Komponen Laba Bersih</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-lg bg-green-50/50 border border-green-100">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                <h4 class="font-bold text-green-800">Total Profit Positif</h4>
              </div>
              <p class="text-xs text-green-700 mb-2">Laba yang dikumpulkan dari batch-batch dengan modal murah.</p>
              <div class="text-xl font-black text-green-600">+ Rp {state.simData.totalLabaPositif.toLocaleString('id-ID')}</div>
            </div>

            <div class="p-4 rounded-lg bg-amber-50/50 border border-amber-100">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                <h4 class="font-bold text-amber-800">Beban Fluktuasi</h4>
              </div>
              <p class="text-xs text-amber-700 mb-2">Kerugian yang disubsidi dari profit di atas (karena ada batch mahal).</p>
              <div class="text-xl font-black text-amber-600">- Rp {state.simData.totalBebanFluktuasi.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </div>

        <!-- Rincian per Batch -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Rincian Penjualan per Batch (Urutan FIFO)</h3>
          <div class="border border-slate-200 rounded-lg overflow-hidden">
           <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th class="p-3">Tanggal Diterima</th>
                  <th class="p-3">Sisa Stok</th>
                  <th class="p-3">Harga Modal (HPP)</th>
                  <th class="p-3">Status Profit</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each state.simData.batchDetails as b, i}
                  <tr class="hover:bg-slate-50 relative">
                    <td class="p-3 font-medium text-slate-700">
                      {b.receivedAt ? new Date(b.receivedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A'}
                      {#if i === state.simData.batchDetails.length - 1}
                        <span class="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Terbaru (Harga Pasar)</span>
                      {/if}
                    </td>
                    <td class="p-3 font-semibold text-slate-900">{b.qty} <span class="font-normal text-slate-500">pcs</span></td>
                    <td class="p-3 text-slate-600">Rp {b.cost.toLocaleString('id-ID')}</td>
                    <td class="p-3">
                      {#if b.profit >= 0}
                        <span class="text-green-600 font-bold">+ Rp {b.profit.toLocaleString('id-ID')}</span>
                      {:else}
                        <span class="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">- Rp {Math.abs(b.profit).toLocaleString('id-ID')}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
           </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
        <button onclick={state.onClose} class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors">
          Batal / Tutup
        </button>
        <button onclick={() => state.handleApply()} disabled={state.savingBrand} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
          {#if state.savingBrand}
            <svg class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Menyimpan...
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Terapkan sebagai Harga Jual
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
