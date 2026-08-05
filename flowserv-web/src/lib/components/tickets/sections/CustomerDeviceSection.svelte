<script lang="ts">
  // R2.1 — dipindahkan APA ADANYA dari TicketWorkspace.svelte (baris 43–247).
  // Refactor murni: satu pun kelas CSS, data-testid, dan urutan elemen tidak
  // diubah, karena buktinya adalah `p4-ticket-detail-polish` + `intake-to-close`
  // lulus TANPA spec-nya disunting.
  import type { TicketDetailState } from '$lib/states/tickets/ticket.detail.svelte';
  import PasscodeField from '../PasscodeField.svelte';
  import PatternPad from '../PatternPad.svelte';
  import { parsePattern, passcodeText } from '$lib/utils/pattern';

  let { state } = $props<{ state: TicketDetailState }>();
</script>

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
        <!-- R1.11-T2 — dicatat konter, jadi hanya konter yang mengubahnya.
             Teknisi tetap MELIHAT isinya: ia butuh sandinya untuk menguji unit. -->
        {#if !state.passcodeEditing && state.bolehUbahDataKonter}
          <button onclick={() => state.openPasscodeEdit()} data-testid="ubah-sandi" class="text-blue-600 hover:text-blue-800 text-xs font-medium">Ubah</button>
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
        <!-- R1.11-T2 — apa yang DIBAWA pelanggan dicatat konter. Teknisi
             membacanya (itu alasan unit ini ada di mejanya), tidak mengubahnya. -->
        {#if !state.complaintEditing && state.bolehUbahDataKonter}
          <button onclick={() => state.openComplaintEdit()} data-testid="ubah-keluhan" class="text-blue-600 hover:text-blue-800 text-xs font-medium">Ubah</button>
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

    <!-- R1.8-T7 — perkiraan biaya yang DISEBUT KASIR di konter. Teknisi perlu
         melihatnya sebelum menyebut angkanya sendiri: pelanggan sudah terlanjur
         mendengar yang ini. Hanya tampil bila memang disebutkan; tidak semua
         unit dikutip harga di depan. -->
    <!-- R1.10-T1 — kotaknya juga muncul saat perkiraan BELUM diisi, asalkan
         tiket masih di tahap Penerimaan. Sebelumnya kotak ini hanya ada bila
         angkanya sudah terisi, jadi kasir yang lupa menyebutkannya di konter
         tak punya tempat menambahkannya sama sekali. -->
    {#if state.perkiraanKonter !== null || state.perkiraanBolehDiubah}
      {@const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)}
      <div class="mt-3 pt-3 border-t border-slate-100" data-testid="intake-estimate">
        <!-- R1.9-T4 — keduanya berdampingan beserta selisihnya. Estimasi
             teknisi diubah lewat baris biaya, bukan di sini.
             R1.10-T1 — perkiraan konter bisa dibetulkan SELAGI di tahap
             Penerimaan; sesudah itu tombolnya hilang karena backend memang
             menolaknya (422 INTAKE_ESTIMATE_LOCKED). Tombol yang pasti gagal
             adalah anti-pattern yang Track F & R1.7-T3 sudah berantas. -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perkiraan Konter</span>
              <!-- R1.11-T2 — dua syarat yang BERBEDA jenisnya, sengaja
                   ditulis terpisah: `perkiraanBolehDiubah` aturan tahap
                   (bukti, berlaku juga untuk Super Admin), yang kedua aturan
                   wewenang (siapa yang mencatat di konter). -->
              {#if state.perkiraanBolehDiubah && state.bolehUbahDataKonter && !state.perkiraanEditing}
                <button
                  onclick={() => state.openPerkiraanEdit()}
                  data-testid="ubah-perkiraan-konter"
                  class="text-xs font-medium text-blue-600 hover:text-blue-700"
                >{state.perkiraanKonter === null ? 'Isi' : 'Ubah'}</button>
              {/if}
            </div>

            {#if state.perkiraanEditing}
              <div class="flex items-start gap-2 mt-1">
                <input
                  type="number" min="0" step="1000"
                  bind:value={state.perkiraanDraft}
                  data-testid="input-perkiraan-konter"
                  placeholder="mis. 450000"
                  aria-label="Perkiraan biaya konter"
                  class="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex flex-col gap-1">
                  <button
                    onclick={() => state.savePerkiraan()}
                    disabled={state.perkiraanLoading}
                    data-testid="simpan-perkiraan-konter"
                    class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2 py-1 rounded-lg"
                  >{state.perkiraanLoading ? '...' : 'Simpan'}</button>
                  <button
                    onclick={() => state.perkiraanEditing = false}
                    class="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1"
                  >Batal</button>
                </div>
              </div>
              <p class="text-xs text-slate-500 mt-1">Kosongkan bila tidak jadi menyebut angka.</p>
            {:else if state.perkiraanKonter !== null}
              <p class="text-sm text-slate-900 mt-1 font-medium" data-testid="perkiraan-konter">{rp(state.perkiraanKonter)}</p>
              <!-- R1.11-T4 — kalimat lamanya berbunyi "terkunci setelah unit
                   lepas dari konter". Pemilik mengoreksinya di uji R1.10 A8:
                   "unit masih ada di konter cuman statusnya berubah yang
                   tadinya menunggu menjadi sudah di diagnosa". Betul — tak ada
                   perpindahan barang, yang berpindah cuma tahapnya.
                   Kuncinya TETAP (keputusan pemilik 2026-08-05): alasan asli
                   R1.9-T4 tidak bergantung pada premis yang salah itu. Angka
                   ini sudah terlanjur didengar pelanggan, jadi ia bukti. -->
              <p class="text-xs text-slate-500">
                {state.perkiraanBolehDiubah
                  ? 'Disebutkan kasir saat unit diterima.'
                  : 'Disebutkan kasir saat unit diterima — terkunci sejak tiket masuk pemeriksaan, karena angka ini sudah disebutkan ke pelanggan.'}
              </p>
            {:else}
              <p class="text-sm text-slate-400 mt-1" data-testid="perkiraan-konter">Belum disebutkan</p>
              <!-- R1.11-T4 — premis yang sama dibetulkan: bukan "selagi unit
                   masih di konter", tapi selagi tiket belum diperiksa teknisi. -->
              <p class="text-xs text-slate-500">Isi sebelum teknisi mulai memeriksa.</p>
            {/if}
          </div>
          <div>
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimasi Teknisi</span>
            {#if state.estimasiTeknisi !== null}
              <p class="text-sm text-slate-900 mt-1 font-medium" data-testid="estimasi-teknisi">{rp(state.estimasiTeknisi)}</p>
              <p class="text-xs text-slate-500">Jumlah sparepart &amp; jasa yang dicatat.</p>
            {:else}
              <p class="text-sm text-slate-400 mt-1" data-testid="estimasi-teknisi">Belum ada</p>
              <p class="text-xs text-slate-500">Terisi sendiri saat teknisi mencatat biaya.</p>
            {/if}
          </div>
        </div>

        {#if state.selisihEstimasi !== null && state.selisihEstimasi !== 0}
          <p
            class="mt-2 text-xs font-medium {state.selisihEstimasi > 0 ? 'text-amber-700' : 'text-emerald-700'}"
            data-testid="selisih-estimasi"
          >
            {state.selisihEstimasi > 0 ? 'Lebih mahal' : 'Lebih murah'} {rp(Math.abs(state.selisihEstimasi))}
            dari yang disebutkan di konter — sampaikan ke pelanggan sebelum dikerjakan.
          </p>
        {/if}
      </div>
    {/if}
  </div>
</div>
