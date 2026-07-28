<script lang="ts">
  import { goto } from '$app/navigation';
  import FlowDiagram from '$lib/components/flow/FlowDiagram.svelte';
  import { FlowDiagramState, DOCUMENT_OPTIONS, STAGE_PRESETS } from '$lib/states/flow/flow.diagram.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const diagram = new FlowDiagramState(data.token, data.template, data.nodes, data.transitions, data.stageKinds);

  let confirmDelete = $state(false);

  async function remove() {
    if (await diagram.remove()) await goto('/flows');
    else confirmDelete = false; // alasan penolakan sudah tampil di banner merah
  }
</script>

<svelte:head><title>{data.template?.name ?? 'Alur'} | FlowServ</title></svelte:head>

<div class="p-4 md:p-6 space-y-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div class="min-w-0">
      <a href="/flows" class="text-sm text-slate-500 hover:text-slate-800">&larr; Semua Alur</a>
      <h1 class="text-2xl font-bold text-slate-900 mt-1">Alur Servis</h1>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">
        Diagram di bawah adalah urutan tahap yang dilalui setiap tiket servis. Tahap
        bertanda 🔒 adalah alur inti toko — urutannya terkunci. Yang bisa diatur:
        menyisipkan tahap tambahan (QC, tunggu sparepart) pada panah, dan mengatur isi
        tiap tahap seperti dokumen yang otomatis dicetak.
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if data.template}
        <button onclick={() => (confirmDelete = true)} disabled={diagram.saving}
          class="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg text-sm font-medium"
          data-testid="delete-flow">
          Hapus Alur
        </button>
      {/if}
      <button onclick={() => diagram.save()} disabled={diagram.saving}
        class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        data-testid="save-flow">
        {diagram.saving ? 'Menyimpan...' : 'Simpan Alur'}
      </button>
    </div>
  </div>

  <!-- Banner di luar percabangan di bawah: penolakan penghapusan (mis. alur
       masih dipakai tiket) harus terbaca juga pada alur yang belum punya tahap. -->
  {#if diagram.errorMsg}
    <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200" data-testid="flow-error">{diagram.errorMsg}</div>
  {/if}
  {#if diagram.successMsg}
    <div class="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200" data-testid="flow-saved">{diagram.successMsg}</div>
  {/if}

  {#if !data.template}
    <p class="text-slate-500">Alur tidak ditemukan.</p>
  {:else if diagram.nodes.length === 0}
    <!-- Alur tanpa tahap = tanpa panah = tak ada tempat menyisipkan apa pun.
         Alur baru kini selalu lahir dengan tulang punggungnya, jadi keadaan ini
         hanya mungkin pada alur lama; katakan apa adanya alih-alih menampilkan
         kanvas kosong yang tampak rusak. -->
    <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
      Alur ini belum punya tahap sama sekali, jadi belum bisa dipakai tiket mana pun.
      Buat alur baru dari halaman <a href="/flows" class="underline font-medium">Alur Servis</a> —
      alur baru sudah berisi tahap intinya — lalu hapus alur kosong ini.
    </div>
  {:else}
    {#if diagram.warnings.length > 0}
      <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="flow-warnings">
        <p class="text-sm font-medium text-amber-800 mb-1">Perlu diperbaiki sebelum alur ini bisa dipakai:</p>
        <ul class="list-disc list-inside text-sm text-amber-700 space-y-0.5">
          {#each diagram.warnings as w}<li>{w}</li>{/each}
        </ul>
      </div>
    {/if}

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <label for="tpl-name" class="block text-xs font-medium text-slate-600 mb-1">Nama alur</label>
      <input id="tpl-name" bind:value={diagram.templateName}
        class="w-full sm:w-96 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <!-- Palet tahap tambahan. Diseret ke tombol "+" pada panah; di layar sentuh
         tombol "+" itu sendiri yang diketuk (drag-and-drop HTML5 tidak ada di
         ponsel), jadi kedua jalur menuju tindakan yang sama. -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p class="text-xs font-medium text-slate-600 mb-2">
        Tahap tambahan — seret ke tanda <b>+</b> pada panah, atau ketuk tanda <b>+</b> lalu pilih.
      </p>
      <div class="flex flex-wrap gap-2" data-testid="flow-palette">
        {#each STAGE_PRESETS as preset (preset.id)}
          {@const armed = diagram.dragging?.kind === 'preset' && diagram.dragging.preset.id === preset.id}
          <!-- Sengaja <div role="button">, bukan <button>: seretan HTML5 asli
               tidak terpicu andal dari elemen <button> (tombol menangani
               mousedown-nya sendiri). Pola yang sama dipakai kartu papan Kanban
               P2, satu-satunya seretan lain di aplikasi ini. -->
          <div
            role="button"
            tabindex="0"
            draggable="true"
            ondragstart={(e) => {
              // Chromium membatalkan seretan yang dataTransfer-nya kosong, jadi
              // tanpa setData() peristiwa `drop` tak pernah terjadi. Pola yang
              // sama sudah dipakai papan Kanban P2.
              e.dataTransfer?.setData('text/plain', preset.id);
              diagram.dragging = { kind: 'preset', preset };
            }}
            ondragend={() => { diagram.dropTarget = null; }}
            onclick={() => (diagram.dragging = armed ? null : { kind: 'preset', preset })}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); diagram.dragging = armed ? null : { kind: 'preset', preset }; } }}
            class="px-3 py-1.5 text-sm rounded-lg border border-dashed cursor-grab select-none transition-colors
              {armed ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-blue-400 hover:text-blue-700'}"
            data-testid="palette-item"
          >
            + {preset.name}
          </div>
        {/each}
      </div>
      <!-- Selalu dirender (kosong saat menganggur), tidak `{#if}`: memunculkan
           baris ini saat seretan dimulai akan MENGGESER diagram ke bawah, dan
           sasaran jatuh ikut bergeser di bawah kursor yang sedang menyeret. -->
      <p class="text-xs text-blue-700 mt-2 min-h-4" aria-live="polite">
        {#if diagram.dragging?.kind === 'preset'}
          "{diagram.dragging.preset.name}" siap dipasang — ketuk tanda <b>+</b> pada panah tempat tahap ini harus berada.
        {/if}
      </p>
    </div>

    <FlowDiagram {diagram} />

    <!-- Panel pengaturan tahap terpilih -->
    {#if diagram.selected}
      {@const node = diagram.selected}
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4" data-testid="stage-panel">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <label for="stage-name" class="block text-xs font-medium text-slate-600 mb-1">Nama tahap</label>
            <input id="stage-name" bind:value={node.name}
              class="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onclick={() => (diagram.selectedKey = null)} class="text-sm text-slate-500 hover:text-slate-800">Tutup</button>
        </div>

        {#if node.isCore}
          <p class="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2">
            🔒 Tahap inti. Posisinya di alur tidak bisa diubah, tapi isinya — keterangan,
            kapabilitas, dan dokumen cetak — bebas diatur.
          </p>
        {/if}

        <div>
          <label for="stage-desc" class="block text-xs font-medium text-slate-600 mb-1">
            Keterangan tahap — ditampilkan ke staf di halaman tiket
          </label>
          <textarea id="stage-desc" bind:value={node.description} rows="2"
            placeholder="mis. Teknisi memeriksa unit lalu mengisi diagnosa dan estimasi biaya."
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <!--
          S5 — SATU pilihan menggantikan tiga sakelar.

          Tiga sakelar bebas berarti 8 kombinasi per tahap; alur 6 tahap =
          ~260.000 bentuk, hampir semuanya tak pernah diuji. Saat data yang ada
          diperiksa, cuma 5 kombinasi yang benar-benar dipakai — jadi kelimanya
          diberi nama. Pemakai memilih peran tahapnya ("ini tahap penagihan"),
          bukan menebak arti tiga sakelar teknis, dan tiap jenis punya tesnya.
        -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1" for="stage-kind">
            Jenis tahap
          </label>
          <select id="stage-kind" bind:value={node.stageKind} data-testid="stage-kind"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
            {#each diagram.stageKinds as opt (opt.kind)}
              <option value={opt.kind}>{opt.label}</option>
            {/each}
          </select>
          <p class="text-xs text-slate-500 mt-1" data-testid="stage-kind-hint">
            {diagram.stageKinds.find((o) => o.kind === node.stageKind)?.hint ?? ''}
          </p>
        </div>

        <fieldset data-testid="checklist-editor">
          <legend class="text-xs font-medium text-slate-600 mb-2">
            Daftar periksa di tahap ini ({node.checklistItems.length} item)
          </legend>
          <p class="text-xs text-slate-500 mb-2">
            Baris yang dicentang staf saat tiket ada di tahap ini. Dipakai untuk QC:
            hasilnya tersimpan di tiket lengkap dengan siapa dan kapan, sebagai bukti
            ke pelanggan. Menghapus baris di sini tidak menghapus bukti tiket lama.
          </p>
          <ul class="space-y-2">
            {#each node.checklistItems as item, i (item.id)}
              <li class="flex items-center gap-2" data-testid="checklist-item-row">
                <span class="text-xs text-slate-400 w-4 shrink-0">{i + 1}.</span>
                <input
                  bind:value={item.label}
                  aria-label="Item periksa {i + 1}"
                  placeholder="mis. Unit menyala dan bisa masuk menu"
                  class="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onclick={() => diagram.moveChecklistItem(node.key, i, -1)} disabled={i === 0}
                  class="w-9 h-9 shrink-0 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                  aria-label="Naikkan item {i + 1}">↑</button>
                <button onclick={() => diagram.moveChecklistItem(node.key, i, 1)} disabled={i === node.checklistItems.length - 1}
                  class="w-9 h-9 shrink-0 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                  aria-label="Turunkan item {i + 1}">↓</button>
                <button onclick={() => diagram.removeChecklistItem(node.key, item.id)}
                  class="w-9 h-9 shrink-0 rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus item {i + 1}">✕</button>
              </li>
            {:else}
              <li class="text-sm text-slate-500">Belum ada item. Tahap ini tidak menampilkan daftar periksa di tiket.</li>
            {/each}
          </ul>
          <button onclick={() => diagram.addChecklistItem(node.key)}
            class="mt-2 px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            data-testid="add-checklist-item">
            + Tambah item periksa
          </button>
        </fieldset>

        <fieldset>
          <legend class="text-xs font-medium text-slate-600 mb-2">
            Dokumen yang otomatis dicetak saat masuk tahap ini
          </legend>
          <p class="text-xs text-slate-500 mb-2">
            Di sinilah "nota awal" diatur: matikan semuanya pada cabang yang ditunggu
            pelanggan, nyalakan pada cabang unit ditinggal.
          </p>
          <div class="space-y-2">
            {#each DOCUMENT_OPTIONS as doc (doc.value)}
              <label class="flex items-start gap-2 text-sm">
                <input type="checkbox" class="mt-1"
                  checked={node.autoPrintDocuments.includes(doc.value)}
                  onchange={() => diagram.toggleDocument(node.key, doc.value)} />
                <span>
                  <b>{doc.label}</b>
                  <span class="block text-xs text-slate-500">{doc.hint}</span>
                </span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if !node.isCore}
          <div class="pt-2 border-t border-slate-200">
            <button onclick={() => diagram.detach(node.key)}
              class="text-sm text-red-600 hover:text-red-800 font-medium">
              Lepas tahap ini dari alur
            </button>
            <p class="text-xs text-slate-500 mt-1">
              Alur akan menyambung langsung melewatinya. Tahap yang sudah pernah dilewati
              tiket tidak bisa dilepas — namanya boleh diganti.
            </p>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-sm text-slate-500">Klik sebuah tahap di diagram untuk mengatur isinya.</p>
    {/if}
  {/if}
</div>

{#if confirmDelete}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-sm p-5 space-y-4">
      <h2 class="font-bold text-lg text-slate-900">Hapus alur "{diagram.templateName}"?</h2>
      <p class="text-sm text-slate-600">
        Seluruh tahap dan perpindahannya ikut terhapus. Alur yang sedang dipakai tiket —
        atau yang tercatat di riwayat tiket — tidak akan bisa dihapus, dan penolakannya
        akan dijelaskan.
      </p>
      <div class="flex justify-end gap-2">
        <button onclick={() => (confirmDelete = false)} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Batal</button>
        <button onclick={remove} disabled={diagram.saving}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          data-testid="confirm-delete-flow">
          {diagram.saving ? 'Menghapus...' : 'Hapus'}
        </button>
      </div>
    </div>
  </div>
{/if}
