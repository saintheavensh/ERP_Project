<script lang="ts">
  let { item, token, allModels } = $props<{ item: any, token: string, allModels: any[] }>();

  let isEditingCompat = $state(false);
  let resolvedIds = $state<string[]>([]);
  let unresolved = $state<string[]>([]);
  let saving = $state(false);
  let successMsg = $state('');

  $effect(() => {
    if (item && !isEditingCompat) {
      resolvedIds = item.compatibility?.map((c: any) => c.deviceModel.id) || [];
      unresolved = [...(item.unresolvedCompatibility || [])];
    }
  });

  function startEdit() {
    isEditingCompat = true;
  }

  function cancelEdit() {
    isEditingCompat = false;
    resolvedIds = item.compatibility?.map((c: any) => c.deviceModel.id) || [];
    unresolved = [...(item.unresolvedCompatibility || [])];
  }
  
  function removeUnresolved(index: number) {
    unresolved = unresolved.filter((_, i) => i !== index);
  }

  async function saveCompatibility() {
    saving = true;
    try {
      const res = await fetch(`http://localhost:3001/v1/inventory/${item.id}/compatibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resolvedModelIds: resolvedIds,
          unresolvedCompatibility: unresolved
        })
      });
      
      if (res.ok) {
        successMsg = 'Kompatibilitas berhasil diperbarui.';
        isEditingCompat = false;
        
        // Optimistic UI update for now
        // A full refresh would be better but let's just show success
        setTimeout(() => {
          successMsg = '';
          window.location.reload(); // Hard reload for simplicity in this MVP
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      saving = false;
    }
  }
</script>

{#if successMsg}
  <div class="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 mb-6">
    {successMsg}
  </div>
{/if}

<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
  <div class="flex justify-between items-center mb-6">
    <h3 class="font-bold text-slate-900 text-lg">Kompatibilitas Device</h3>
    {#if !isEditingCompat}
      <button onclick={startEdit} class="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
        Edit Kompatibilitas
      </button>
    {:else}
      <div class="flex gap-2">
        <button onclick={cancelEdit} class="text-slate-600 hover:text-slate-800 text-sm font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Batal
        </button>
        <button onclick={saveCompatibility} disabled={saving} class="text-white text-sm font-medium px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
          Simpan Perubahan
        </button>
      </div>
    {/if}
  </div>

  <!-- Unresolved Warnings (Hanya saat edit) -->
  {#if (unresolved && unresolved.length > 0) && isEditingCompat}
    <div class="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <div class="flex items-start">
        <svg class="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <div class="w-full">
          <h4 class="text-sm font-bold text-amber-800">Gagal Deteksi Otomatis</h4>
          <p class="text-xs text-amber-700 mt-1 mb-3">Teks di bawah ini gagal dicocokkan dengan database Model HP. Silakan cari model yang benar, lalu hapus peringatan ini.</p>
          
          <div class="flex flex-wrap gap-2">
            {#each unresolved as un, i}
              <div class="inline-flex items-center px-3 py-1 bg-white border border-amber-300 rounded text-sm text-amber-800 font-medium shadow-sm">
                {un}
                <button onclick={() => removeUnresolved(i)} class="ml-2 text-amber-500 hover:text-red-500 focus:outline-none" aria-label="Hapus peringatan ini">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- List / Edit Area -->
  <div>
    <h4 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Status Kompatibilitas Model:</h4>
    
    {#if isEditingCompat}
      <p class="text-xs text-slate-500 mb-2">Tahan tombol CTRL/CMD untuk memilih lebih dari satu.</p>
      <select multiple bind:value={resolvedIds} class="w-full p-2 border border-slate-200 rounded-lg text-sm h-64 focus:ring-2 focus:ring-blue-500 outline-none">
        {#each allModels as model}
          <option value={model.id}>{model.deviceBrand?.name || ''} {model.name}</option>
        {/each}
      </select>
    {:else}
      <ul class="space-y-2">
        {#if item.compatibility && item.compatibility.length > 0}
          {#each item.compatibility as comp}
            <li class="flex items-center text-sm text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
              <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              {comp.deviceModel?.deviceBrand?.name || ''} {comp.deviceModel?.name}
              <span class="ml-auto text-xs text-slate-500 italic">Perangkat terhubung</span>
            </li>
          {/each}
        {/if}
        
        {#if item.unresolvedCompatibility && item.unresolvedCompatibility.length > 0}
          {#each item.unresolvedCompatibility as un}
            <li class="flex items-center text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <svg class="w-5 h-5 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              {un}
              <span class="ml-auto text-xs text-amber-600 font-medium italic">Belum terhubung / tersedia</span>
            </li>
          {/each}
        {/if}

        {#if (!item.compatibility || item.compatibility.length === 0) && (!item.unresolvedCompatibility || item.unresolvedCompatibility.length === 0)}
          <p class="text-sm text-slate-500 italic">Belum ada perangkat yang terdaftar.</p>
        {/if}
      </ul>
    {/if}
  </div>
</div>
