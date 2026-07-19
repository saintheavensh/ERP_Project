<script lang="ts">
  import type { OpnameState } from '$lib/states/opname.svelte';

  let { state } = $props<{ state: OpnameState }>();
</script>

{#if state.editableItems.length > 0}
  <div class="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
    <div class="max-w-5xl mx-auto flex justify-between items-center">
      <div class="text-sm text-slate-500 font-medium">
        Menampilkan {state.editableItems.length} produk yang belum diinisialisasi
      </div>
      <button 
        type="button" 
        onclick={() => state.submitOpname()} 
        disabled={state.loading}
        class="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {#if state.loading}
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Menyimpan...
        {:else}
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Simpan Data & Eksekusi Opname
        {/if}
      </button>
    </div>
  </div>
{/if}
