<script lang="ts">
  let { data } = $props();
  let tickets = $derived(data.tickets);
  let unassigned = $derived(data.unassigned ?? []);
  let isTechnician = $derived(data.isTechnician === true);
</script>

<svelte:head>
  <title>{isTechnician ? 'Pekerjaan Saya' : 'Servis'} | FlowServ</title>
</svelte:head>

<!-- R1 — satu tabel, dipakai dua kali. Dibuat snippet supaya kelompok
     "Menunggu Diambil" tak pernah bisa berbeda bentuk dari "Pekerjaan Saya". -->
{#snippet ticketTable(rows: any[], emptyTitle: string, emptyHint: string)}
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
   <div class="overflow-x-auto">
    <table class="w-full min-w-[720px] text-left text-sm">
      <thead class="bg-slate-50 text-slate-500 border-b border-gray-200">
        <tr>
          <th class="px-6 py-4 font-medium">Pelanggan &amp; Unit</th>
          <th class="px-6 py-4 font-medium">Alur Servis</th>
          <th class="px-6 py-4 font-medium">Tahap Sekarang</th>
          <th class="px-6 py-4 font-medium">Status</th>
          <th class="px-6 py-4 font-medium">Tanggal</th>
          <th class="px-6 py-4 font-medium text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each rows as ticket}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4">
              <div class="font-medium text-slate-900">{ticket.customerName}</div>
              <div class="text-slate-500 text-xs mt-0.5">{ticket.assetType} - {ticket.brand || ''} {ticket.model || ''}</div>
            </td>
            <td class="px-6 py-4 text-slate-700">{ticket.flowTemplateName}</td>
            <td class="px-6 py-4">
              <span class="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium text-xs">
                {ticket.nodeName || 'Belum ada tahap'}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class={`inline-block px-2.5 py-1 rounded text-xs font-medium capitalize ${
                ticket.status === 'open' ? 'bg-green-50 text-green-700 border border-green-200' :
                ticket.status === 'closed' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {ticket.status}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-500">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 text-right">
              <a href={`/tickets/${ticket.id}`} class="text-blue-600 hover:text-blue-800 font-medium">
                Buka &rarr;
              </a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-slate-500">
              <svg class="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
              <div class="text-lg font-medium text-slate-900 mb-1">{emptyTitle}</div>
              <p>{emptyHint}</p>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
   </div>
  </div>
{/snippet}

<div class="p-4 md:p-6 max-w-6xl mx-auto">
  <div class="flex flex-wrap gap-3 justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-slate-900">{isTechnician ? 'Pekerjaan Saya' : 'Servis'}</h1>
    <div class="flex items-center gap-2">
      <a href="/tickets/board"
        class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
        Papan Tahap
      </a>
      <!-- R1.5B — teknisi tidak lagi punya `ticket.create`, jadi tombol ini
           akan menghasilkan 403 baginya. Tombol yang kelihatan hidup tapi mati
           adalah anti-pattern yang Track F ada untuk membasminya. -->
      {#if !isTechnician}
        <a href="/tickets/intake"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Terima Unit
        </a>
      {/if}
    </div>
  </div>

  {#if isTechnician}
    <!-- R1 — dua kelompok. Antrian ditaruh DI ATAS "Pekerjaan Saya" secara
         sengaja: pekerjaan yang menunggu diambil adalah hal pertama yang perlu
         dilihat teknisi saat membuka halaman ini, bukan yang sudah dipegang. -->
    <section class="mb-8">
      <div class="flex items-center gap-2 mb-3">
        <h2 class="font-semibold text-slate-800">Menunggu Diambil</h2>
        {#if unassigned.length > 0}
          <span
            class="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold"
            data-testid="unassigned-count"
          >
            {unassigned.length}
          </span>
        {/if}
      </div>
      <p class="text-sm text-slate-500 mb-3">
        Tiket yang belum dipegang teknisi mana pun. Buka salah satu, lalu klik
        <b>Ambil Pekerjaan</b>.
      </p>
      <div data-testid="unassigned-list">
        {@render ticketTable(
          unassigned,
          'Tidak ada pekerjaan yang menunggu.',
          'Semua tiket yang terbuka sudah ada teknisinya.'
        )}
      </div>
    </section>

    <!-- Judulnya sengaja BUKAN "Pekerjaan Saya" lagi: itu sudah jadi judul
         halaman (h1) untuk teknisi, jadi dua kalimat sama di satu layar. Tes
         yang menabraknya (strict mode) menemukan hal yang juga membingungkan
         pemakai. "Sedang Saya Kerjakan" juga berpasangan lebih jelas dengan
         "Menunggu Diambil" di atasnya. -->
    <section>
      <h2 class="font-semibold text-slate-800 mb-3">Sedang Saya Kerjakan</h2>
      <div data-testid="my-jobs-list">
        {@render ticketTable(
          tickets,
          'Belum ada pekerjaan yang Anda pegang.',
          'Ambil satu dari daftar "Menunggu Diambil" di atas.'
        )}
      </div>
    </section>
  {:else}
    {@render ticketTable(
      tickets,
      'Belum ada servis.',
      'Klik "Terima Unit" untuk membuat tiket servis pertama.'
    )}
  {/if}
</div>
