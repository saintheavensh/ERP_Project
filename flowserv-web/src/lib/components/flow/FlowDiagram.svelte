<script lang="ts">
  import { NODE_W, NODE_H, STAGE_PRESETS, type FlowDiagramState, type StagePreset } from '$lib/states/flow/flow.diagram.svelte';

  let { diagram }: { diagram: FlowDiagramState } = $props();

  // Sambungan yang menu sisipannya sedang terbuka. Ini jalur SENTUH: di ponsel
  // tidak ada drag-and-drop HTML5 sama sekali, jadi tombol "+" pada tiap panah
  // harus bisa diklik untuk memilih tahap tambahan.
  let pickerEdge = $state<string | null>(null);

  function edgeId(from: string, to: string) {
    return `${from}→${to}`;
  }

  function pick(preset: StagePreset, from: string, to: string) {
    pickerEdge = null;
    diagram.insertPreset(preset, from, to);
  }

  /**
   * Ketukan pada tanda "+".
   *
   * Bila sebuah tahap tambahan sudah "disiapkan" dari palet (diketuk, bukan
   * diseret — jalur satu-satunya di ponsel), ketukan ini langsung memasangnya.
   * Bila belum, barulah daftar pilihan dibuka di tempat.
   */
  function tapEdge(from: string, to: string, id: string) {
    const armed = diagram.dragging;
    if (armed?.kind === 'preset') {
      diagram.dragging = null;
      diagram.insertPreset(armed.preset, from, to);
      return;
    }
    pickerEdge = pickerEdge === id ? null : id;
  }
</script>

<div class="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-4" data-testid="flow-canvas">
  <div class="relative" style="width: {diagram.canvasWidth}px; height: {diagram.canvasHeight}px; min-width: {diagram.canvasWidth}px;">
    <!-- Panah dari mana ke mana. Digambar di lapisan bawah supaya kartu tahap
         selalu bisa diklik walau garisnya lewat di belakangnya. -->
    <svg class="absolute inset-0 pointer-events-none" width={diagram.canvasWidth} height={diagram.canvasHeight} aria-hidden="true">
      <defs>
        <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
        </marker>
      </defs>
      {#each diagram.edges as edge (edgeId(edge.from, edge.to))}
        <path
          d={edge.path}
          fill="none"
          stroke={diagram.dropTarget === edgeId(edge.from, edge.to) ? '#2563eb' : '#94a3b8'}
          stroke-width={diagram.dropTarget === edgeId(edge.from, edge.to) ? 3 : 2}
          marker-end="url(#flow-arrow)"
        />
      {/each}
    </svg>

    <!-- Titik sisip pada tiap panah: sasaran jatuh untuk seretan, sekaligus
         tombol untuk layar sentuh. -->
    {#each diagram.edges as edge (edgeId(edge.from, edge.to))}
      {@const id = edgeId(edge.from, edge.to)}
      <div class="absolute z-20" style="left: {edge.midX}px; top: {edge.midY}px; transform: translate(-50%, -50%);">
        <!-- <div role="button">, bukan <button>: sasaran jatuh HTML5 harus
             elemen biasa agar seretan asli Chromium sampai ke sini (pola yang
             sama dipakai kartu papan Kanban P2). -->
        <div
          role="button"
          tabindex="0"
          data-testid="flow-edge-drop"
          data-edge={id}
          aria-label="Sisipkan tahap antara {diagram.nodeName(edge.from)} dan {diagram.nodeName(edge.to)}"
          title="Sisipkan tahap di sini"
          ondragover={(e) => { e.preventDefault(); diagram.dropTarget = id; }}
          ondragleave={() => { if (diagram.dropTarget === id) diagram.dropTarget = null; }}
          ondrop={(e) => { e.preventDefault(); diagram.handleDrop(edge.from, edge.to); }}
          onclick={() => tapEdge(edge.from, edge.to, id)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapEdge(edge.from, edge.to, id); } }}
          class="w-7 h-7 rounded-full border-2 bg-white text-sm font-bold leading-none flex items-center justify-center cursor-pointer transition-colors
            {diagram.dropTarget === id ? 'border-blue-600 text-blue-600 scale-125' : 'border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-600'}"
        >+</div>

        {#if pickerEdge === id}
          <div class="absolute left-1/2 top-9 -translate-x-1/2 z-30 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-1">
            <p class="px-2 py-1 text-[11px] text-slate-500">Sisipkan di sini:</p>
            {#each STAGE_PRESETS as preset (preset.id)}
              <button type="button" onclick={() => pick(preset, edge.from, edge.to)}
                class="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-blue-50 hover:text-blue-700">
                {preset.name}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    <!-- Kartu tahap -->
    {#each diagram.layout as node (node.key)}
      <div
        class="absolute z-10"
        style="left: {node.x}px; top: {node.y}px; width: {NODE_W}px; height: {NODE_H}px;"
      >
        <div
          role="button"
          tabindex="0"
          data-testid="flow-node"
          data-core={node.isCore}
          draggable={!node.isCore}
          ondragstart={(e) => {
            // setData() wajib: seretan tanpa isi dataTransfer dibatalkan
            // Chromium, dan `drop` tak pernah terjadi (lihat papan Kanban P2).
            e.dataTransfer?.setData('text/plain', node.key);
            diagram.dragging = { kind: 'node', key: node.key };
          }}
          ondragend={() => { diagram.dragging = null; diagram.dropTarget = null; }}
          onclick={() => (diagram.selectedKey = diagram.selectedKey === node.key ? null : node.key)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); diagram.selectedKey = node.key; } }}
          class="w-full h-full rounded-xl border-2 bg-white px-3 py-2 text-left shadow-sm transition-colors overflow-hidden
            {diagram.selectedKey === node.key ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}
            {node.isCore ? '' : 'border-dashed cursor-grab'}"
        >
          <div class="flex items-start justify-between gap-1">
            <span class="font-semibold text-sm text-slate-900 leading-tight line-clamp-2">{node.name}</span>
            {#if node.isCore}
              <span class="text-slate-300 text-xs shrink-0" title="Tahap inti — urutannya terkunci">🔒</span>
            {:else}
              <button
                type="button"
                aria-label="Lepas tahap {node.name}"
                title="Lepas tahap ini dari alur"
                onclick={(e) => { e.stopPropagation(); diagram.detach(node.key); }}
                class="shrink-0 w-5 h-5 rounded text-slate-400 hover:bg-red-50 hover:text-red-600 text-xs leading-none"
              >✕</button>
            {/if}
          </div>

          <div class="flex flex-wrap gap-1 mt-1.5">
            {#if diagram.startKeys.includes(node.key)}
              <span class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">AWAL</span>
            {/if}
            {#if node.next.length === 0}
              <span class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">AKHIR</span>
            {/if}
            {#if node.allowsCharges}
              <span class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">BIAYA</span>
            {/if}
            {#if node.requiresDiagnosis}
              <span class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">DIAGNOSA</span>
            {/if}
            {#if node.allowsInvoicing}
              <span class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700">BAYAR</span>
            {/if}
            {#if node.checklistItems.length > 0}
              <span class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">
                PERIKSA: {node.checklistItems.length}
              </span>
            {/if}
            {#each node.autoPrintDocuments as doc (doc)}
              <span class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">CETAK: {doc}</span>
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
