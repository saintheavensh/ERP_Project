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
  
  <!-- Customer Info -->
  <div>
    <h2 class="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b pb-2">
      <span class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">1</span>
      Customer Details
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="relative">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Customer Name *</label>
        <input id="name" type="text" bind:value={state.form.customerName} oninput={() => state.searchCustomer()} autocomplete="off" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Doe">
        
        {#if state.showDropdown && state.filteredCustomers.length > 0}
          <ul class="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {#each state.filteredCustomers as c}
              <li>
                <button type="button" class="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0" onclick={() => state.selectCustomer(c)}>
                  <div class="font-medium text-slate-900">{c.name}</div>
                  <div class="text-xs text-slate-500">{c.phone || 'No phone'}</div>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
        {#if state.form.customerId}
          <div class="text-xs text-green-600 mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Existing customer selected
          </div>
        {/if}
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="phone">Phone Number (Optional)</label>
        <input id="phone" type="tel" bind:value={state.form.customerPhone} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 {state.form.customerId ? 'bg-slate-50 text-slate-500' : ''}" placeholder="e.g. 08123456789" readonly={!!state.form.customerId}>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email Address (Optional)</label>
        <input id="email" type="email" bind:value={state.form.customerEmail} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 {state.form.customerId ? 'bg-slate-50 text-slate-500' : ''}" placeholder="john@example.com" readonly={!!state.form.customerId}>
      </div>
    </div>
  </div>

  <!-- Device Info -->
  <div>
    <h2 class="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b pb-2">
      <span class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">2</span>
      Device / Asset Information
    </h2>
    {#if state.form.assetId}
      <!-- F7 — arrived from a customer's device via "Create Ticket"; the device is
           fixed (assetId is sent as-is, no new asset is created on submit). -->
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div class="text-xs text-green-600 mb-2 flex items-center">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Existing device selected
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
          <label class="block text-sm font-medium text-slate-700 mb-1" for="type">Device Type *</label>
          <select id="type" bind:value={state.form.assetType} required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select Type...</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Laptop">Laptop</option>
            <option value="Tablet">Tablet</option>
            <option value="Smartwatch">Smartwatch</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="relative">
          <label class="block text-sm font-medium text-slate-700 mb-1" for="brand">Brand</label>
          <input id="brand" type="text" bind:value={state.form.assetBrand} oninput={() => state.searchBrand()} autocomplete="off" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Samsung">
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
          <label class="block text-sm font-medium text-slate-700 mb-1" for="model">Model</label>
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
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="sn">Serial Number / IMEI</label>
          <input id="sn" type="text" bind:value={state.form.assetSn} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="...">
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
    <!-- Tahap A — go-live gap Tier-1 #2. Optional; recorded now, given back at
         handover (QC Akhir). Shown for both new and pre-selected devices. -->
    <div class="mt-4">
      <span class="block text-sm font-medium text-slate-700 mb-1">Sandi / Pola (Opsional)</span>
      <PasscodeField value={state.form.devicePasscode} onchange={(v) => (state.form.devicePasscode = v)} id="passcode" />
      <p class="text-xs text-slate-500 mt-1">Pilih <strong>Pola</strong> lalu gambar polanya agar tercatat pasti (bukan "L terbalik"). Dikembalikan ke pelanggan saat serah-terima.</p>
    </div>
  </div>

  <!-- Service Details -->
  <div>
    <h2 class="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b pb-2">
      <span class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">3</span>
      Service Details
    </h2>
    <!-- Tahap A — go-live gap Tier-1 #3. Optional but encouraged: feeds the
         label/tanda-terima print documents ("kerusakan"). SVC-001 always
         named complaint capture as part of intake; no field for it existed
         until now. -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-slate-700 mb-1" for="complaint">Keluhan / Kerusakan</label>
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
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1" for="flow">Service Flow *</label>
      <select id="flow" bind:value={state.form.flowTemplateId} required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="">Select Service Workflow...</option>
        {#each state.templates as t}
          <option value={t.id}>{t.name}</option>
        {/each}
      </select>
      <p class="text-xs text-slate-500 mt-2">
        The selected workflow dictates the stages this ticket will go through (e.g. Diagnosis &rarr; Approval &rarr; Repair).
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
        Processing...
      {:else}
        Create Ticket
      {/if}
    </button>
  </div>

</form>
