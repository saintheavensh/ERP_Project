<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  let { data } = $props<{ data: any }>();
  let branches = $derived(data.branches || []);

  interface BranchForm { name: string; address: string; }
  const emptyForm = (): BranchForm => ({ name: '', address: '' });

  let showAddModal = $state(false);
  let form = $state<BranchForm>(emptyForm());
  let loading = $state(false);
  let errorMsg = $state('');

  let editingId = $state<string | null>(null);
  let editForm = $state<BranchForm>(emptyForm());
  let editLoading = $state(false);
  let editErrorMsg = $state('');

  async function addBranch() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ name: form.name, address: form.address || undefined }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menambah cabang');
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  function openEdit(branch: any) {
    editingId = branch.id;
    editErrorMsg = '';
    editForm = { name: branch.name ?? '', address: branch.address ?? '' };
  }

  async function saveEdit() {
    if (!editingId) return;
    editLoading = true;
    editErrorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/branches/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ name: editForm.name, address: editForm.address || null }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan perubahan');
      window.location.reload();
    } catch (err: any) {
      editErrorMsg = err.message;
      editLoading = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm text-slate-500">Kelola cabang untuk tenant ini.</p>
    <button
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
      onclick={() => { form = emptyForm(); errorMsg = ''; showAddModal = true; }}
    >
      + Tambah Cabang
    </button>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[560px] text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
            <th class="p-4">Nama Cabang</th>
            <th class="p-4">Alamat</th>
            <th class="p-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each branches as branch (branch.id)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-4 font-medium text-slate-900">{branch.name}</td>
              <td class="p-4 text-slate-600">{branch.address || '-'}</td>
              <td class="p-4 text-right">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick={() => openEdit(branch)}>Ubah</button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="3" class="p-8 text-center text-slate-500">Belum ada cabang.</td>
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
        <h3 class="font-semibold text-lg text-slate-900">Tambah Cabang</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => showAddModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); addBranch(); }} class="p-6 space-y-4">
        {#if errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{errorMsg}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="branch-name">Nama Cabang *</label>
          <input id="branch-name" type="text" bind:value={form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. Cabang Semarang">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="branch-address">Alamat (Opsional)</label>
          <textarea id="branch-address" bind:value={form.address} rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
        </div>
        <div class="pt-2 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => showAddModal = false}>Batal</button>
          <button type="submit" disabled={loading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if editingId}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Ubah Cabang</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => editingId = null}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); saveEdit(); }} class="p-6 space-y-4">
        {#if editErrorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{editErrorMsg}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-branch-name">Nama Cabang *</label>
          <input id="edit-branch-name" type="text" bind:value={editForm.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-branch-address">Alamat (Opsional)</label>
          <textarea id="edit-branch-address" bind:value={editForm.address} rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
        </div>
        <div class="pt-2 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => editingId = null}>Batal</button>
          <button type="submit" disabled={editLoading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
