<script lang="ts">
  let { pos } = $props<{ pos: any }>();
</script>

{#if pos.showDraftsModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 class="text-xl font-bold text-slate-800">Daftar Pesanan Draft</h2>
        <button aria-label="Tutup" onclick={() => pos.showDraftsModal = false} class="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        {#if pos.loadingDrafts}
          <div class="text-center py-8 text-slate-500">Memuat draft...</div>
        {:else if pos.drafts.length === 0}
          <div class="text-center py-12 text-slate-500">
            <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p>Belum ada pesanan draft tersimpan.</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each pos.drafts as draft}
              <div 
                role="button" 
                tabindex="0" 
                class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex justify-between items-center cursor-pointer group" 
                onclick={() => pos.loadDraft(draft)}
                onkeydown={(e) => e.key === 'Enter' && pos.loadDraft(draft)}
              >
                <div>
                  <h3 class="font-bold text-slate-800 flex items-center gap-2">
                    {draft.name}
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{draft.cartItems.length} item</span>
                  </h3>
                  <p class="text-sm text-slate-500 mt-1">Dibuat: {new Date(draft.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                    Lanjutkan Pembayaran
                  </button>
                  <button onclick={(e) => pos.deleteDraft(draft.id, e)} class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Permanen">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
