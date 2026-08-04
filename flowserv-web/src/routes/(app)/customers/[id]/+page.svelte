<script lang="ts">
  import { CustomerDetailState } from '$lib/states/customers/customer.detail.svelte';
  import CustomerAssetModal from '$lib/components/customers/CustomerAssetModal.svelte';
  import { roleCan } from '$lib/auth/capabilities';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new CustomerDetailState(data, data.token);

  // R1.9-T1b — kasir kini punya jalan ke halaman ini (T1), tapi memberi hak
  // utang bukan wewenangnya. Backend sudah menolaknya dengan 403; ini hanya
  // supaya tombolnya tidak dipampangkan sebagai kontrol yang hidup.
  let bolehUbahTempo = $derived(roleCan(data.user?.roleName, 'customer.allow_tempo'));
</script>

<svelte:head>
  <title>{state.customer ? state.customer.name : 'Customer Detail'} | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-6xl mx-auto">
  <div class="mb-6 flex flex-wrap items-center gap-4">
    <a href="/customers" class="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Back to customers">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">{state.customer?.name || 'Unknown Customer'}</h1>
      <p class="text-slate-500 text-sm">
        {state.customer?.phone || 'No Phone'} &bull; {state.customer?.email || 'No Email'}
      </p>
    </div>
    <!-- Tahap-B — kategori pelanggan (label lunak). Bisa diubah cepat di sini. -->
    <div class="flex items-center gap-2 md:ml-auto" data-testid="customer-type-control">
      <span class="text-xs font-medium px-2 py-1 rounded {(state.customer?.customerType || 'service') === 'sparepart' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}" data-testid="customer-type-badge">
        {(state.customer?.customerType || 'service') === 'sparepart' ? 'Pelanggan Sparepart' : 'Pelanggan Servis'}
      </span>
      <select
        aria-label="Ubah kategori pelanggan"
        value={state.customer?.customerType || 'service'}
        onchange={(e) => state.setCustomerType(e.currentTarget.value as 'service' | 'sparepart')}
        disabled={state.typeSaving}
        class="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white disabled:opacity-50 outline-none focus:ring-2 focus:ring-blue-500">
        <option value="service">Servis</option>
        <option value="sparepart">Sparepart</option>
      </select>
    </div>
  </div>

  <!-- D1 — izin tempo (utang) per pelanggan. Owner/manager bisa memberi/mencabut
       kapan pun; gerbang ini yang dicek saat checkout POS metode Tempo. -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8" data-testid="tempo-card">
    <div class="px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-3">
      <div>
        <h2 class="font-semibold text-slate-800">Pembayaran Tempo (Utang)</h2>
        <p class="text-sm mt-0.5">
          {#if state.customer?.allowTempo}
            <span class="inline-flex items-center gap-1 text-green-700 font-medium" data-testid="tempo-status">
              <span class="w-2 h-2 rounded-full bg-green-500"></span> Diizinkan
            </span>
          {:else}
            <span class="inline-flex items-center gap-1 text-slate-500 font-medium" data-testid="tempo-status">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span> Tidak diizinkan
            </span>
          {/if}
          <span class="text-slate-400 text-xs block mt-0.5">Menentukan apakah pelanggan ini boleh checkout dengan metode Tempo.</span>
        </p>
      </div>
      {#if bolehUbahTempo}
        <button
          onclick={() => state.setAllowTempo(!state.customer?.allowTempo)}
          disabled={state.tempoSaving}
          data-testid="tempo-toggle"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 {state.customer?.allowTempo ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-blue-600 hover:bg-blue-700 text-white'}">
          {state.tempoSaving ? 'Menyimpan…' : state.customer?.allowTempo ? 'Cabut izin tempo' : 'Izinkan tempo'}
        </button>
      {:else}
        <!-- Statusnya tetap TERLIHAT — kasir memang perlu tahu pelanggan ini
             boleh utang atau tidak sebelum menawarkan Tempo di kasir. Yang
             hilang hanya kemampuan mengubahnya. -->
        <span class="text-xs text-slate-400 border border-slate-200 rounded-lg px-3 py-2" data-testid="tempo-readonly">
          Hanya manajer/pemilik yang dapat mengubah ini.
        </span>
      {/if}
    </div>
    {#if state.errorMsg}
      <div class="px-4 sm:px-6 pb-3 text-sm text-red-600">{state.errorMsg}</div>
    {/if}
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
    <div class="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2 bg-slate-50">
      <h2 class="font-semibold text-lg text-slate-800">Registered Devices / Assets</h2>
      <button 
        onclick={() => state.showModal = true}
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
        Register Device
      </button>
    </div>
    
    <div class="divide-y divide-gray-100">
      {#each state.assets as asset}
        <div class="px-4 sm:px-6 py-4 hover:bg-slate-50 flex flex-wrap justify-between items-center gap-2">
          <div>
            <div class="font-medium text-slate-900 flex items-center gap-2">
              <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs uppercase tracking-wider border border-slate-200">{asset.assetType}</span>
              {asset.brand || 'Unknown Brand'} {asset.model || ''}
            </div>
            {#if asset.serialNumber}
              <div class="text-sm text-slate-500 mt-1 font-mono">SN: {asset.serialNumber}</div>
            {/if}
          </div>
          <a
            href="/tickets/intake?customerId={state.customer?.id}&assetId={asset.id}"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 px-3 py-1 rounded bg-blue-50"
          >
            Servis Unit Ini
          </a>
        </div>
      {:else}
        <div class="px-6 py-8 text-center text-slate-500">
          Belum ada unit terdaftar.
        </div>
      {/each}
    </div>
  </div>
</div>

<CustomerAssetModal {state} />
