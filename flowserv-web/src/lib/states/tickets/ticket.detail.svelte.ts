import { untrack } from 'svelte';
import { invalidateAll } from '$app/navigation';
import { API_BASE } from '$lib/api/config';
import { autoPrint, summarizeAutoPrint, DOCUMENT_LABELS } from '$lib/api/auto-print';
import { claimTicket } from '$lib/api/tickets';
import { roleCan } from '$lib/auth/capabilities';

export class TicketDetailState {
  // $state so every getter that reads `this.data` (ticket, currentNode, charges…)
  // is reactive. Without this, invalidateAll() after an action (transition,
  // consume, invoice) updated the page's `data` prop but NOT this captured copy,
  // so the workspace showed stale state until a full reload. The +page.svelte
  // syncs this via $effect. (Found by the H15-gap-(b) Playwright walk.)
  data = $state<any>(undefined);
  token: string;

  loading = $state(false);
  errorMsg = $state('');
  successMsg = $state('');

  // Transition form
  selectedTransition = $state('');
  transitionNotes = $state('');
  // H13 — generated when a target stage is picked (a new action), reused
  // across retries of THIS action (see executeTransition), cleared once the
  // transition succeeds so the next action gets a fresh key.
  transitionIdempotencyKey = $state('');

  // Customer Edit
  showEditWarning = $state(false);
  showEditForm = $state(false);
  editCustomerData = $state({ name: '', phone: '', email: '' });

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;
  }

  get ticket() { return this.data.data?.ticket; }
  get customer() { return this.data.data?.customer; }
  get asset() { return this.data.data?.asset; }
  get history() { return this.data.data?.history || []; }
  get currentNode() { return this.data.data?.node; }
  get template() { return this.data.template; }

  // F1 — technician assignment (wires H8's previously-orphaned POST /:id/assign)
  get assignedTechnician() { return this.data.data?.assignedTechnician; }
  get technicians() { return this.data.technicians || []; }

  /**
   * R1.7 — hanya peran yang benar-benar memegang `ticket.assign_technician`
   * yang melihat pemilih teknisi.
   *
   * Ini BUKAN gerbang keamanan (backend sudah menolak teknisi dengan 403,
   * lihat `requirePermission('ticket.assign_technician')` di routes/tickets.ts);
   * yang diperbaiki adalah kontrol yang tampak hidup padahal pasti gagal —
   * anti-pattern yang Track F ada untuk membasminya. Pemilik menemukannya
   * sebagai kebingungan, bukan sebagai error: "teknisi tidak bisa memilih
   * teknisi lainnya soalnya itu membingungkan" (uji-R1.6 B3).
   */
  get canAssignOthers() {
    return this.data.roleName === 'Super Admin' || this.data.roleName === 'Manager';
  }

  // -------------------------------------------------------------------------
  // R1.11-T2 — halaman tiket punya kolom milik DUA peran, dan sampai sekarang
  // ia menampilkan tombol Ubah untuk semuanya ke semua orang.
  //
  // Pemilik (uji-R1.10 A6): "teknisi masih bisa edit keluhan Pola dan lainnya
  // di halaman detail seharusnya tidak bisa". Yang ia lihat adalah TOMBOLNYA —
  // backend sudah menolak (403). Tombol yang pasti gagal adalah anti-pattern
  // yang Track F dan R1.7-T3 sudah berantas dua kali.
  //
  // ⚠️ Ini BUKAN gerbang keamanan; gerbangnya `intakePermissionsNeeded` di
  // backend (R1.11-T1), per kolom. Yang di sini hanya menyembunyikan tepat apa
  // yang backend memang tolak.
  //
  // Yang TIDAK ikut disembunyikan, dan itu disengaja: teknisi tetap MELIHAT
  // isi sandi/pola dan keluhan. Ia butuh sandinya untuk menguji unit, dan
  // keluhan adalah alasan unit itu ada di mejanya. Yang hilang cuma tombol
  // Ubah — sesuai tabel per-peran di plan/tahap-b-peran-dan-qc.md ("Sandi/pola:
  // teknisi baca", "Keluhan: teknisi baca").
  // -------------------------------------------------------------------------

  /** Kolom yang dicatat KONTER: sandi/pola, keluhan, perkiraan konter. */
  get bolehUbahDataKonter(): boolean {
    return roleCan(this.data.roleName, 'ticket.create');
  }

  /** Kolom yang dicatat TEKNISI: hasil diagnosa + lama pengerjaan. */
  get bolehUbahDiagnosa(): boolean {
    return roleCan(this.data.roleName, 'ticket.diagnose');
  }

  // -------------------------------------------------------------------------
  // R1.11-T3 — "jangan segarkan sekarang."
  //
  // Halaman ini menyegarkan dirinya tiap ~20 detik supaya kasir melihat tiket
  // yang sudah didiagnosa teknisi (keluhan pemilik di uji-R1.10 A6).
  //
  // ⚠️ Alasannya BUKAN "supaya tulisan tidak terhapus" — itu dugaan pertama
  // yang ternyata SALAH, dan dibuktikan salah dengan mencabut penjaga ini lalu
  // menjalankan tesnya (lulus). Draf di bawah hidup sebagai `$state` terpisah
  // dari `data`, jadi `invalidateAll()` memang tak menyentuhnya. Alasan yang
  // benar ada tiga dan ditulis lengkap di `lib/utils/refresh-policy.ts`:
  // penyegaran di tengah penyimpanan, pekerjaan sia-sia saat modal terbuka,
  // dan pagar untuk saat R2 memecah komponen ini.
  //
  // Daftarnya tetap LENGKAP — tiap tempat yang menampung pekerjaan belum
  // tersimpan disebut satu per satu, bukan disimpulkan dari satu bendera umum:
  // -------------------------------------------------------------------------
  get sedangSibuk(): boolean {
    return (
      // 1. Empat kotak "Ubah" — isinya draf yang belum dikirim.
      this.passcodeEditing ||
      this.complaintEditing ||
      this.diagnosisEditing ||
      this.perkiraanEditing ||
      // 2. Modal yang terbuka.
      this.showEditForm ||
      this.showEditWarning ||
      this.showCancelModal ||
      // 3. Permintaan yang sedang berjalan — menyegarkan di tengahnya membuat
      //    layar menampilkan keadaan sebelum tindakan yang baru saja selesai.
      this.loading ||
      this.assignLoading ||
      this.passcodeLoading ||
      this.complaintLoading ||
      this.diagnosisLoading ||
      this.perkiraanLoading ||
      this.checklistLoading ||
      this.chargeLoading ||
      this.cancelLoading ||
      // 4. Centangan QC yang belum disimpan. Tidak terlihat sebagai "form
      //    terbuka", tapi tetap pekerjaan teknisi yang belum tersimpan.
      Object.keys(this.checklistDraft).length > 0 ||
      // 5. Baris biaya yang sedang diisi. Formnya selalu tampak (bukan modal),
      //    jadi yang menandakan sibuk adalah ADANYA ISI, bukan terbukanya.
      this.chargeForm.description.trim() !== '' ||
      this.chargeForm.inventoryItemId !== '' ||
      this.chargeForm.unitPrice.trim() !== '' ||
      // 6. Tahap tujuan sudah dipilih / catatan perpindahan sedang diketik.
      this.selectedTransition !== '' ||
      this.transitionNotes.trim() !== ''
    );
  }
  assignLoading = $state(false);

  /**
   * Tahap B — teknisi mengambil sendiri pekerjaan dari antrian. Endpoint
   * terpisah dari `assign` karena izinnya berbeda: menugaskan DIRI SENDIRI
   * cukup izin teknisi, menugaskan ORANG LAIN izin manajer. Server mengambil
   * identitas dari JWT, bukan dari body.
   */
  async claim() {
    this.assignLoading = true;
    this.errorMsg = '';
    // R1.6 — panggilannya pindah ke lib/api/tickets.ts supaya tombol Ambil di
    // baris antrian (/tickets) memakai jalur yang sama persis, bukan salinan.
    const result = await claimTicket(this.token, this.ticket.id);
    if (result.ok) await invalidateAll();
    else this.errorMsg = result.message;
    this.assignLoading = false;
  }

  async assign(technicianId: string) {
    if (!technicianId) return;
    this.assignLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}`, 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ technicianId })
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal menugaskan teknisi';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.assignLoading = false; }
  }

  // Tahap A — go-live gap Tier-1 #2/#3. Sandi/pola + keluhan/kerusakan:
  // editable at any point, not just at intake (lets a mis-keyed value be
  // corrected, or sandi/pola cleared once handed back to the customer at QC
  // Akhir). Both fields share one PATCH endpoint but get independent edit
  // affordances in the UI, so editing one never touches the other.
  passcodeEditing = $state(false);
  passcodeDraft = $state('');
  passcodeLoading = $state(false);

  openPasscodeEdit() {
    this.passcodeDraft = this.ticket?.devicePasscode || '';
    this.passcodeEditing = true;
  }

  async savePasscode() {
    this.passcodeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/intake-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ devicePasscode: this.passcodeDraft || null })
      });
      const result = await res.json();
      if (res.ok) {
        this.passcodeEditing = false;
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal menyimpan sandi/pola';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.passcodeLoading = false; }
  }

  // Tahap B — hasil diagnosa teknisi + estimasi lama pengerjaan. Dua field
  // yang dijanjikan alur pemilik ("teknisi menginput diagnosa dan juga
  // estimasi harga dan waktu"); estimasi HARGA sudah punya rumahnya sendiri
  // di daftar biaya, jadi tidak diduplikasi di sini.
  diagnosisEditing = $state(false);
  diagnosisDraft = $state('');
  // Sama seperti field nominal: <input type="number"> menulis balik number/null.
  durationDraft = $state<string | number | null>('');
  diagnosisLoading = $state(false);

  openDiagnosisEdit() {
    this.diagnosisDraft = this.ticket?.diagnosis || '';
    this.durationDraft = this.ticket?.estimatedDurationMinutes ? String(this.ticket.estimatedDurationMinutes) : '';
    this.diagnosisEditing = true;
  }

  /** "90" -> "1 jam 30 menit"; dipakai di tampilan & (nanti) dokumen cetak. */
  get estimatedDurationText(): string {
    const total = this.ticket?.estimatedDurationMinutes;
    if (!total) return '';
    const days = Math.floor(total / (60 * 24));
    const hours = Math.floor((total % (60 * 24)) / 60);
    const minutes = total % 60;
    const parts: string[] = [];
    if (days) parts.push(`${days} hari`);
    if (hours) parts.push(`${hours} jam`);
    if (minutes) parts.push(`${minutes} menit`);
    return parts.join(' ');
  }

  async saveDiagnosis() {
    this.diagnosisLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/intake-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({
          diagnosis: this.diagnosisDraft || null,
          estimatedDurationMinutes:
            this.durationDraft === null || this.durationDraft === undefined || String(this.durationDraft).trim() === ''
              ? null
              : Number(this.durationDraft),
        })
      });
      const result = await res.json();
      if (res.ok) {
        this.diagnosisEditing = false;
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal menyimpan diagnosa';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.diagnosisLoading = false; }
  }

  complaintEditing = $state(false);
  complaintDraft = $state('');
  complaintLoading = $state(false);

  openComplaintEdit() {
    this.complaintDraft = this.ticket?.reportedComplaint || '';
    this.complaintEditing = true;
  }

  async saveComplaint() {
    this.complaintLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/intake-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ reportedComplaint: this.complaintDraft || null })
      });
      const result = await res.json();
      if (res.ok) {
        this.complaintEditing = false;
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal menyimpan keluhan';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.complaintLoading = false; }
  }

  // Tahap A — go-live gap Tier-1 #3 (print triggers). Tahap B: pemicunya tak
  // lagi ditulis di sini sama sekali — lihat printableTicketDocuments di atas,
  // yang membacanya dari konfigurasi template.
  get canPrintLabel() {
    return this.printableTicketDocuments.includes('label');
  }

  get canPrintTandaTerima() {
    return this.printableTicketDocuments.includes('tanda_terima');
  }

  // Tahap B — pesan hasil auto-cetak. Kosong saat semuanya tercetak: kertas
  // yang keluar dari printer sudah jadi buktinya sendiri, tak perlu banner.
  autoPrintMessage = $state('');
  private autoPrintDone = false;

  /**
   * Cetak otomatis dokumen yang DIKONFIGURASI di node saat ini
   * (`flow_nodes.autoPrintDocuments`). Dipakai dua kali: begitu intake
   * tersimpan, dan tiap kali tiket berpindah tahap. Toko yang ingin nota
   * keluar di tahap lain cukup mengubah templatenya — tak ada daftar dokumen
   * yang tertanam di sini.
   *
   * Dicetak berurutan, bukan paralel: satu printer thermal memproses satu job
   * pada satu waktu, dan urutan konfigurasi menentukan urutan kertas keluar.
   */
  async autoPrintForCurrentNode() {
    if (!this.ticket || !this.currentNode) return;
    const docs = this.autoPrintDocsFor(this.currentNode);
    if (docs.length === 0) {
      this.autoPrintMessage = '';
      return;
    }

    const results: Array<{ label: string; result: Awaited<ReturnType<typeof autoPrint>> }> = [];
    for (const doc of docs) {
      results.push({
        label: DOCUMENT_LABELS[doc] ?? doc,
        result: await autoPrint(this.token, doc as any, this.ticket.id),
      });
    }
    this.autoPrintMessage = summarizeAutoPrint(results) ?? '';
  }

  /** Dipanggil sekali saat tiba dari form intake (`?autoprint=intake`). */
  async autoPrintIntakeDocuments() {
    if (this.autoPrintDone) return;
    this.autoPrintDone = true;
    await this.autoPrintForCurrentNode();
  }

  /** Tahap B — cetak nota otomatis setelah faktur servis dibuat. */
  async printNota(invoiceId: string) {
    const result = await autoPrint(this.token, 'receipt', invoiceId);
    this.autoPrintMessage = summarizeAutoPrint([{ label: 'Nota', result }]) ?? '';
  }

  get invoice() { return this.data.data?.invoice ?? null; }

  // ---------------------------------------------------------------------------
  // Tahap B — GERBANG TAHAP DIBACA DARI TEMPLATE, bukan dari kode.
  //
  // Keputusan pemilik 2026-07-27: "template flow service ini inti dari semua
  // alur servicenya ... bisa diatur sesuai keputusan toko atau kebijakan owner".
  // Karena itu tak satu pun aturan di bawah menebak dari nama atau urutan node;
  // semuanya membaca kolom kapabilitas di flow_nodes yang diatur per template.
  // Mengubah kebijakan toko = mengubah template, bukan mengubah kode ini.
  // ---------------------------------------------------------------------------

  /** Sparepart & biaya boleh diisi di tahap ini? (`flow_nodes.allowsCharges`) */
  get chargesUnlocked(): boolean {
    return this.currentNode?.allowsCharges === true;
  }

  /** Form hasil diagnosa + estimasi waktu ditampilkan di tahap ini? */
  get diagnosisRequired(): boolean {
    return this.currentNode?.requiresDiagnosis === true;
  }

  /** Faktur & pembayaran boleh dibuat di tahap ini? (`flow_nodes.allowsInvoicing`) */
  get atEndOfFlow(): boolean {
    return this.currentNode?.allowsInvoicing === true;
  }

  // ---------------------------------------------------------------------------
  // Daftar periksa (QC) — item ditentukan template, jawabannya milik tiket ini.
  // ---------------------------------------------------------------------------

  /** Centangan yang sedang disunting, per itemId. Kosong = ikut nilai tersimpan. */
  checklistDraft = $state<Record<string, { checked: boolean; note: string }>>({});
  checklistLoading = $state(false);
  checklistSavedMsg = $state('');

  /** Daftar periksa tahap SAAT INI (null bila tahap ini tak punya). */
  get checklist(): any | null {
    return this.data.data?.checklist ?? null;
  }

  /** Daftar periksa tahap-tahap yang sudah dilewati — bukti, jangan disembunyikan. */
  get checklistHistory(): any[] {
    return this.data.data?.checklistHistory ?? [];
  }

  checklistValue(itemId: string): { checked: boolean; note: string } {
    const draft = this.checklistDraft[itemId];
    if (draft) return draft;
    const line = (this.checklist?.lines ?? []).find((l: any) => l.itemId === itemId);
    return { checked: !!line?.checked, note: line?.note ?? '' };
  }

  setChecklistValue(itemId: string, patch: Partial<{ checked: boolean; note: string }>) {
    const current = this.checklistValue(itemId);
    this.checklistDraft = { ...this.checklistDraft, [itemId]: { ...current, ...patch } };
    this.checklistSavedMsg = '';
  }

  async saveChecklist() {
    const checklist = this.checklist;
    if (!checklist) return;
    this.checklistLoading = true;
    this.errorMsg = '';
    this.checklistSavedMsg = '';
    try {
      // Item yang sudah dihapus dari template tidak ikut dikirim — server
      // memang menolaknya, dan jawaban lamanya tetap tersimpan sebagai bukti.
      const answers = checklist.lines
        .filter((l: any) => !l.removedFromTemplate)
        .map((l: any) => {
          const v = this.checklistValue(l.itemId);
          return { itemId: l.itemId, checked: v.checked, note: v.note.trim() || null };
        });
      if (answers.length === 0) return;

      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ nodeId: checklist.nodeId, answers }),
      });
      const result = await res.json();
      if (res.ok) {
        this.checklistDraft = {};
        this.checklistSavedMsg = 'Hasil pemeriksaan tersimpan.';
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal menyimpan hasil pemeriksaan';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.checklistLoading = false; }
  }

  /** Tahap paling awal template ini — dipakai hanya untuk teks penjelas gerbang. */
  get firstChargeNodeName(): string | null {
    const node = (this.template?.nodes ?? []).find((n: any) => n.allowsCharges);
    return node?.name ?? null;
  }

  /** Dokumen yang otomatis dicetak saat tiket MASUK node tertentu. */
  private autoPrintDocsFor(node: any): string[] {
    const docs = node?.autoPrintDocuments;
    return Array.isArray(docs) ? docs : [];
  }

  /**
   * Dokumen tiket yang boleh dicetak ulang manual = dokumen yang pernah relevan
   * bagi tiket INI, yaitu yang dikonfigurasi di node-node yang sudah dilewati.
   * Efeknya persis kebijakan pemilik tanpa satu pun `if` khusus: tiket Ditunggu
   * tak pernah melewati node yang mencetak tanda terima, jadi tombolnya memang
   * tak pernah muncul untuknya.
   */
  get printableTicketDocuments(): string[] {
    const nodes = this.template?.nodes ?? [];
    const visitedNames = new Set(this.history.map((h: any) => h.nodeName));
    const docs = new Set<string>();
    for (const node of nodes) {
      if (!visitedNames.has(node.name)) continue;
      for (const doc of this.autoPrintDocsFor(node)) docs.add(doc);
    }
    return [...docs];
  }

  // Tahap A — device catalog. Null when the asset isn't linked to a catalog
  // entry (the common case: freeform brand/model text with no match yet).
  get deviceModel() { return this.data.data?.deviceModel ?? null; }

  // H7 — Charges
  chargeForm = $state<{ sourceType: 'part' | 'labor' | 'fee'; inventoryItemId: string; description: string; quantity: number; unitPrice: string }>({
    sourceType: 'part', inventoryItemId: '', description: '', quantity: 1, unitPrice: ''
  });
  chargeLoading = $state(false);

  get charges() { return this.data.charges?.charges || []; }
  get chargeTotals() { return this.data.charges?.totals || { estimated: 0, approved: 0, consumed: 0 }; }
  get chargeMargin() { return this.data.charges?.margin || { revenue: 0, cost: 0, margin: 0 }; }
  get inventoryItems() { return this.data.inventoryItems || []; }
  // Tahap B — null untuk peran non-admin (endpointnya admin-only); UI cukup
  // tidak menampilkan petunjuknya, bukan menebak nilainya.
  get invoiceDisplayMode(): 'detailed' | 'summary' | 'flexible' | null {
    return this.data.invoiceDisplayMode ?? null;
  }
  // A quote has already been requested once the ticket carries an approved total.
  get isQuoted() { return this.ticket?.approvedTotal != null; }

  // -------------------------------------------------------------------------
  // R1.9-T4 — perkiraan KONTER vs estimasi TEKNISI, berdampingan.
  //
  // Pemilik memilih tafsir (b): keduanya disimpan, angka konter tidak bisa
  // diubah. Yang berguna bukan salah satunya, melainkan SELISIHNYA —
  // "dijanjikan 450rb, ternyata 700rb" adalah percakapan yang harus dilakukan
  // kasir dengan pelanggan, dan ia hanya bisa melakukannya kalau melihat
  // keduanya di satu layar.
  //
  // Estimasi teknisi TIDAK disimpan di kolom baru: ia sudah hidup sebagai
  // jumlah baris `ticket_charges` (-> kuotasi), mesin yang sudah dibangun dan
  // sudah diuji. Menambah kolom kedua yang berisi angka yang sama adalah dua
  // sumber kebenaran untuk satu nilai.
  // -------------------------------------------------------------------------

  /** Angka yang disebut kasir di konter, atau null bila memang tak disebutkan. */
  get perkiraanKonter(): number | null {
    const nilai = this.ticket?.intakeEstimatedCost;
    return nilai === null || nilai === undefined ? null : Number(nilai);
  }

  /** Estimasi teknisi = total baris biaya. 0 berarti belum ada baris sama sekali. */
  get estimasiTeknisi(): number | null {
    const total = Number(this.chargeTotals.estimated || 0);
    return total > 0 ? total : null;
  }

  /** Positif = lebih mahal dari yang dijanjikan. Null bila salah satunya belum ada. */
  get selisihEstimasi(): number | null {
    if (this.perkiraanKonter === null || this.estimasiTeknisi === null) return null;
    return this.estimasiTeknisi - this.perkiraanKonter;
  }

  // ---------------------------------------------------------------------------
  // R1.10-T1 — perkiraan konter akhirnya bisa DIBETULKAN dari layar.
  //
  // R1.9-T4 membangun aturannya di backend dengan benar (boleh diubah selagi di
  // tahap Penerimaan, lalu 422 INTAKE_ESTIMATE_LOCKED) dan membuktikannya lewat
  // curl + `page.request.patch`. Yang tidak pernah dibuat adalah kontrolnya,
  // jadi pemilik menjalankan uji R1.9 dan bertanya "di bagian mana saya bisa
  // merubahnya?" — poin E2, dan E3 ikut tak bisa dijalankan karenanya.
  //
  // Ini kali KETIGA bentuk cacat yang sama (R1: izin ada, baris menu tidak;
  // R1.7-T1: komentar menyebut pengecualian, barisnya tak ditulis). Ketiganya
  // lolos karena tesnya memanggil API alih-alih menekan tombol — karena itu tes
  // R1.10 untuk fitur ini WAJIB lewat layar.
  // ---------------------------------------------------------------------------

  perkiraanEditing = $state(false);
  perkiraanDraft = $state<string | number | null>('');
  perkiraanLoading = $state(false);

  /**
   * Boleh diubah hanya selagi tiket di tahap Penerimaan.
   *
   * Diturunkan dari `stage_kind` — SUMBER YANG SAMA yang dipakai gerbang di
   * `modules/tickets/service.ts`, bukan dari nama tahap ("Intake") yang bisa
   * diganti pemilik lewat editor alur, dan bukan tebakan terpisah yang bisa
   * berbeda dari backend. Kalau ini salah, yang terjadi cuma tombol tak muncul;
   * uang tetap dijaga backend.
   */
  get perkiraanBolehDiubah(): boolean {
    return this.currentNode?.stageKind === 'penerimaan';
  }

  openPerkiraanEdit() {
    this.perkiraanDraft = this.perkiraanKonter === null ? '' : String(this.perkiraanKonter);
    this.perkiraanEditing = true;
  }

  async savePerkiraan() {
    this.perkiraanLoading = true;
    this.errorMsg = '';
    try {
      // Kosong = "tidak jadi menyebut angka di konter", bukan nol rupiah.
      // Backend menerima null dan mengosongkan kolomnya.
      const nilai =
        this.perkiraanDraft === null ||
        this.perkiraanDraft === undefined ||
        String(this.perkiraanDraft).trim() === ''
          ? null
          : Number(this.perkiraanDraft);

      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/intake-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ intakeEstimatedCost: nilai })
      });
      const result = await res.json();
      if (res.ok) {
        this.perkiraanEditing = false;
        await invalidateAll();
      } else {
        // Pesan server ditampilkan APA ADANYA — termasuk INTAKE_ESTIMATE_LOCKED
        // bila tiketnya sempat dimajukan di tab lain. Menelannya akan membuat
        // tombol Simpan seolah tak melakukan apa-apa.
        this.errorMsg = result.error?.message || 'Gagal menyimpan perkiraan biaya';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.perkiraanLoading = false; }
  }

  resetChargeForm() {
    this.chargeForm = { sourceType: 'part', inventoryItemId: '', description: '', quantity: 1, unitPrice: '' };
  }

  private chargeHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` };
  }

  async addCharge() {
    const f = this.chargeForm;
    const payload: any = { sourceType: f.sourceType, quantity: Number(f.quantity) };
    if (f.sourceType === 'part') {
      if (!f.inventoryItemId) { this.errorMsg = 'Pilih sparepart terlebih dahulu'; return; }
      payload.inventoryItemId = f.inventoryItemId;
      if (f.description) payload.description = f.description;
      if (f.unitPrice !== '') payload.unitPrice = Number(f.unitPrice); // else backend defaults from selling price
    } else {
      if (!f.description) { this.errorMsg = 'Isi deskripsi jasa/biaya'; return; }
      payload.description = f.description;
      payload.unitPrice = Number(f.unitPrice || 0);
    }

    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges`, {
        method: 'POST', headers: this.chargeHeaders(), body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) { this.resetChargeForm(); await invalidateAll(); }
      else this.errorMsg = result.error?.message || 'Gagal menambah biaya';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  async deleteCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}`, {
        method: 'DELETE', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal menghapus biaya';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  // H13 — one key per charge id, minted on the first attempt and reused by a
  // retry of that SAME attempt. Cleared on success so a later consume of the
  // same charge id (return → re-consume) mints a genuinely new key instead of
  // replaying the earlier, no-longer-applicable response.
  private consumeIdempotencyKeys = new Map<string, string>();

  // H9 — physically deduct/restore an approved part charge from FIFO stock
  async consumeCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    if (!this.consumeIdempotencyKeys.has(id)) {
      this.consumeIdempotencyKeys.set(id, crypto.randomUUID());
    }
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}/consume`, {
        method: 'POST',
        headers: { ...this.chargeHeaders(), 'Idempotency-Key': this.consumeIdempotencyKeys.get(id)! }
      });
      const result = await res.json();
      if (res.ok) {
        this.consumeIdempotencyKeys.delete(id);
        await invalidateAll();
      }
      else this.errorMsg = result.error?.message || 'Gagal memakai sparepart';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  async returnCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}/return`, {
        method: 'POST', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal mengembalikan sparepart';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  // H10 — cancel an approved charge before it's consumed, releasing its stock reservation
  async cancelCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}/cancel`, {
        method: 'POST', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal membatalkan biaya';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  async requestApproval() {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/quotation`, {
        method: 'POST', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal meminta persetujuan';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  // H17 — service invoice from the ticket. A part is billable once consumed;
  // labor/fee once approved. Mirrors isBillableCharge() in the backend service.
  get canInvoice() {
    // Tahap B — selain ada yang layak ditagih, tiket juga harus sudah sampai
    // ujung alur. Menagih di tengah pengerjaan adalah persis yang diminta
    // pemilik untuk dihentikan ("pembayaran di bagian akhir saja").
    if (!this.atEndOfFlow) return false;
    return this.charges.some((c: any) =>
      (c.sourceType === 'part' && c.status === 'consumed') ||
      ((c.sourceType === 'labor' || c.sourceType === 'fee') && c.status === 'approved')
    );
  }

  invoicePaymentMethod = $state<'cash' | 'transfer' | 'qris' | 'tempo'>('tempo');
  // Tahap B — uang tunai diterima, pola & jebakan yang sama dengan checkout POS:
  // `bind:value` pada <input type="number"> menulis balik number/null, bukan
  // string, jadi tipenya harus longgar dan parsingnya tak boleh mengasumsikan
  // string. "Belum diketik" tetap berbeda dari "0".
  invoiceAmountTendered = $state<string | number | null>('');

  get invoiceIsCash() { return this.invoicePaymentMethod === 'cash'; }

  /** Total yang akan ditagih = charge yang layak tagih (cermin isBillableCharge di backend). */
  get billableTotal(): number {
    return this.charges
      .filter((c: any) =>
        (c.sourceType === 'part' && c.status === 'consumed') ||
        ((c.sourceType === 'labor' || c.sourceType === 'fee') && c.status === 'approved')
      )
      .reduce((sum: number, c: any) => sum + c.quantity * parseFloat(c.unitPrice), 0);
  }

  get invoiceTendered(): number | null {
    const raw = this.invoiceAmountTendered;
    if (raw === null || raw === undefined || String(raw).trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  get invoiceChange(): number {
    const t = this.invoiceTendered;
    return t === null ? 0 : Math.round(t - this.billableTotal);
  }

  get invoiceTenderShort(): boolean {
    const t = this.invoiceTendered;
    return this.invoiceIsCash && t !== null && t < this.billableTotal;
  }
  // H13 pattern — minted when the invoice action starts, reused across retries,
  // cleared on success so a later (blocked) retry doesn't replay a stale response.
  private invoiceIdempotencyKey = '';

  async generateInvoice() {
    // Echo cepat dari INSUFFICIENT_TENDER di backend (lib/cash.ts tetap penjaga).
    if (this.invoiceTenderShort) {
      this.errorMsg = 'Uang yang diterima kurang dari total tagihan';
      return;
    }
    this.chargeLoading = true;
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.invoiceIdempotencyKey) this.invoiceIdempotencyKey = crypto.randomUUID();
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/invoice`, {
        method: 'POST',
        headers: { ...this.chargeHeaders(), 'Idempotency-Key': this.invoiceIdempotencyKey },
        body: JSON.stringify({
          paymentMethod: this.invoicePaymentMethod,
          amountTendered: this.invoiceIsCash && this.invoiceTendered !== null ? this.invoiceTendered : undefined,
        })
      });
      const result = await res.json();
      if (res.ok) {
        this.invoiceIdempotencyKey = '';
        this.invoiceAmountTendered = '';
        this.successMsg = `Faktur dibuat: ${result.data.invoiceNumber}`;
        // Tahap B — nota langsung dicetak, sama seperti struk POS. Tidak
        // di-await: faktur sudah ter-commit, printer lambat/mati tidak boleh
        // menahan layar kembali responsif.
        void this.printNota(result.data.id);
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal membuat faktur';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  get availableTransitions() {
    if (!this.template || !this.currentNode) return [];
    return this.template.transitions
      .filter((t: any) => t.fromNodeId === this.currentNode.id)
      .map((t: any) => {
        const target = this.template.nodes.find((n: any) => n.id === t.toNodeId);
        return { ...t, targetNodeName: target?.name || 'Unknown' };
      });
  }

  // H13 — sets the target AND mints a fresh idempotency key: picking a
  // transition is "starting a new action". Executing (possibly retried) reuses it.
  selectTransition(nodeId: string) {
    this.selectedTransition = nodeId;
    this.transitionIdempotencyKey = nodeId ? crypto.randomUUID() : '';
  }

  async executeTransition() {
    if (!this.selectedTransition) return;
    this.loading = true;
    this.errorMsg = '';

    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Idempotency-Key': this.transitionIdempotencyKey || crypto.randomUUID()
        },
        body: JSON.stringify({
          targetNodeId: this.selectedTransition,
          notes: this.transitionNotes
        })
      });

      const result = await res.json();
      if (res.ok) {
        this.selectedTransition = '';
        this.transitionNotes = '';
        this.transitionIdempotencyKey = '';
        await invalidateAll();
        // Tahap B — tahap baru mungkin mengonfigurasi dokumen untuk dicetak
        // (mis. "Unit Disimpan" → tanda terima + label). Dijalankan setelah
        // invalidateAll() supaya currentNode sudah tahap yang baru.
        void this.autoPrintForCurrentNode();
      } else {
        this.errorMsg = result.error?.message || 'Transition failed. You might not have the required role.';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }

  // F3 — SVC-013: cancel the ticket. Mirrors canCancelTicket() in the backend
  // service (open-only) purely for UI gating; the API is the real guard.
  get canCancel() { return this.ticket?.status === 'open'; }
  showCancelModal = $state(false);
  cancelReason = $state('');
  cancelLoading = $state(false);

  openCancelModal() {
    this.cancelReason = '';
    this.errorMsg = '';
    this.showCancelModal = true;
  }

  async confirmCancelTicket() {
    if (!this.cancelReason.trim()) { this.errorMsg = 'Alasan pembatalan wajib diisi'; return; }
    this.cancelLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ reason: this.cancelReason })
      });
      const result = await res.json();
      if (res.ok) {
        this.showCancelModal = false;
        this.successMsg = result.data?.consumedPartsLeftBehind
          ? `Tiket dibatalkan. Perhatian: ${result.data.consumedPartsLeftBehind} sparepart yang sudah terpasang tidak otomatis dikembalikan ke stok.`
          : 'Tiket berhasil dibatalkan.';
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal membatalkan tiket';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.cancelLoading = false; }
  }

  openEditCustomer() {
    this.editCustomerData = { name: this.customer.name, phone: this.customer.phone || '', email: this.customer.email || '' };
    this.showEditWarning = true;
  }
  
  proceedToEdit() {
    this.showEditWarning = false;
    this.showEditForm = true;
  }

  async saveCustomer() {
    this.loading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/customers/${this.customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(this.editCustomerData)
      });
      
      const result = await res.json();
      if (res.ok) {
        this.showEditForm = false;
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Failed to update customer';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }
}
