<script lang="ts">
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<!-- Warning Modal -->
{#if state.showEditWarning}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
      <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Ubah Data Master?</h2>
      <p class="text-slate-600 mb-6">
        Perhatian: Anda akan mengubah data induk (Master Data) milik pelanggan ini. 
        Perubahan ini akan berdampak pada <strong>seluruh riwayat servis lama</strong> milik pelanggan. Pastikan data yang dimasukkan akurat.
      </p>
      <div class="flex justify-center gap-3">
        <button onclick={() => state.showEditWarning = false} class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">Batal</button>
        <button onclick={() => state.proceedToEdit()} class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors">Ya, Saya Mengerti</button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Form Modal -->
{#if state.showEditForm}
  <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-bold mb-4 text-slate-900">Ubah Data Pelanggan</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Name *</label>
          <input id="name" type="text" bind:value={state.editCustomerData.name} class="w-full px-4 py-2 border border-slate-200 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="phone">Phone (Optional)</label>
          <input id="phone" type="text" bind:value={state.editCustomerData.phone} class="w-full px-4 py-2 border border-slate-200 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email (Optional)</label>
          <input id="email" type="email" bind:value={state.editCustomerData.email} class="w-full px-4 py-2 border border-slate-200 rounded-lg">
        </div>
      </div>
      
      <div class="mt-6 flex justify-end gap-3">
        <button onclick={() => state.showEditForm = false} class="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg">Batal</button>
        <button onclick={() => state.saveCustomer()} disabled={state.loading || !state.editCustomerData.name} class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Simpan Perubahan</button>
      </div>
    </div>
  </div>
{/if}
