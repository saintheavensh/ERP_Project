<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  let { data } = $props<{ data: any }>();
  let methods = $derived(data.paymentMethods || []);

  // `type` is the finite category the POS/checkout keys off; `name` is the
  // brand shown to the cashier. Several methods may share a type (Dana/OVO/
  // GoPay are all 'ewallet') — the POS radio binds on id, so that's safe.
  const TYPES: { value: string; label: string }[] = [
    { value: 'cash', label: 'Tunai (Cash)' },
    { value: 'transfer', label: 'Transfer Bank' },
    { value: 'qris', label: 'QRIS' },
    { value: 'ewallet', label: 'E-Wallet (Dana/OVO/GoPay)' },
    { value: 'tempo', label: 'Tempo (Kredit)' },
  ];
  const typeLabel = (t: string) => TYPES.find((x) => x.value === t)?.label ?? t;

  interface MethodForm { name: string; type: string; isActive: boolean; }
  const emptyForm = (): MethodForm => ({ name: '', type: 'cash', isActive: true });

  let showAddModal = $state(false);
  let form = $state<MethodForm>(emptyForm());
  let loading = $state(false);
  let errorMsg = $state('');

  let editingId = $state<string | null>(null);
  let editForm = $state<MethodForm>(emptyForm());
  let editLoading = $state(false);
  let editErrorMsg = $state('');

  async function addMethod() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/settings/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ name: form.name, type: form.type, isActive: form.isActive }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menambah metode pembayaran');
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  function openEdit(method: any) {
    editingId = method.id;
    editErrorMsg = '';
    editForm = { name: method.name ?? '', type: method.type ?? 'cash', isActive: !!method.isActive };
  }

  async function saveEdit() {
    if (!editingId) return;
    editLoading = true;
    editErrorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/settings/payment-methods/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ name: editForm.name, type: editForm.type, isActive: editForm.isActive }),
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
    <p class="text-sm text-slate-500">Kelola metode pembayaran yang muncul di kasir (POS).</p>
    <button
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
      onclick={() => { form = emptyForm(); errorMsg = ''; showAddModal = true; }}
    >
      + Tambah Metode
    </button>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[480px] text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
            <th class="p-4">Nama</th>
            <th class="p-4">Tipe</th>
            <th class="p-4">Status</th>
            <th class="p-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each methods as method (method.id)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-4 font-medium text-slate-900">{method.name}</td>
              <td class="p-4 text-slate-600">{typeLabel(method.type)}</td>
              <td class="p-4">
                <span class="text-xs font-medium px-2 py-1 rounded-full {method.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}">
                  {method.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td class="p-4 text-right">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick={() => openEdit(method)}>Ubah</button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="4" class="p-8 text-center text-slate-500">Belum ada metode pembayaran.</td>
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
        <h3 class="font-semibold text-lg text-slate-900">Tambah Metode Pembayaran</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => showAddModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); addMethod(); }} class="p-6 space-y-4">
        {#if errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{errorMsg}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="pm-name">Nama *</label>
          <input id="pm-name" type="text" bind:value={form.name} required maxlength="50" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. Dana, BCA, QRIS">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="pm-type">Tipe *</label>
          <select id="pm-type" bind:value={form.type} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            {#each TYPES as t}
              <option value={t.value}>{t.label}</option>
            {/each}
          </select>
          <p class="text-xs text-slate-500 mt-1">Tipe "Tempo" menandai transaksi belum lunas (utang pelanggan).</p>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" bind:checked={form.isActive} class="rounded border-slate-300">
          Aktif (tampil di kasir)
        </label>
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
        <h3 class="font-semibold text-lg text-slate-900">Ubah Metode Pembayaran</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => editingId = null}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); saveEdit(); }} class="p-6 space-y-4">
        {#if editErrorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{editErrorMsg}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-pm-name">Nama *</label>
          <input id="edit-pm-name" type="text" bind:value={editForm.name} required maxlength="50" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-pm-type">Tipe *</label>
          <select id="edit-pm-type" bind:value={editForm.type} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            {#each TYPES as t}
              <option value={t.value}>{t.label}</option>
            {/each}
          </select>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" bind:checked={editForm.isActive} class="rounded border-slate-300">
          Aktif (tampil di kasir)
        </label>
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
