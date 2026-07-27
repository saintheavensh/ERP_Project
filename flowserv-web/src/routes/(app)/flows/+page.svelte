<script lang="ts">
  import { goto } from '$app/navigation';
  import { API_BASE } from '$lib/api/config';

  let { data } = $props();
  let flows = $derived(data.flows);

  // Tombol "Buat Alur" sebelumnya tidak melakukan apa-apa. Endpoint POST /v1/flows
  // sudah ada sejak Phase 7.1, jadi tombolnya dihubungkan alih-alih dibiarkan
  // tampak berfungsi padahal tidak (pelajaran Track F).
  let creating = $state(false);
  let showModal = $state(false);
  let newName = $state('');
  let errorMsg = $state('');

  async function create() {
    if (!newName.trim()) return;
    creating = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ name: newName.trim(), domain: 'service' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Gagal membuat alur');
      await goto(`/flows/${body.data.id}`);
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      creating = false;
    }
  }
</script>

<svelte:head>
  <title>Alur Servis | FlowServ</title>
</svelte:head>

<div class="p-4 md:p-6">
  <div class="flex flex-wrap justify-between items-start gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Alur Servis</h1>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">
        Alur menentukan tahap yang dilalui setiap tiket servis dan apa yang boleh
        dikerjakan di tiap tahap. Buka salah satu untuk melihat diagramnya dan mengatur
        tahap tambahan seperti QC.
      </p>
    </div>
    <button onclick={() => (showModal = true)}
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
      Buat Alur
    </button>
  </div>

  {#if errorMsg}
    <div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{errorMsg}</div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each flows as flow (flow.id)}
      <a href={`/flows/${flow.id}`} class="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all" data-testid="flow-card">
        <div class="flex justify-between items-start mb-4 gap-2">
          <div class="min-w-0">
            <span class="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded uppercase tracking-wider mb-2">
              {flow.domain}
            </span>
            <h3 class="font-bold text-lg text-slate-900">{flow.name}</h3>
          </div>
          {#if flow.isDefault}
            <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full shrink-0">Dipakai tiket baru</span>
          {/if}
        </div>

        <div class="text-sm text-slate-500 mb-4">Versi {flow.version}</div>

        <div class="text-blue-600 text-sm font-medium flex items-center">
          Buka diagram &amp; atur
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </a>
    {:else}
      <div class="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-gray-300">
        Belum ada alur servis.
      </div>
    {/each}
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-sm p-5 space-y-4">
      <h2 class="font-bold text-lg text-slate-900">Buat Alur Baru</h2>
      <div>
        <label for="flow-name" class="block text-xs font-medium text-slate-600 mb-1">Nama alur</label>
        <input id="flow-name" bind:value={newName} placeholder="mis. Servis Garansi"
          class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <p class="text-xs text-slate-500 mt-1">
          Alur baru dimulai kosong dan belum dipakai tiket mana pun sampai dijadikan default.
        </p>
      </div>
      <div class="flex justify-end gap-2">
        <button onclick={() => (showModal = false)} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Batal</button>
        <button onclick={create} disabled={creating || !newName.trim()}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
          {creating ? 'Membuat...' : 'Buat'}
        </button>
      </div>
    </div>
  </div>
{/if}
