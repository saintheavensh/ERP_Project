<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  let { data } = $props();
  let brands = $derived(data.brands || []);

  let showBrandModal = $state(false);
  let brandForm = $state({ name: '' });
  let brandLoading = $state(false);
  let brandError = $state('');

  async function addBrand() {
    brandLoading = true;
    brandError = '';
    try {
      const res = await fetch(`${API_BASE}/device-catalog/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify(brandForm),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menambah merk');
      window.location.reload();
    } catch (err: any) {
      brandError = err.message;
      brandLoading = false;
    }
  }

  // Model create/edit modal — shared form for both, key-value specs rows +
  // comma-separated suggested services (mirrors the legacy app's "Colors"
  // input pattern, without the fixed field list it used — this catalog's
  // specs are deliberately free-form key/value, not a rigid schema).
  let showModelModal = $state(false);
  let editingModelId = $state<string | null>(null);
  let modelForm = $state({
    deviceBrandId: '',
    name: '',
    imageUrl: '',
    specRows: [{ key: '', value: '' }] as Array<{ key: string; value: string }>,
    suggestedServicesText: '',
  });
  let modelLoading = $state(false);
  let modelError = $state('');

  function openNewModel(brandId: string) {
    editingModelId = null;
    modelForm = { deviceBrandId: brandId, name: '', imageUrl: '', specRows: [{ key: '', value: '' }], suggestedServicesText: '' };
    modelError = '';
    showModelModal = true;
  }

  function openEditModel(brandId: string, model: any) {
    editingModelId = model.id;
    const specs = model.specs || {};
    modelForm = {
      deviceBrandId: brandId,
      name: model.name,
      imageUrl: model.imageUrl || '',
      specRows: Object.keys(specs).length > 0 ? Object.entries(specs).map(([key, value]) => ({ key, value: String(value) })) : [{ key: '', value: '' }],
      suggestedServicesText: (model.suggestedServices || []).join(', '),
    };
    modelError = '';
    showModelModal = true;
  }

  function addSpecRow() {
    modelForm.specRows = [...modelForm.specRows, { key: '', value: '' }];
  }

  function removeSpecRow(index: number) {
    modelForm.specRows = modelForm.specRows.filter((_, i) => i !== index);
  }

  async function saveModel() {
    modelLoading = true;
    modelError = '';
    const specs: Record<string, string> = {};
    for (const row of modelForm.specRows) {
      if (row.key.trim()) specs[row.key.trim()] = row.value;
    }
    const suggestedServices = modelForm.suggestedServicesText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      name: modelForm.name,
      imageUrl: modelForm.imageUrl.trim() || null,
      specs: Object.keys(specs).length > 0 ? specs : null,
      suggestedServices: suggestedServices.length > 0 ? suggestedServices : null,
    };

    try {
      const url = editingModelId
        ? `${API_BASE}/device-catalog/models/${editingModelId}`
        : `${API_BASE}/device-catalog/models`;
      const res = await fetch(url, {
        method: editingModelId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify(editingModelId ? payload : { ...payload, deviceBrandId: modelForm.deviceBrandId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan model');
      window.location.reload();
    } catch (err: any) {
      modelError = err.message;
      modelLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Katalog Device - FlowServ</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex flex-wrap items-center gap-4">
    <a href="/inventory" class="text-slate-500 hover:text-slate-800" aria-label="Kembali ke inventory">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div class="flex-1 min-w-[200px]">
      <h1 class="text-2xl font-bold text-slate-900">Katalog Device</h1>
      <p class="text-slate-500 mt-1">Merk & model HP untuk kompatibilitas sparepart, dan (opsional) gambar/spesifikasi/saran servis yang tampil saat intake tiket.</p>
    </div>
    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors" onclick={() => { brandForm = { name: '' }; brandError = ''; showBrandModal = true; }}>
      Merk Baru
    </button>
  </div>

  <div class="space-y-4">
    {#each brands as brand (brand.id)}
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 class="font-semibold text-slate-900">{brand.name}</h2>
          <button class="text-sm text-blue-600 hover:text-blue-800 font-medium" onclick={() => openNewModel(brand.id)}>+ Model</button>
        </div>
        <div class="divide-y divide-slate-100">
          {#each brand.deviceModels || [] as model (model.id)}
            <div class="p-4 flex items-center gap-4">
              {#if model.imageUrl}
                <img src={model.imageUrl} alt="" class="w-10 h-10 object-cover rounded border border-slate-200 flex-shrink-0" />
              {:else}
                <div class="w-10 h-10 rounded border border-dashed border-slate-200 flex-shrink-0"></div>
              {/if}
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900">{model.name}</p>
                <p class="text-xs text-slate-500">
                  {model.specs ? `${Object.keys(model.specs).length} spesifikasi` : 'Belum ada spesifikasi'}
                  {#if model.suggestedServices?.length} · {model.suggestedServices.length} saran servis{/if}
                </p>
              </div>
              <button class="text-sm text-slate-500 hover:text-slate-800 font-medium" onclick={() => openEditModel(brand.id, model)}>Edit</button>
            </div>
          {:else}
            <p class="p-4 text-sm text-slate-500">Belum ada model untuk merk ini.</p>
          {/each}
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        Belum ada merk device. Buat merk pertama (mis. Samsung, Xiaomi, Oppo).
      </div>
    {/each}
  </div>
</div>

{#if showBrandModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Merk Device Baru</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => showBrandModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <form onsubmit={(e) => { e.preventDefault(); addBrand(); }} class="p-6 space-y-4">
        {#if brandError}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{brandError}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="brand-name">Nama Merk *</label>
          <input id="brand-name" type="text" bind:value={brandForm.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. Samsung">
        </div>
        <div class="pt-2 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => showBrandModal = false}>Batal</button>
          <button type="submit" disabled={brandLoading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {brandLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showModelModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h3 class="font-semibold text-lg text-slate-900">{editingModelId ? 'Edit Model' : 'Model Baru'}</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => showModelModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <form onsubmit={(e) => { e.preventDefault(); saveModel(); }} class="p-6 space-y-4 overflow-y-auto">
        {#if modelError}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{modelError}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="model-name">Nama Model *</label>
          <input id="model-name" type="text" bind:value={modelForm.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. Galaxy A10">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="model-image">URL Gambar (Opsional)</label>
          <input id="model-image" type="url" bind:value={modelForm.imageUrl} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...">
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="block text-sm font-medium text-slate-700">Spesifikasi (Opsional)</span>
            <button type="button" class="text-xs text-blue-600 hover:text-blue-800 font-medium" onclick={addSpecRow}>+ Baris</button>
          </div>
          <div class="space-y-2">
            {#each modelForm.specRows as row, i}
              <div class="flex gap-2">
                <input type="text" bind:value={row.key} placeholder="mis. RAM" class="w-1/3 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <input type="text" bind:value={row.value} placeholder="mis. 4 GB" class="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <button type="button" class="text-slate-400 hover:text-red-600 px-1" aria-label="Hapus baris" onclick={() => removeSpecRow(i)}>&times;</button>
              </div>
            {/each}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="model-services">Saran Servis (Opsional, pisahkan koma)</label>
          <input id="model-services" type="text" bind:value={modelForm.suggestedServicesText} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. Ganti LCD, Ganti Baterai">
        </div>
        <div class="pt-2 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => showModelModal = false}>Batal</button>
          <button type="submit" disabled={modelLoading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {modelLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
