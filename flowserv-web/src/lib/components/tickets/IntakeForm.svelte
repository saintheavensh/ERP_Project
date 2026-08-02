<script lang="ts">
  import type { TicketIntakeState } from '$lib/states/tickets/ticket.intake.svelte';
  import PasscodeField from './PasscodeField.svelte';

  let { state } = $props<{ state: TicketIntakeState }>();

  // Saran servis umum — menempel di bagian intake (Keluhan/Kerusakan), BUKAN di
  // katalog device (keputusan 2026-07-25). Daftar statis, mudah diedit; bisa
  // dijadikan konfigurasi per-tenant nanti bila diperlukan (fondasi dulu).
  const COMMON_SERVICE_SUGGESTIONS = [
    'Ganti LCD', 'Ganti Baterai', 'Ganti Konektor Cas', 'Mati Total',
    'Kena Air', 'Ganti Tombol Power', 'Ganti Speaker', 'Ganti Mic',
    'Ganti Kamera', 'Software / Flash Ulang', 'Lupa Pola/Sandi',
  ];
</script>

<form onsubmit={(e) => { e.preventDefault(); state.submitIntake(); }} class="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
  
  <!-- Pelanggan -->
  <div>
    <h2 class="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Pelanggan</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="relative">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Nama <span class="text-red-500">*</span></label>
        <input id="name" type="text" bind:value={state.form.customerName} oninput={() => state.searchCustomer()} autocomplete="off" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama pelanggan">
        
        {#if state.showDropdown && state.filteredCustomers.length > 0}
          <ul class="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {#each state.filteredCustomers as c}
              <li>
                <button type="button" class="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0" onclick={() => state.selectCustomer(c)}>
                  <div class="font-medium text-slate-900 flex items-center gap-2">
                    {c.name}
                    <!-- Tahap-B — pelanggan sparepart tetap muncul & bisa dipilih untuk servis. -->
                    {#if (c.customerType || 'service') === 'sparepart'}
                      <span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">Sparepart</span>
                    {/if}
                  </div>
                  <div class="text-xs text-slate-500">{c.phone || 'Tanpa nomor'}</div>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
        {#if state.form.customerId}
          <div class="text-xs text-green-600 mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Pelanggan lama dipilih
          </div>
        {/if}
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="phone">No. HP</label>
        <input id="phone" type="tel" bind:value={state.form.customerPhone} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 {state.form.customerId ? 'bg-slate-50 text-slate-500' : ''}" placeholder="08123456789" readonly={!!state.form.customerId}>
      </div>
    </div>
  </div>

  <!-- Unit -->
  <div>
    <h2 class="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Unit yang Diservis</h2>
    {#if state.form.assetId}
      <!-- F7 — arrived from a customer's device via "Create Ticket"; the device is
           fixed (assetId is sent as-is, no new asset is created on submit). -->
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div class="text-xs text-green-600 mb-2 flex items-center">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Unit lama dipilih
        </div>
        <div class="font-medium text-slate-900">
          <span class="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs uppercase tracking-wider">{state.form.assetType}</span>
          {state.form.assetBrand} {state.form.assetModel}
        </div>
        {#if state.form.assetSn}
          <div class="text-sm text-slate-500 mt-1 font-mono">SN: {state.form.assetSn}</div>
        {/if}
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="type">Jenis <span class="text-red-500">*</span></label>
          <select id="type" bind:value={state.form.assetType} required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Pilih Jenis...</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Laptop">Laptop</option>
            <option value="Tablet">Tablet</option>
            <option value="Smartwatch">Smartwatch</option>
            <option value="Other">Lainnya</option>
          </select>
        </div>
        <div class="relative">
          <label class="block text-sm font-medium text-slate-700 mb-1" for="brand">Merek <span class="text-red-500">*</span></label>
          <input id="brand" type="text" bind:value={state.form.assetBrand} oninput={() => state.searchBrand()} autocomplete="off" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="mis. Samsung">
          {#if state.showBrandDropdown && state.brandResults.length > 0}
            <ul class="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto" data-testid="brand-dropdown">
              {#each state.brandResults as b}
                <li>
                  <button type="button" class="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0" onclick={() => state.selectBrand(b)}>
                    <div class="font-medium text-slate-900">{b.name}</div>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
        <div class="relative">
          <label class="block text-sm font-medium text-slate-700 mb-1" for="model">Model / Tipe <span class="text-red-500">*</span></label>
          <input id="model" type="text" bind:value={state.form.assetModel} oninput={() => state.searchDeviceModel()} onfocus={() => state.searchDeviceModel()} autocomplete="off" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder={state.selectedBrandId ? 'Pilih / ketik model...' : 'e.g. Galaxy S23'}>

          {#if state.showDeviceDropdown && state.deviceModelResults.length > 0}
            <ul class="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {#each state.deviceModelResults as m}
                <li>
                  <button type="button" class="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0" onclick={() => state.selectDeviceModel(m)}>
                    <div class="font-medium text-slate-900">{m.brandName} {m.name}</div>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>

      <!-- Tahap A — device catalog match: spesifikasi (teks) saja untuk
           identifikasi unit. Cuma tampil kalau autocomplete di atas match ke
           katalog. Gambar & saran servis TIDAK di sini — saran servis pindah ke
           bagian intake (Keluhan/Kerusakan), tidak menempel ke device
           (keputusan 2026-07-25). -->
      {#if state.selectedDeviceModel && state.selectedDeviceModel.specs && Object.keys(state.selectedDeviceModel.specs).length > 0}
        <div class="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg" data-testid="device-catalog-preview">
          <dl class="text-xs grid grid-cols-2 gap-x-3 gap-y-0.5">
            {#each Object.entries(state.selectedDeviceModel.specs) as [key, value]}
              <div class="contents">
                <dt class="text-slate-400">{key}</dt>
                <dd class="text-slate-700">{value}</dd>
              </div>
            {/each}
          </dl>
        </div>
      {/if}
    {/if}

    <!--
      Tahap A gap Tier-1 #2 — sandi/pola TETAP terlihat, tidak dilipat.
      Pertimbangan S4 sempat memindahkannya ke bagian opsional dengan alasan
      "pad polanya memakan banyak ruang"; itu keliru. `PasscodeField` default-nya
      mode PIN — hanya dua tombol kecil + satu input, setinggi kolom biasa; pad
      pola baru muncul kalau ditekan "Pola". Dan untuk servis HP, teknisi hampir
      selalu perlu membuka unitnya, jadi ini bagian dari pekerjaan intake, bukan
      pelengkap.
    -->
    <div class="mt-4">
      <span class="block text-sm font-medium text-slate-700 mb-1">Sandi / Pola (opsional)</span>
      <PasscodeField value={state.form.devicePasscode} onchange={(v) => (state.form.devicePasscode = v)} id="passcode" />
      <p class="text-xs text-slate-500 mt-1">Pilih <strong>Pola</strong> lalu gambar polanya agar tercatat pasti (bukan "L terbalik"). Dikembalikan ke pelanggan saat serah-terima.</p>
    </div>

    <!--
      S4 (track penyederhanaan) — yang benar-benar jarang dipakai di meja depan:
      email pelanggan dan nomor seri/IMEI. Keduanya tetap tersimpan seperti
      sebelumnya; yang berubah hanya bahwa kasir tak lagi melewatinya untuk
      setiap unit yang masuk.
    -->
    <details class="mt-4 border border-slate-200 rounded-lg" data-testid="intake-optional">
      <summary class="px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-lg">
        Data tambahan (opsional) &mdash; email, nomor seri
      </summary>
      <div class="p-4 pt-2 space-y-4 border-t border-slate-100">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email pelanggan</label>
          <input id="email" type="email" bind:value={state.form.customerEmail}
            class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 {state.form.customerId ? 'bg-slate-50 text-slate-500' : ''}"
            placeholder="nama@email.com" readonly={!!state.form.customerId}>
        </div>
        {#if !state.form.assetId}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="sn">Nomor Seri / IMEI</label>
            <input id="sn" type="text" bind:value={state.form.assetSn}
              class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kosongkan bila tidak ada">
          </div>
        {/if}
      </div>
    </details>
  </div>

  <!-- Service Details -->
  <div>
    <h2 class="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Keluhan</h2>
    <!-- Tahap A — go-live gap Tier-1 #3. Feeds the label/tanda-terima print
         documents ("kerusakan"). SVC-001 always named complaint capture as
         part of intake; no field for it existed until now.
         R1.8-T1 — tidak lagi opsional (uji-R1.7 D1: "buat keluhan / kerusakan
         jadi kolom wajib di isi"). Ditegakkan di backend; tanda * di sini
         hanya memberi tahu lebih awal. -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-slate-700 mb-1" for="complaint">Keluhan / Kerusakan <span class="text-red-500">*</span></label>
      <textarea id="complaint" bind:value={state.form.reportedComplaint} rows="2" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="mis. LCD retak, tidak bisa charge"></textarea>
      <!-- Saran servis umum — klik untuk menambah ke Keluhan. Tidak bergantung
           pada device yang dipilih. -->
      <div class="flex flex-wrap gap-1.5 mt-2" data-testid="service-suggestions">
        {#each COMMON_SERVICE_SUGGESTIONS as service}
          <button type="button" class="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors" onclick={() => state.appendSuggestedService(service)}>
            + {service}
          </button>
        {/each}
      </div>
    </div>
    <!-- Tahap B — pemilih alur DIHAPUS dari intake (keputusan pemilik
         2026-07-27). Di toko, "ditunggu atau ditinggal" baru bisa diputuskan
         setelah teknisi mendiagnosis dan menyebut harga + lama pengerjaan —
         kasir tidak tahu jawabannya di titik ini, jadi memintanya di sini
         hanya memaksa menebak. Tiket memakai alur default toko, yang
         bercabang sendiri setelah tahap Diagnosis. -->
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <p class="text-sm text-slate-600">
        Tiket akan mengikuti <b class="text-slate-800">alur servis default toko</b>.
        Pilihan <b>Ditunggu</b> atau <b>Disimpan</b> ditentukan nanti — setelah teknisi
        mendiagnosis dan menyampaikan estimasi harga &amp; waktu ke pelanggan.
      </p>
    </div>
  </div>

  <!-- Submit -->
  <div class="pt-4 flex justify-end">
    <button 
      type="submit"
      disabled={state.loading}
      class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center">
      {#if state.loading}
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Menyimpan...
      {:else}
        Simpan &amp; Terima Unit
      {/if}
    </button>
  </div>

</form>
