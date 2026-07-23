<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  let { data } = $props<{ data: any }>();

  // svelte-ignore state_referenced_locally
  let name = $state(data.company?.name ?? '');
  let loading = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');

  async function save() {
    loading = true;
    errorMsg = '';
    successMsg = '';
    try {
      const res = await fetch(`${API_BASE}/settings/company`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ name }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan');
      successMsg = 'Perubahan tersimpan.';
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-lg">
  <h2 class="font-semibold text-slate-800 mb-4">Profil Perusahaan</h2>

  {#if !data.company}
    <p class="text-sm text-slate-500">Gagal memuat profil perusahaan.</p>
  {:else}
    {#if errorMsg}
      <div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{errorMsg}</div>
    {/if}
    {#if successMsg}
      <div class="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{successMsg}</div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-4">
      <div>
        <label for="company-name" class="block text-sm font-medium text-slate-700 mb-1">Nama Perusahaan</label>
        <input
          id="company-name"
          type="text"
          bind:value={name}
          required
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="block text-xs text-slate-400 uppercase tracking-wide mb-0.5">Paket</span>
          <span class="text-slate-700 capitalize">{data.company.subscriptionTier}</span>
        </div>
        <div>
          <span class="block text-xs text-slate-400 uppercase tracking-wide mb-0.5">Status</span>
          <span class="text-slate-700 capitalize">{data.company.status}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  {/if}
</div>
