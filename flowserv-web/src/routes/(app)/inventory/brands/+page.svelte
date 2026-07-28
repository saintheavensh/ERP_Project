<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  let { data } = $props();
  let brands = $derived(data.brands || []);
  
  let showAddModal = $state(false);
  let form = $state({
    name: '',
    qualityGrade: 'OEM'
  });
  let loading = $state(false);
  let errorMsg = $state('');

  async function addBrand() {
    loading = true;
    errorMsg = '';
    
    try {
      const res = await fetch(`${API_BASE}/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(form)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to add brand');
      }
      
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  async function deleteBrand(id: string) {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/brands/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to delete brand');
      }
      
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }
</script>

<svelte:head>
  <title>Merek & Kualitas - FlowServ</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex flex-wrap items-center gap-4">
    <a href="/inventory" class="text-slate-500 hover:text-slate-800" aria-label="Back to inventory">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div class="flex-1 min-w-[200px]">
      <h1 class="text-2xl font-bold text-slate-900">Merek & Kualitas</h1>
      <p class="text-slate-500 mt-1">Define global part brands and their quality grades to be used across all suppliers.</p>
    </div>
    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors" onclick={() => showAddModal = true}>
      Merek Baru
    </button>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
   <div class="overflow-x-auto">
    <table class="w-full min-w-[500px] text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">Brand Name</th>
          <th class="p-4">Kualitas</th>
          <th class="p-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each brands as brand}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-medium text-slate-900">{brand.name}</td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                {brand.qualityGrade}
              </span>
            </td>
            <td class="p-4 text-right">
              <button class="text-red-500 hover:text-red-700 text-sm font-medium" onclick={() => deleteBrand(brand.id)}>Hapus</button>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="3" class="p-8 text-center text-slate-500">
              No brands found. Create your first brand (e.g. LifeFuture, Original, OEM).
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
   </div>
  </div>
</div>

{#if showAddModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Tambah Merek</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Close Modal" onclick={() => showAddModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <form onsubmit={(e) => { e.preventDefault(); addBrand(); }} class="p-6 space-y-4">
        {#if errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {errorMsg}
          </div>
        {/if}
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Brand Name *</label>
          <input id="name" type="text" bind:value={form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. LifeFuture, Suntec, Foxconn">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="grade">Kualitas</label>
          <input id="grade" type="text" bind:value={form.qualityGrade} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. Original, OEM, Grade A, Incell">
        </div>
        
        <div class="pt-4 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => showAddModal = false}>Batal</button>
          <button type="submit" disabled={loading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Brand'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
