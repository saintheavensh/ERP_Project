<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  let { data } = $props<{ data: any }>();
  let users = $derived(data.users || []);
  let roles = $derived(data.roles || []);
  let branches = $derived(data.branches || []);

  interface CreateForm { name: string; email: string; password: string; roleId: string; branchId: string; }
  const emptyForm = (): CreateForm => ({ name: '', email: '', password: '', roleId: roles[0]?.id ?? '', branchId: '' });

  let showAddModal = $state(false);
  let form = $state<CreateForm>(emptyForm());
  let loading = $state(false);
  let errorMsg = $state('');

  let editingId = $state<string | null>(null);
  let editStatus = $state<'active' | 'inactive'>('active');
  let editRoleId = $state('');
  let editLoading = $state(false);
  let editErrorMsg = $state('');

  async function addUser() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          roleId: form.roleId,
          branchId: form.branchId || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal membuat pengguna');
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  function openEdit(user: any) {
    editingId = user.id;
    editErrorMsg = '';
    editStatus = user.status === 'inactive' ? 'inactive' : 'active';
    editRoleId = user.roleId ?? roles[0]?.id ?? '';
  }

  async function saveEdit(user: any) {
    if (!editingId) return;
    editLoading = true;
    editErrorMsg = '';
    try {
      const body: Record<string, unknown> = {};
      if (editStatus !== user.status) body.status = editStatus;
      if (editRoleId !== user.roleId) body.roleId = editRoleId;

      if (Object.keys(body).length === 0) {
        editingId = null;
        return;
      }

      const res = await fetch(`${API_BASE}/users/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify(body),
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
    <p class="text-sm text-slate-500">Kelola pengguna dan peran mereka.</p>
    <button
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
      onclick={() => { form = emptyForm(); errorMsg = ''; showAddModal = true; }}
    >
      + Tambah Pengguna
    </button>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[640px] text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
            <th class="p-4">Nama</th>
            <th class="p-4">Email</th>
            <th class="p-4">Peran</th>
            <th class="p-4">Status</th>
            <th class="p-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each users as user (user.id)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-4 font-medium text-slate-900">{user.name}</td>
              <td class="p-4 text-slate-600">{user.email}</td>
              <td class="p-4 text-slate-600">{user.roleName || '-'}</td>
              <td class="p-4">
                <span class="text-xs font-medium px-2 py-1 rounded-full {user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}">
                  {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td class="p-4 text-right">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick={() => openEdit(user)}>Edit</button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="p-8 text-center text-slate-500">Belum ada pengguna.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

{#if showAddModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h3 class="font-semibold text-lg text-slate-900">Tambah Pengguna</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => showAddModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); addUser(); }} class="p-6 space-y-4 overflow-y-auto">
        {#if errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{errorMsg}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="user-name">Nama *</label>
          <input id="user-name" type="text" bind:value={form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="user-email">Email *</label>
          <input id="user-email" type="email" bind:value={form.email} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="user-password">Password *</label>
          <input id="user-password" type="password" bind:value={form.password} required minlength="6" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Minimal 6 karakter">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="user-role">Peran *</label>
          <select id="user-role" bind:value={form.roleId} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            {#each roles as role (role.id)}
              <option value={role.id}>{role.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="user-branch">Cabang (Opsional)</label>
          <select id="user-branch" bind:value={form.branchId} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="">Semua Cabang</option>
            {#each branches as branch (branch.id)}
              <option value={branch.id}>{branch.name}</option>
            {/each}
          </select>
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
  {@const user = users.find((u: any) => u.id === editingId)}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Edit Pengguna</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => editingId = null}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); saveEdit(user); }} class="p-6 space-y-4">
        {#if editErrorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{editErrorMsg}</div>
        {/if}
        <p class="text-sm text-slate-500">{user?.name} &bull; {user?.email}</p>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-user-status">Status</label>
          <select id="edit-user-status" bind:value={editStatus} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-user-role">Peran</label>
          <select id="edit-user-role" bind:value={editRoleId} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            {#each roles as role (role.id)}
              <option value={role.id}>{role.name}</option>
            {/each}
          </select>
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
