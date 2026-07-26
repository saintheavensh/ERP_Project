<script lang="ts">
  let { pos } = $props<{ pos: any }>();
</script>

{#if pos.checkout.showCheckoutModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-800">Pembayaran</h3>
        <button aria-label="Tutup" onclick={() => pos.checkout.showCheckoutModal = false} class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto">
        {#if pos.commonState.errorMsg}
          <div class="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {pos.commonState.errorMsg}
          </div>
        {/if}

        <div class="mb-6 pb-6 border-b border-dashed border-slate-200">
          <div class="text-center">
            <p class="text-sm text-slate-500 mb-1">Total Tagihan</p>
            <p class="text-3xl font-bold text-slate-900">{pos.formatRp(pos.cart.grandTotal)}</p>
          </div>
        </div>
        
        <div class="space-y-5">
          <!-- Customer Input -->
          <div>
            <label for="customerName" class="block text-sm font-medium text-slate-700 mb-2">
              Pelanggan {pos.checkout.selectedType === 'tempo' ? '(Wajib untuk Tempo)' : '(Opsional)'}
            </label>
            <div class="relative">
              <input
                id="customerName"
                type="text"
                bind:value={pos.checkout.customerNameInput}
                oninput={() => pos.checkout.searchCustomer()}
                autocomplete="off"
                placeholder="Cari nama pelanggan, atau kosongkan untuk walk-in..."
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
              {#if pos.checkout.showCustomerDropdown && pos.checkout.filteredCustomers.length > 0}
                <ul class="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {#each pos.checkout.filteredCustomers as c}
                    <li>
                      <button type="button" class="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0" onclick={() => pos.checkout.selectCustomer(c)}>
                        <div class="font-medium text-slate-900">{c.name}</div>
                        <div class="text-xs text-slate-500">{c.phone || 'Tanpa nomor telepon'}</div>
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
              {#if pos.checkout.selectedCustomerId}
                <div class="text-xs text-green-600 mt-1 flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  Pelanggan terdaftar dipilih
                </div>
              {/if}
            </div>
          </div>

          <!-- Payment Method -->
          <div>
            <span class="block text-sm font-medium text-slate-700 mb-2">Metode Pembayaran</span>
            <div class="grid grid-cols-2 gap-3">
              {#each pos.checkout.paymentMethods as pm}
                <label class="relative flex items-center justify-center p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors {pos.checkout.selectedMethodId === pm.id ? 'border-blue-500 bg-blue-50/50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 text-slate-600'}">
                  <input type="radio" name="payment" value={pm.id} bind:group={pos.checkout.selectedMethodId} class="sr-only">
                  <span class="text-sm font-medium">{pm.name}</span>
                </label>
              {/each}
              
              {#if pos.checkout.paymentMethods.length === 0}
                <p class="text-sm text-slate-500 col-span-2 text-center py-2">Tidak ada metode pembayaran aktif.</p>
              {/if}
            </div>
            {#if pos.checkout.selectedType === 'tempo'}
              <p class="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start">
                <svg class="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Pelanggan terdaftar WAJIB dipilih dari daftar saat memilih pembayaran tempo.
              </p>
            {/if}
          </div>
        </div>
      </div>
      
      <div class="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <button 
          onclick={() => pos.checkout.processCheckout()}
          disabled={pos.commonState.processing || (pos.checkout.selectedType === 'tempo' && !pos.checkout.selectedCustomerId)}
          class="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center"
        >
          {#if pos.commonState.processing}
            <svg class="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Memproses...
          {:else}
            Proses Transaksi
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
