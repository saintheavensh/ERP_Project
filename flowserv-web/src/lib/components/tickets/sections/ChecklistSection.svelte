<script lang="ts">
  // R2.1 — dipindahkan APA ADANYA dari TicketWorkspace.svelte (baris 412–509).
  //
  // Dua blok digabung dalam satu komponen karena keduanya satu hal bagi
  // pemakai: daftar periksa tahap SEKARANG, dan bukti dari tahap yang sudah
  // lewat. Memisahkannya jadi dua komponen akan memaksa penyusunnya tahu
  // urutan keduanya — pengetahuan yang tak perlu ia punya.
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<!-- Daftar periksa tahap (QC). Itemnya berasal dari template alur, jadi
     tahap mana pun bisa punya daftar periksa — bukan hanya tahap bernama
     "QC". Hasilnya tersimpan lengkap dengan siapa & kapan: itu bukti yang
     ditunjukkan ke pelanggan, alasan pemilik meminta QC. -->
{#if state.checklist}
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="checklist-panel">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h2 class="font-semibold text-slate-800">
        Daftar Periksa — {state.checklist.nodeName}
      </h2>
      <span class="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600" data-testid="checklist-progress">
        {state.checklist.checked}/{state.checklist.total} diperiksa
      </span>
    </div>

    {#if state.checklistSavedMsg}
      <p class="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2" data-testid="checklist-saved">
        {state.checklistSavedMsg}
      </p>
    {/if}

    <ul class="space-y-3">
      {#each state.checklist.lines as line (line.itemId)}
        {@const value = state.checklistValue(line.itemId)}
        <li class="border-b border-slate-100 last:border-0 pb-3 last:pb-0" data-testid="checklist-line">
          <label class="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              class="mt-1 w-5 h-5 shrink-0"
              checked={value.checked}
              disabled={line.removedFromTemplate}
              onchange={(e) => state.setChecklistValue(line.itemId, { checked: e.currentTarget.checked })}
            />
            <span class="flex-1 min-w-0">
              <span class="text-slate-800">{line.label}</span>
              {#if line.removedFromTemplate}
                <span class="ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  tidak lagi diperiksa
                </span>
              {/if}
              {#if line.checkedAt}
                <span class="block text-xs text-slate-400 mt-0.5">
                  {line.checkedByName || 'Sistem'} — {new Date(line.checkedAt).toLocaleString('id-ID')}
                </span>
              {/if}
            </span>
          </label>
          {#if !line.removedFromTemplate}
            <input
              value={value.note}
              oninput={(e) => state.setChecklistValue(line.itemId, { note: e.currentTarget.value })}
              placeholder="Catatan (opsional) — mis. lecet di sudut kiri bawah"
              aria-label="Catatan untuk {line.label}"
              class="mt-2 ml-8 w-[calc(100%-2rem)] px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          {:else if line.note}
            <p class="mt-1 ml-8 text-xs text-slate-500">{line.note}</p>
          {/if}
        </li>
      {/each}
    </ul>

    <button
      onclick={() => state.saveChecklist()}
      disabled={state.checklistLoading}
      class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
      data-testid="save-checklist">
      {state.checklistLoading ? 'Menyimpan...' : 'Simpan Hasil Pemeriksaan'}
    </button>
  </div>
{/if}

<!-- Bukti pemeriksaan dari tahap yang sudah dilewati. Ditampilkan baca-saja:
     tiket sudah pindah tahap, tapi buktinya tetap harus bisa ditunjukkan. -->
{#each state.checklistHistory as past (past.nodeId)}
  <div class="bg-slate-50 rounded-xl border border-slate-200 p-5" data-testid="checklist-history">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
      <h3 class="text-sm font-semibold text-slate-700">Hasil Pemeriksaan — {past.nodeName}</h3>
      <span class="text-xs text-slate-500">{past.checked}/{past.total} diperiksa</span>
    </div>
    <ul class="space-y-1.5">
      {#each past.lines as line (line.itemId)}
        <li class="flex items-start gap-2 text-sm">
          <span class="shrink-0 {line.checked ? 'text-green-600' : 'text-slate-300'}">{line.checked ? '✓' : '○'}</span>
          <span class="flex-1 min-w-0">
            <span class={line.checked ? 'text-slate-700' : 'text-slate-400'}>{line.label}</span>
            {#if line.note}<span class="block text-xs text-slate-500">{line.note}</span>{/if}
            {#if line.checkedAt}
              <span class="block text-xs text-slate-400">
                {line.checkedByName || 'Sistem'} — {new Date(line.checkedAt).toLocaleString('id-ID')}
              </span>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
  </div>
{/each}
