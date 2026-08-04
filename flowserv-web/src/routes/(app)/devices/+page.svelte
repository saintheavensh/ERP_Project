<script lang="ts">
  import { API_BASE } from '$lib/api/config';
  import { resolveImageUrl } from '$lib/utils/image';
  import ImageUpload from '$lib/components/inventory/ImageUpload.svelte';
  import { cocokSemuaKata } from '$lib/devices/match-device';

  let { data } = $props();
  let brands = $derived(data.brands || []);
  // R1.8-T5 — unit yang pernah masuk lewat Terima Unit tapi tak cocok ke
  // katalog. Sengaja panel di halaman ini, BUKAN lonceng atau popup: ini
  // pekerjaan admin yang bisa ditunda, bukan kabar mendesak. Mengganggu kasir
  // yang sedang melayani antrean dengan ini justru bikin orang berhenti
  // mengisi merek dengan jujur — dan itu merusak T1 sekaligus.
  let uncatalogued = $derived(data.uncatalogued || []);

  // Katalog bisa berisi ribuan model (import dari xlsx). Jangan render semua —
  // default tampilkan sedikit per merk; ketik untuk mencari. Ini juga menjaga
  // halaman tetap ringan di HP.
  let deviceSearch = $state('');
  const MODELS_PREVIEW = 8;

  /**
   * R1.9-T3 — hasil pencarian jadi SATU daftar datar lintas merek.
   *
   * Sebelumnya kotak cari hanya menyaring DI DALAM tiap kartu merek, dan tiap
   * merek cuma menampilkan 8 model dari (di mesin ini) 1.784 — jadi mencari
   * "A10" berarti menggulir puluhan kartu untuk mencari kartu mana yang
   * kebetulan berisi hasilnya. Yang dicari orang adalah "model bernama X",
   * bukan "merek mana yang punya model bernama X".
   */
  let hasilCari = $derived.by(() => {
    if (deviceSearch.trim() === '') return [];
    const out: Array<{ brand: any; model: any }> = [];
    for (const brand of brands) {
      for (const model of brand.deviceModels || []) {
        // R1.10-T5 — dicocokkan PER KATA, bukan sebagai satu tulisan utuh.
        // Pemilik (uji-R1.9 D2): "samsung a20 tidak di temukan harus samsung
        // galaxy a20". Aturannya hidup di `lib/devices/match-device.ts` sebagai
        // fungsi murni bertes unit — salahnya tak memunculkan error apa pun,
        // cuma hasil yang keliru, jadi mata bukan alat yang tepat untuk
        // menjaganya.
        if (cocokSemuaKata(`${brand.name} ${model.name}`, deviceSearch)) out.push({ brand, model });
      }
    }
    return out;
  });

  function visibleModels(brand: any): { list: any[]; hidden: number } {
    const all = brand.deviceModels || [];
    return { list: all.slice(0, MODELS_PREVIEW), hidden: Math.max(0, all.length - MODELS_PREVIEW) };
  }

  let showBrandModal = $state(false);
  let editingBrandId = $state<string | null>(null);
  let brandForm = $state({ name: '' });
  let brandLoading = $state(false);
  let brandError = $state('');

  function openNewBrand() {
    editingBrandId = null;
    brandForm = { name: '' };
    brandError = '';
    showBrandModal = true;
  }

  function openEditBrand(brand: any) {
    editingBrandId = brand.id;
    brandForm = { name: brand.name };
    brandError = '';
    showBrandModal = true;
  }

  async function saveBrand() {
    brandLoading = true;
    brandError = '';
    try {
      const url = editingBrandId
        ? `${API_BASE}/device-catalog/brands/${editingBrandId}`
        : `${API_BASE}/device-catalog/brands`;
      const res = await fetch(url, {
        method: editingBrandId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify(brandForm),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan merk');
      window.location.reload();
    } catch (err: any) {
      brandError = err.message;
      brandLoading = false;
    }
  }

  // R1.9-T3 — hapus. Pesan 422 dari backend (DEVICE_MODEL_IN_USE /
  // DEVICE_BRAND_HAS_MODELS) ditampilkan apa adanya: ia sudah menyebut berapa
  // yang memakainya, jadi menggantinya dengan "gagal menghapus" justru membuang
  // satu-satunya informasi yang berguna.
  let hapusError = $state('');

  async function hapusModel(model: any) {
    if (!confirm(`Hapus model "${model.name}" dari katalog?`)) return;
    hapusError = '';
    try {
      const res = await fetch(`${API_BASE}/device-catalog/models/${model.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (res.status === 204) return window.location.reload();
      const result = await res.json();
      throw new Error(result.error?.message || 'Gagal menghapus model');
    } catch (err: any) {
      hapusError = err.message;
    }
  }

  async function hapusMerek(brand: any) {
    if (!confirm(`Hapus merek "${brand.name}" dari katalog?`)) return;
    hapusError = '';
    try {
      const res = await fetch(`${API_BASE}/device-catalog/brands/${brand.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (res.status === 204) return window.location.reload();
      const result = await res.json();
      throw new Error(result.error?.message || 'Gagal menghapus merek');
    } catch (err: any) {
      hapusError = err.message;
    }
  }

  /**
   * R1.9-T3 — "Tambahkan ke katalog" langsung dari panel "Belum ada di katalog".
   *
   * Tanpa ini panel R1.8-T5 tidak punya penutup: ia memampangkan nama merek dan
   * model yang persis harus dimasukkan, lalu menyuruh admin mengetiknya ulang
   * di dua modal terpisah. Mereknya dibuat lebih dulu bila belum ada — itu
   * sebabnya panel ini berisi baris tersebut sejak awal.
   */
  let menambahBaris = $state<string | null>(null);

  async function tambahkanKeKatalog(u: { brand: string; model: string }) {
    menambahBaris = `${u.brand}|${u.model}`;
    hapusError = '';
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` };

      // Cocokkan tanpa peduli huruf besar/kecil — persis aturan yang dipakai
      // GET /uncatalogued untuk memutuskan baris ini "belum ada". Kalau di sini
      // dipakai perbandingan persis, "samsung" akan membuat merek KEDUA di
      // sebelah "Samsung", dan barisnya tetap muncul di panel setelah ditambah.
      const adaMerek = brands.find(
        (b: any) => b.name.trim().toLowerCase() === u.brand.trim().toLowerCase(),
      );

      let brandId = adaMerek?.id;
      if (!brandId) {
        const resMerek = await fetch(`${API_BASE}/device-catalog/brands`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: u.brand.trim() }),
        });
        const hasilMerek = await resMerek.json();
        if (!resMerek.ok) throw new Error(hasilMerek.error?.message || 'Gagal membuat merek');
        brandId = hasilMerek.data.id;
      }

      const resModel = await fetch(`${API_BASE}/device-catalog/models`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ deviceBrandId: brandId, name: u.model.trim() }),
      });
      const hasilModel = await resModel.json();
      if (!resModel.ok) throw new Error(hasilModel.error?.message || 'Gagal membuat model');

      window.location.reload();
    } catch (err: any) {
      hapusError = err.message;
      menambahBaris = null;
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
  });
  let modelLoading = $state(false);
  let modelError = $state('');

  function openNewModel(brandId: string) {
    editingModelId = null;
    modelForm = { deviceBrandId: brandId, name: '', imageUrl: '', specRows: [{ key: '', value: '' }] };
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
    const payload = {
      name: modelForm.name,
      imageUrl: modelForm.imageUrl.trim() || null,
      specs: Object.keys(specs).length > 0 ? specs : null,
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
    <div class="flex-1 min-w-[200px]">
      <h1 class="text-2xl font-bold text-slate-900">Katalog Device</h1>
      <p class="text-slate-500 mt-1">Merk & model HP untuk kompatibilitas sparepart, dan (opsional) gambar/spesifikasi/saran servis yang tampil saat intake tiket.</p>
    </div>
    <input type="text" bind:value={deviceSearch} placeholder="Cari model (mis. A10, iPhone)..." data-testid="device-search" class="w-full sm:w-64 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors" onclick={openNewBrand}>
      Merk Baru
    </button>
  </div>

  {#if hapusError}
    <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100" data-testid="katalog-error">{hapusError}</div>
  {/if}

  {#if uncatalogued.length > 0}
    <div class="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden" data-testid="uncatalogued-panel">
      <div class="px-4 py-3 border-b border-amber-200">
        <h2 class="font-semibold text-amber-900">Belum ada di katalog ({uncatalogued.length})</h2>
        <p class="text-sm text-amber-800 mt-0.5">
          Unit ini pernah masuk lewat Terima Unit tapi mereknya belum terdaftar di katalog.
          Yang paling sering masuk ada di urutan atas — itu yang paling layak ditambahkan.
        </p>
      </div>
      <div class="divide-y divide-amber-200">
        {#each uncatalogued as u}
          <div class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2" data-testid="uncatalogued-row">
            <div class="min-w-0">
              <span class="font-medium text-slate-900">{u.brand} {u.model}</span>
              <span class="text-xs text-slate-500 ml-2">{u.assetType}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-amber-900 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                {u.jumlah}× masuk
              </span>
              <!-- R1.9-T3 — panelnya jadi bisa ditindaklanjuti, bukan cuma daftar. -->
              <button
                class="text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
                disabled={menambahBaris === `${u.brand}|${u.model}`}
                onclick={() => tambahkanKeKatalog(u)}
                data-testid="uncatalogued-tambah"
              >
                {menambahBaris === `${u.brand}|${u.model}` ? 'Menambahkan…' : 'Tambahkan ke katalog'}
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if deviceSearch.trim()}
    <!-- R1.9-T3 — hasil pencarian: SATU daftar datar lintas merek, bukan
         penyaringan di dalam puluhan kartu terpisah. -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-testid="hasil-cari">
      <div class="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold text-slate-900">Hasil pencarian "{deviceSearch.trim()}"</h2>
        <span class="text-xs text-slate-400">{hasilCari.length} model ditemukan</span>
      </div>
      <div class="divide-y divide-slate-100">
        {#each hasilCari.slice(0, 50) as hasil (hasil.model.id)}
          <div class="p-4 flex items-center gap-4" data-testid="hasil-cari-baris">
            {#if hasil.model.imageUrl}
              <img src={resolveImageUrl(hasil.model.imageUrl)} alt="" class="w-10 h-10 object-cover rounded border border-slate-200 flex-shrink-0" />
            {:else}
              <div class="w-10 h-10 rounded border border-dashed border-slate-200 flex-shrink-0"></div>
            {/if}
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900 truncate">{hasil.model.name}</p>
              <p class="text-xs text-slate-500">{hasil.brand.name}</p>
            </div>
            <button class="text-sm text-slate-500 hover:text-slate-800 font-medium" onclick={() => openEditModel(hasil.brand.id, hasil.model)}>Ubah</button>
            <button class="text-sm text-red-500 hover:text-red-700 font-medium" onclick={() => hapusModel(hasil.model)} data-testid="hapus-model">Hapus</button>
          </div>
        {:else}
          <p class="p-8 text-center text-sm text-slate-500">
            Tidak ada model yang cocok dengan "{deviceSearch.trim()}" di merek mana pun.
          </p>
        {/each}
        {#if hasilCari.length > 50}
          <p class="p-3 text-xs text-slate-400">…dan {hasilCari.length - 50} model lain. Persempit kata kuncinya.</p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      {#each brands as brand (brand.id)}
        {@const vm = visibleModels(brand)}
        {@const jumlahModel = (brand.deviceModels || []).length}
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-semibold text-slate-900">
              {brand.name}
              <span class="text-xs font-normal text-slate-400">
                {jumlahModel === 0 ? 'belum ada model' : `${jumlahModel} model`}
              </span>
            </h2>
            <div class="flex items-center gap-3">
              <button class="text-sm text-blue-600 hover:text-blue-800 font-medium" onclick={() => openNewModel(brand.id)}>+ Model</button>
              <button class="text-sm text-slate-500 hover:text-slate-800 font-medium" onclick={() => openEditBrand(brand)} data-testid="ubah-merek">Ubah</button>
              <button class="text-sm text-red-500 hover:text-red-700 font-medium" onclick={() => hapusMerek(brand)} data-testid="hapus-merek">Hapus</button>
            </div>
          </div>
          <div class="divide-y divide-slate-100">
            {#each vm.list as model (model.id)}
              <div class="p-4 flex items-center gap-4">
                {#if model.imageUrl}
                  <img src={resolveImageUrl(model.imageUrl)} alt="" class="w-10 h-10 object-cover rounded border border-slate-200 flex-shrink-0" />
                {:else}
                  <div class="w-10 h-10 rounded border border-dashed border-slate-200 flex-shrink-0"></div>
                {/if}
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900 truncate">{model.name}</p>
                  <p class="text-xs text-slate-500">
                    {model.specs ? `${Object.keys(model.specs).length} spesifikasi` : 'Belum ada spesifikasi'}
                  </p>
                </div>
                <button class="text-sm text-slate-500 hover:text-slate-800 font-medium" onclick={() => openEditModel(brand.id, model)}>Ubah</button>
                <button class="text-sm text-red-500 hover:text-red-700 font-medium" onclick={() => hapusModel(model)} data-testid="hapus-model">Hapus</button>
              </div>
            {:else}
              <p class="p-4 text-sm text-slate-500">Belum ada model untuk merk ini. Klik "+ Model" untuk menambah.</p>
            {/each}
            {#if vm.hidden > 0}
              <p class="p-3 text-xs text-slate-400">…dan {vm.hidden} model lain. Ketik di kotak cari di atas untuk menemukan.</p>
            {/if}
          </div>
        </div>
      {:else}
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
          Belum ada merk device. Buat merk pertama (mis. Samsung, Xiaomi, Oppo).
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showBrandModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">{editingBrandId ? 'Ubah Merk Device' : 'Merk Device Baru'}</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => showBrandModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <form onsubmit={(e) => { e.preventDefault(); saveBrand(); }} class="p-6 space-y-4">
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
          <span class="block text-sm font-medium text-slate-700 mb-1">Gambar (Opsional)</span>
          <ImageUpload bind:value={modelForm.imageUrl} token={data.token} folder="devices" />
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
