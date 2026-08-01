<script lang="ts">
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import TicketCharges from './TicketCharges.svelte';
  import PrintButton from '$lib/components/print/PrintButton.svelte';
  import PasscodeField from './PasscodeField.svelte';
  import PatternPad from './PatternPad.svelte';
  import { parsePattern, passcodeText } from '$lib/utils/pattern';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

<div class="flex-1 space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-4">
      <a href="/tickets" class="text-slate-500 hover:text-slate-800" aria-label="Back to tickets">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </a>
      <h1 class="text-2xl font-bold text-slate-900">Workspace</h1>
    </div>
    <div class="flex items-center gap-3">
      {#if state.canCancel}
        <button
          onclick={() => state.openCancelModal()}
          class="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-full border border-red-200 hover:bg-red-50 transition-colors"
        >
          Batalkan Tiket
        </button>
      {/if}
      <div class="px-3 py-1 bg-slate-800 text-white text-sm font-medium rounded-full">
        {state.ticket?.status.toUpperCase()}
      </div>
    </div>
  </div>

  <!-- Error Banner -->
  {#if state.errorMsg}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
      <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span>{state.errorMsg}</span>
    </div>
  {/if}

  <!-- Customer & Device Overview -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- Customer Box -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
      <button onclick={() => state.openEditCustomer()} class="absolute top-4 right-4 text-slate-400 hover:text-blue-600 transition-colors" title="Edit Customer">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
      </button>
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pelanggan</h3>
      <p class="font-bold text-lg text-slate-900">{state.customer?.name}</p>
      <p class="text-slate-600 text-sm mt-1">📞 {state.customer?.phone || 'No Phone'}</p>
      <p class="text-slate-600 text-sm">✉️ {state.customer?.email || 'No Email'}</p>
    </div>
    <!-- Device Box -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Device Info</h3>
      <p class="font-bold text-lg text-slate-900">
        <span class="text-blue-600">{state.asset?.assetType}</span> {state.asset?.brand || ''} {state.asset?.model || ''}
      </p>
      <p class="text-slate-600 text-sm mt-1 font-mono">SN: {state.asset?.serialNumber || 'N/A'}</p>

      <!-- Tahap A — katalog device (spesifikasi teks). Cuma tampil kalau asset
           ini match ke entri katalog (deviceModelId terisi saat intake).
           Gambar tidak ditampilkan — teks saja (keputusan 2026-07-25). -->
      {#if state.deviceModel}
        <div class="mt-3 pt-3 border-t border-slate-100" data-testid="device-catalog-card">
          {#if state.deviceModel.specs && Object.keys(state.deviceModel.specs).length > 0}
            <dl class="text-xs grid grid-cols-2 gap-x-3 gap-y-0.5 content-start">
              {#each Object.entries(state.deviceModel.specs) as [key, value]}
                <div class="contents">
                  <dt class="text-slate-400">{key}</dt>
                  <dd class="text-slate-700">{value}</dd>
                </div>
              {/each}
            </dl>
          {/if}
        </div>
      {/if}

      <!-- Tahap A — go-live gap Tier-1 #2. Sandi/pola: dicatat di intake,
           dikembalikan ke pelanggan saat serah-terima (QC Akhir). -->
      <div class="mt-3 pt-3 border-t border-slate-100">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sandi / Pola</span>
          {#if !state.passcodeEditing}
            <button onclick={() => state.openPasscodeEdit()} class="text-blue-600 hover:text-blue-800 text-xs font-medium">Ubah</button>
          {/if}
        </div>
        {#if state.passcodeEditing}
          <div class="mt-1">
            <PasscodeField value={state.passcodeDraft} onchange={(v) => (state.passcodeDraft = v)} id="passcode" />
            <div class="mt-2 flex items-center gap-2">
              <button onclick={() => state.savePasscode()} disabled={state.passcodeLoading} class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1 rounded-lg">
                {state.passcodeLoading ? '...' : 'Simpan'}
              </button>
              <button onclick={() => state.passcodeEditing = false} class="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1">Batal</button>
            </div>
          </div>
        {:else if parsePattern(state.ticket?.devicePasscode)}
          <div class="mt-1">
            <PatternPad value={state.ticket.devicePasscode} readonly />
            <p class="text-sm font-mono text-slate-900 mt-1">{passcodeText(state.ticket.devicePasscode)}</p>
          </div>
        {:else}
          <p class="text-sm font-mono text-slate-900 mt-1">{state.ticket?.devicePasscode || '-'}</p>
        {/if}
      </div>

      <!-- Tahap A — go-live gap Tier-1 #3. Keluhan/kerusakan: feeds the
           label/tanda-terima print documents. -->
      <div class="mt-3 pt-3 border-t border-slate-100">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keluhan / Kerusakan</span>
          {#if !state.complaintEditing}
            <button onclick={() => state.openComplaintEdit()} class="text-blue-600 hover:text-blue-800 text-xs font-medium">Ubah</button>
          {/if}
        </div>
        {#if state.complaintEditing}
          <div class="mt-1 flex items-start gap-2">
            <textarea
              bind:value={state.complaintDraft}
              rows="2"
              placeholder="mis. LCD retak, tidak bisa charge"
              class="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <div class="flex flex-col gap-1">
              <button onclick={() => state.saveComplaint()} disabled={state.complaintLoading} class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2 py-1 rounded-lg">
                {state.complaintLoading ? '...' : 'Simpan'}
              </button>
              <button onclick={() => state.complaintEditing = false} class="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1">Batal</button>
            </div>
          </div>
        {:else}
          <p class="text-sm text-slate-900 mt-1">{state.ticket?.reportedComplaint || '-'}</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Tahap A — go-live gap Tier-1 #3 (print triggers). Each button appears
       once its document is actually meaningful to print — never forced/auto-
       printed, matching how every other "Cetak" action in this app already
       works (a manual click, not a side effect of a transition). -->
  {#if state.canPrintLabel || state.canPrintTandaTerima || state.invoice}
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumen Cetak</h3>
        <!-- Tahap B — status auto-cetak saat intake baru tersimpan. Hanya
             muncul bila ada yang perlu diketahui (gagal / sedang berjalan). -->
        {#if state.autoPrintMessage}
          <span class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1" data-testid="ticket-print-status">
            {state.autoPrintMessage}
          </span>
        {/if}
      </div>
      <div class="flex flex-wrap gap-2">
        {#if state.canPrintLabel}
          <PrintButton token={state.token} documentType="label" id={state.ticket.id} label="Cetak Label" />
        {/if}
        {#if state.canPrintTandaTerima}
          <PrintButton token={state.token} documentType="tanda_terima" id={state.ticket.id} label="Cetak Tanda Terima" />
        {/if}
        {#if state.invoice}
          <PrintButton token={state.token} documentType="receipt" id={state.invoice.id} label="Cetak Struk" />
          <PrintButton token={state.token} documentType="invoice_a4" id={state.invoice.id} label="Cetak Nota (A4)" />
        {/if}
      </div>
    </div>
  {/if}

  <!-- Tahap B — hasil diagnosa + estimasi waktu. Muncul di tahap yang
       templatenya menandai requiresDiagnosis, bukan di tahap bernama
       "Diagnosis": toko bebas memindahkannya lewat pengaturan alur. -->
  {#if state.diagnosisRequired || state.ticket?.diagnosis}
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" data-testid="diagnosis-panel">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hasil Diagnosa &amp; Estimasi Waktu</h3>
        {#if !state.diagnosisEditing && state.ticket?.status !== 'closed' && state.ticket?.status !== 'cancelled'}
          <button onclick={() => state.openDiagnosisEdit()} class="text-blue-600 hover:text-blue-800 text-xs font-medium">
            {state.ticket?.diagnosis ? 'Edit' : 'Isi Diagnosa'}
          </button>
        {/if}
      </div>

      {#if state.diagnosisEditing}
        <div class="space-y-3">
          <div>
            <label for="diagnosis" class="block text-xs font-medium text-slate-600 mb-1">Temuan teknisi</label>
            <textarea id="diagnosis" bind:value={state.diagnosisDraft} rows="3"
              placeholder="mis. IC power short, konektor cas rusak"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          <div>
            <label for="duration" class="block text-xs font-medium text-slate-600 mb-1">Estimasi lama pengerjaan (menit)</label>
            <input id="duration" type="number" min="1" bind:value={state.durationDraft}
              placeholder="mis. 120 untuk 2 jam"
              class="w-full sm:w-64 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <p class="text-xs text-slate-400 mt-1">Yang dijanjikan ke pelanggan adalah durasinya, jadi dicatat sebagai lama pengerjaan — bukan jam selesai.</p>
          </div>
          <div class="flex gap-2">
            <button onclick={() => state.saveDiagnosis()} disabled={state.diagnosisLoading}
              class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg">
              {state.diagnosisLoading ? 'Menyimpan...' : 'Simpan Diagnosa'}
            </button>
            <button onclick={() => state.diagnosisEditing = false} class="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2">Batal</button>
          </div>
        </div>
      {:else}
        <p class="text-sm text-slate-900">{state.ticket?.diagnosis || 'Belum diisi.'}</p>
        {#if state.estimatedDurationText}
          <p class="text-sm text-slate-500 mt-1">Estimasi pengerjaan: <b class="text-slate-700">{state.estimatedDurationText}</b></p>
        {/if}
      {/if}
    </div>
  {/if}

  <!-- F1 — Technician assignment (wires H8's previously-orphaned POST /:id/assign) -->
  <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Technician</h3>
      <!-- Tahap B — "teknisi bisa mengambil pekerjaan dari yang menunggu
           antrian". Hanya muncul saat tiket belum bertuan; menugaskan diri
           sendiri, bukan orang lain (izinnya pun beda di backend). -->
      {#if !state.assignedTechnician && state.ticket?.status === 'open'}
        <button
          onclick={() => state.claim()}
          disabled={state.assignLoading}
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
          data-testid="claim-ticket"
        >
          {state.assignLoading ? 'Mengambil...' : 'Ambil Pekerjaan'}
        </button>
      {/if}
    </div>
    {#if state.ticket?.queueNumber}
      <p class="text-xs text-slate-400 mb-2">Nomor antrian {state.ticket.queueNumber}</p>
    {/if}
    {#if state.ticket?.status === 'closed' || state.ticket?.status === 'cancelled' || !state.canAssignOthers}
      <!-- R1.7 — teknisi hanya MEMBACA siapa pemegang tiket. Menugaskan orang
           lain adalah wewenang manajer, dan backend memang sudah menolaknya;
           dropdown-nya hanya membingungkan. Tombol "Ambil Pekerjaan" di atas
           tidak ikut hilang — itu menugaskan DIRI SENDIRI, izinnya beda. -->
      <p class="font-bold text-lg text-slate-900" data-testid="assigned-technician-name">
        {state.assignedTechnician?.name || 'Belum ditugaskan'}
      </p>
    {:else}
      <div class="flex items-center gap-3">
        <select
          value={state.assignedTechnician?.id || ''}
          onchange={(e) => state.assign(e.currentTarget.value)}
          disabled={state.assignLoading}
          class="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
        >
          <option value="" disabled selected={!state.assignedTechnician}>-- Pilih Teknisi --</option>
          {#each state.technicians as tech}
            <option value={tech.id} selected={tech.id === state.assignedTechnician?.id}>{tech.name}</option>
          {/each}
        </select>
        {#if state.assignLoading}
          <span class="text-sm text-slate-500">Menugaskan...</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- H7 — Charges (parts / labor / fees), running total, request approval.
       Tahap B — dikunci sampai tiket melewati node persetujuan: sebelum
       didiagnosis & disetujui pelanggan, memilih sparepart hanya menebak
       (keputusan pemilik 2026-07-27). Ditampilkan sebagai kartu terkunci,
       bukan disembunyikan, supaya teknisi tahu bagian ini ada dan kapan
       terbuka — bukan mengira fiturnya hilang. -->
  {#if state.chargesUnlocked}
    <TicketCharges {state} />
  {:else}
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-testid="charges-locked">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
        <div>
          <h2 class="font-semibold text-slate-800">Sparepart &amp; Biaya</h2>
          <p class="text-sm text-slate-500 mt-1">
            {#if state.firstChargeNodeName}
              Terbuka mulai tahap <b class="text-slate-700">{state.firstChargeNodeName}</b>.
            {:else}
              Belum ada tahap yang mengizinkan input biaya di alur ini.
            {/if}
            Unit didiagnosis dulu, baru sparepart dan jasanya dicatat.
            <span class="block mt-1 text-xs text-slate-400">
              Aturan ini mengikuti template alur servis — bisa diubah di pengaturan alur.
            </span>
          </p>
        </div>
      </div>
    </div>
  {/if}

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

  <!-- Action Forms (Phase 3 Hardcoded dynamic forms) -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
      <h2 class="font-semibold text-slate-800">Current Stage: <span class="text-blue-600">{state.currentNode?.name}</span></h2>
      <p class="text-xs text-slate-500 mt-1">{state.currentNode?.description}</p>
    </div>
    
    <div class="p-6">
      {#if state.ticket?.status === 'closed' || state.ticket?.status === 'cancelled'}
        <div class="text-center text-slate-500 py-8">
          This ticket is already closed. No further actions can be taken.
        </div>
      {:else if state.availableTransitions.length === 0}
        <div class="text-center text-slate-500 py-8">
          This is the final stage. No further transitions available.
        </div>
      {:else}
        <!-- Form Panel -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="next">Pilih Tahap Berikutnya</label>
            <select id="next" value={state.selectedTransition} onchange={(e) => state.selectTransition(e.currentTarget.value)} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">-- Select Action --</option>
              {#each state.availableTransitions as t}
                <option value={t.toNodeId}>{t.name} &rarr; {t.targetNodeName}</option>
              {/each}
            </select>
          </div>
          
          {#if state.selectedTransition}
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1" for="notes">Action Notes</label>
              <textarea id="notes" bind:value={state.transitionNotes} rows="3" class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Required parts, diagnosis result, or reason..."></textarea>
            </div>
            
            <div class="flex justify-end pt-2">
              <button 
                onclick={() => state.executeTransition()}
                disabled={state.loading}
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center">
                {#if state.loading} Processing... {:else} Execute {/if}
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
