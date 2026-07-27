<script lang="ts">
  import { FlowBuilderState, DOCUMENT_OPTIONS } from '$lib/states/flow/flow.builder.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const builder = new FlowBuilderState(data.token, data.design?.template, data.design?.nodes ?? [], data.design?.transitions ?? []);

  // Tahap yang sedang dibuka rinciannya. Satu per satu: menampilkan seluruh
  // pengaturan tiap tahap sekaligus membuat daftar 8 tahap jadi dinding teks
  // yang justru sulit dibaca — padahal tujuan halaman ini menghilangkan
  // tebak-tebakan.
  let expandedKey = $state<string | null>(null);
</script>

<svelte:head><title>Pengaturan Alur Servis | FlowServ</title></svelte:head>

<div class="p-4 md:p-6 max-w-5xl mx-auto">
  <div class="mb-6">
    <a href="/settings" class="text-sm text-slate-500 hover:text-slate-800">&larr; Setelan</a>
    <h1 class="text-2xl font-bold text-slate-900 mt-1">Alur Servis</h1>
    <p class="text-sm text-slate-500 mt-1">
      Alur ini menentukan tahap yang dilalui setiap tiket servis, dan apa yang boleh
      dikerjakan di tiap tahap. Mengubahnya di sini langsung mengubah cara aplikasi bekerja —
      tanpa perlu mengubah program.
    </p>
  </div>

  {#if data.templates.length > 1}
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <span class="text-sm text-slate-600">Alur:</span>
      {#each data.templates as t}
        <a
          href="/settings/flow?template={t.id}"
          class="px-3 py-1.5 text-sm rounded-lg border transition-colors {t.id === builder.templateId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
        >
          {t.name}{t.isDefault ? ' (default)' : ''}
        </a>
      {/each}
    </div>
  {/if}

  {#if !data.design}
    <p class="text-slate-500">Belum ada alur servis untuk toko ini.</p>
  {:else}
    {#if builder.errorMsg}
      <div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200" data-testid="flow-error">{builder.errorMsg}</div>
    {/if}
    {#if builder.successMsg}
      <div class="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200" data-testid="flow-saved">{builder.successMsg}</div>
    {/if}

    {#if builder.warnings.length > 0}
      <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="flow-warnings">
        <p class="text-sm font-medium text-amber-800 mb-1">Perlu diperbaiki sebelum alur ini bisa dipakai:</p>
        <ul class="list-disc list-inside text-sm text-amber-700 space-y-0.5">
          {#each builder.warnings as w}<li>{w}</li>{/each}
        </ul>
      </div>
    {/if}

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-4">
      <label for="tpl-name" class="block text-xs font-medium text-slate-600 mb-1">Nama alur</label>
      <input id="tpl-name" bind:value={builder.templateName}
        class="w-full sm:w-96 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <p class="text-xs text-slate-500 mb-2">
      Seret tahap untuk mengubah urutannya, atau pakai tombol panah di layar sentuh.
    </p>

    <ol class="space-y-3" data-testid="flow-stages">
      {#each builder.nodes as node, index (node.key)}
        <li
          draggable="true"
          ondragstart={() => builder.startDrag(index)}
          ondragover={(e) => e.preventDefault()}
          ondrop={(e) => { e.preventDefault(); builder.dropOn(index); }}
          ondragend={() => builder.endDrag()}
          class="bg-white rounded-xl border shadow-sm transition-colors {builder.draggingIndex === index ? 'border-blue-400 opacity-60' : 'border-slate-200'}"
          data-testid="flow-stage"
        >
          <div class="p-4 flex items-start gap-3">
            <span class="cursor-grab text-slate-300 pt-1 select-none" title="Seret untuk memindahkan">⋮⋮</span>
            <span class="w-7 h-7 shrink-0 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold inline-flex items-center justify-center">{index + 1}</span>

            <div class="flex-1 min-w-0">
              <input
                bind:value={node.name}
                aria-label="Nama tahap {index + 1}"
                class="w-full font-semibold text-slate-900 border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none px-0 py-0.5"
              />
              <p class="text-xs text-slate-500 mt-1 line-clamp-2">
                {node.description || 'Belum ada keterangan — isi supaya staf tahu tahap ini untuk apa.'}
              </p>

              <div class="flex flex-wrap gap-1.5 mt-2">
                {#if builder.startKeys.includes(node.key)}
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">TAHAP AWAL</span>
                {/if}
                {#if node.next.length === 0}
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">TAHAP AKHIR</span>
                {/if}
                {#if node.allowsCharges}
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">BIAYA</span>
                {/if}
                {#if node.requiresDiagnosis}
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700">DIAGNOSA</span>
                {/if}
                {#if node.allowsInvoicing}
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-green-50 text-green-700">PEMBAYARAN</span>
                {/if}
                {#each node.autoPrintDocuments as doc}
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700">CETAK: {doc}</span>
                {/each}
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button onclick={() => builder.move(index, -1)} disabled={index === 0}
                class="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30" aria-label="Naikkan tahap">↑</button>
              <button onclick={() => builder.move(index, 1)} disabled={index === builder.nodes.length - 1}
                class="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30" aria-label="Turunkan tahap">↓</button>
              <button onclick={() => expandedKey = expandedKey === node.key ? null : node.key}
                class="px-3 h-9 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
                {expandedKey === node.key ? 'Tutup' : 'Atur'}
              </button>
            </div>
          </div>

          {#if expandedKey === node.key}
            <div class="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
              <div>
                <label for="desc-{node.key}" class="block text-xs font-medium text-slate-600 mb-1">
                  Keterangan tahap — ditampilkan ke staf di halaman tiket
                </label>
                <textarea id="desc-{node.key}" bind:value={node.description} rows="2"
                  placeholder="mis. Teknisi memeriksa unit lalu mengisi diagnosa dan estimasi biaya."
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>

              <fieldset>
                <legend class="text-xs font-medium text-slate-600 mb-2">Yang boleh dikerjakan di tahap ini</legend>
                <div class="space-y-2">
                  <label class="flex items-start gap-2 text-sm">
                    <input type="checkbox" bind:checked={node.allowsCharges} class="mt-1" />
                    <span>
                      <b>Input sparepart &amp; biaya</b>
                      <span class="block text-xs text-slate-500">Matikan di tahap sebelum unit didiagnosis — memilih sparepart saat itu hanya menebak.</span>
                    </span>
                  </label>
                  <label class="flex items-start gap-2 text-sm">
                    <input type="checkbox" bind:checked={node.requiresDiagnosis} class="mt-1" />
                    <span>
                      <b>Isi hasil diagnosa &amp; estimasi waktu</b>
                      <span class="block text-xs text-slate-500">Menampilkan form diagnosa teknisi dan lama pengerjaan yang dijanjikan.</span>
                    </span>
                  </label>
                  <label class="flex items-start gap-2 text-sm">
                    <input type="checkbox" bind:checked={node.allowsInvoicing} class="mt-1" />
                    <span>
                      <b>Buat faktur &amp; terima pembayaran</b>
                      <span class="block text-xs text-slate-500">Biasanya hanya di tahap akhir, setelah pengerjaan selesai.</span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend class="text-xs font-medium text-slate-600 mb-2">Dokumen yang otomatis dicetak saat masuk tahap ini</legend>
                <div class="space-y-2">
                  {#each DOCUMENT_OPTIONS as doc}
                    <label class="flex items-start gap-2 text-sm">
                      <input type="checkbox" class="mt-1"
                        checked={node.autoPrintDocuments.includes(doc.value)}
                        onchange={() => builder.toggleDocument(node.key, doc.value)} />
                      <span>
                        <b>{doc.label}</b>
                        <span class="block text-xs text-slate-500">{doc.hint}</span>
                      </span>
                    </label>
                  {/each}
                </div>
              </fieldset>

              <fieldset>
                <legend class="text-xs font-medium text-slate-600 mb-2">
                  Setelah tahap ini, boleh lanjut ke — centang lebih dari satu untuk percabangan
                </legend>
                <div class="flex flex-wrap gap-2">
                  {#each builder.nodes.filter((n) => n.key !== node.key) as target}
                    <label class="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg cursor-pointer {node.next.includes(target.key) ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}">
                      <input type="checkbox" class="sr-only"
                        checked={node.next.includes(target.key)}
                        onchange={() => builder.toggleNext(node.key, target.key)} />
                      {target.name}
                    </label>
                  {/each}
                </div>
                {#if node.next.length === 0}
                  <p class="text-xs text-slate-500 mt-2">Tidak ada lanjutan = ini tahap akhir; tiket ditutup saat masuk ke sini.</p>
                {/if}
              </fieldset>

              <div class="pt-2 border-t border-slate-200">
                <button onclick={() => builder.removeNode(node.key)}
                  class="text-sm text-red-600 hover:text-red-800 font-medium">
                  Hapus tahap ini
                </button>
                <p class="text-xs text-slate-500 mt-1">
                  Tahap yang sudah pernah dilewati tiket tidak bisa dihapus — ganti namanya bila ingin mengubah maksudnya.
                </p>
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ol>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button onclick={() => builder.addNode()}
        class="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
        + Tambah Tahap
      </button>
      <button onclick={() => builder.save()} disabled={builder.saving}
        class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        data-testid="save-flow">
        {builder.saving ? 'Menyimpan...' : 'Simpan Alur'}
      </button>
    </div>
  {/if}
</div>
