<script lang="ts">
  import { CustomerListState } from '$lib/states/customers/customer.list.svelte';
  import CustomerListModal from '$lib/components/customers/CustomerListModal.svelte';
  import { roleCan } from '$lib/auth/capabilities';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const state = new CustomerListState(data, data.token);

  // R1.10-T2 — menjaga `data` di dalam state tetap yang terbaru. Tanpa ini,
  // invalidateAll() setelah menambah pelanggan menukar prop `data` halaman tapi
  // TIDAK salinan yang dipegang state, jadi tabelnya tetap daftar lama sampai
  // halaman dimuat ulang penuh — persis yang pemilik laporkan di uji-R1.9 B4.
  // Pola yang sama dengan `/tickets/[id]`, yang sudah membayar pelajaran ini
  // sejak H15.
  $effect(() => {
    state.data = data;
  });

  // R1.9-T1b — lihat komentar di `/customers/[id]`. Membuat pelanggan LANGSUNG
  // dengan hak tempo adalah pintu yang sama, jadi ditutup di tempat yang sama.
  let bolehUbahTempo = $derived(roleCan(data.user?.roleName, 'customer.allow_tempo'));
</script>

<svelte:head>
  <title>Customers | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6 max-w-6xl mx-auto">
  <div class="flex flex-wrap gap-3 justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-slate-900">Pelanggan</h1>
    <div class="flex flex-wrap items-center gap-2">
      <!-- Tahap-B — filter kategori pelanggan -->
      <select bind:value={state.typeFilter} aria-label="Filter kategori"
        class="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Semua Kategori</option>
        <option value="service">Pelanggan Servis</option>
        <option value="sparepart">Pelanggan Sparepart</option>
      </select>
      <button
        onclick={() => state.showModal = true}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
        Tambah Pelanggan
      </button>
    </div>
  </div>

  <!-- R1.10-T2 — pemilik (uji-R1.9 B4): "tidak ada toast untuk mengetahui
       apakah berhasil atau tidaknya penambahan pelanggan". Ditaruh di alur
       halaman (bukan melayang di atas tabel) supaya tidak menutupi baris yang
       baru saja ditambahkan — yang justru ingin dilihat pemakainya. -->
  {#if state.toast}
    <div
      data-testid="customer-toast"
      role="status"
      class="mb-4 px-4 py-3 rounded-lg text-sm font-medium border {state.toast.tone === 'ok'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-red-50 text-red-800 border-red-200'}"
    >{state.toast.text}</div>
  {/if}

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
   <div class="overflow-x-auto">
    <table class="w-full min-w-[560px] text-left text-sm">
      <thead class="bg-slate-50 text-slate-500 border-b border-gray-200">
        <tr>
          <th class="px-6 py-4 font-medium">Nama</th>
          <th class="px-6 py-4 font-medium">Kategori</th>
          <th class="px-6 py-4 font-medium">Telepon</th>
          <th class="px-6 py-4 font-medium">Email</th>
          <th class="px-6 py-4 font-medium text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each state.customers as customer}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 font-medium text-slate-900">{customer.name}</td>
            <td class="px-6 py-4">
              <span class="text-xs font-medium px-2 py-0.5 rounded {(customer.customerType || 'service') === 'sparepart' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}">
                {(customer.customerType || 'service') === 'sparepart' ? 'Sparepart' : 'Servis'}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-600">{customer.phone || '-'}</td>
            <td class="px-6 py-4 text-slate-600">{customer.email || '-'}</td>
            <td class="px-6 py-4 text-right">
              <a href={`/customers/${customer.id}`} class="text-blue-600 hover:text-blue-800 font-medium">
                Lihat &rarr;
              </a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="5" class="px-6 py-8 text-center text-slate-500">
              Belum ada pelanggan. Klik "Tambah Pelanggan" untuk menambah.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
   </div>
  </div>
</div>

<CustomerListModal {state} {bolehUbahTempo} />
