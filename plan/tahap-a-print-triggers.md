# Tahap A — Pemicu Cetak Per-Tahap: Keluhan + Label + Tanda Terima + Nota

> **Status: SELESAI 2026-07-25.** go-live gap Tier-1 #3
> ([`plan/go-live-plan.md`](go-live-plan.md)). Branch `go-live/tahap-a`. Scope penuh
> dipilih pemilik: field keluhan, label, tanda terima, DAN verifikasi nota selesai —
> bukan cuma label saja.

---

## 1. Temuan sebelum desain

Sistem printer (Phase 6) hanya bisa mencetak dokumen bersumber **`pos_invoices`**
(struk & invoice A4) — `modules/printer/document.ts` menolak `'label'` secara
eksplisit dengan `DOCUMENT_TYPE_NOT_SUPPORTED`. Label & tanda-terima adalah
**dokumen level tiket**, dicetak **sebelum** ada invoice (saat diagnosa, sebelum
bayar) — jadi butuh jalur render baru, bukan cuma "aktifkan yang sudah ada".

Lebih dalam: **tidak ada kolom keluhan/kerusakan di skema manapun** — `service_tickets`
tidak punya field itu, padahal SVC-001 di katalog fitur sudah lama menjanjikannya
sebagai bagian MVP intake. Lubang lama yang baru tersingkap oleh tugas ini.

Juga ditemukan: `generateInvoice()` (H17, dari halaman tiket) membuat `pos_invoices`
row nyata, tapi **tidak pernah disurfacekan lagi** di halaman tiket — jadi "nota
selesai" secara teknis bisa dicetak (infrastrukturnya ada), tapi user tak pernah
melihat tombolnya di tempat yang masuk akal (cuma bisa dicari manual di
`/pos/invoices`). Ini juga diperbaiki di tugas ini.

## 2. Desain

- **`service_tickets.reportedComplaint`** (text, nullable) — dicatat opsional di
  intake (textarea "Keluhan / Kerusakan"), bisa diedit kapan saja lewat endpoint
  yang sama dengan sandi/pola (`PATCH /v1/tickets/:id/intake-details`, digeneralisasi
  dari endpoint sandi/pola sebelumnya — dua field kecil serupa jadi satu endpoint,
  bukan dua yang nyaris duplikat).
- **Jalur render baru, terpisah dari invoice**: `modules/printer/ticket-document.ts` —
  `renderTicketDocument()` membaca tiket (bukan invoice), dengan block builder
  KHUSUS untuk `label`/`tanda_terima` (`buildLabelBlocks`/`buildTandaTerimaBlocks`),
  **bukan** lewat `buildDocumentData()`/`renderThermalBlocks()` (`render.ts`) yang
  ada — dua dokumen ini bukan struk transaksi (tak ada item/total bermakna),
  memaksanya lewat pipa itu akan mencetak baris "TOTAL Rp0" yang janggal.
- **Refactor kecil, aman**: `resolveTemplateAndAssignment()` diekstrak dari
  `renderPosInvoiceDocument` ke fungsi bersama di `document.ts` — `renderTicketDocument`
  jadi pemanggil kedua untuk logika resolusi (assignment cabang → fallback default
  tenant) yang persis sama, jadi diekstrak alih-alih diduplikasi. Perilaku
  `renderPosInvoiceDocument` untuk `receipt`/`invoice_a4` **tidak berubah** — hanya
  dipindah, diverifikasi lewat `vitest` + Playwright printer specs tetap hijau.
- **`GET /v1/tickets/:id` sekarang mengembalikan `invoice`** (row `pos_invoices`
  aktif yang terhubung ke tiket ini, atau `null`) — supaya tombol "Cetak Nota"
  bertahan lintas reload, bukan cuma state FE sesaat.
- **Trigger di FE selalu tombol manual** ("Cetak Label"/"Cetak Tanda Terima"/"Cetak
  Nota"), **tidak** auto-print — konsisten dengan setiap aksi cetak lain di app ini
  yang sudah ada (Cetak Struk/Invoice A4 di POS juga selalu klik manual). Tombol
  muncul begitu dokumennya masuk akal untuk dicetak:
  - **Label**: begitu tiket meninggalkan node "Intake" (diagnosa sudah dimulai) —
    berlaku di KEDUA alur.
  - **Tanda Terima**: begitu riwayat tiket pernah masuk node "Unit Disimpan" —
    otomatis hanya muncul di alur Disimpan (Ditunggu tak punya node itu sama sekali).
  - **Nota**: begitu `ticket.invoice` tidak null (invoice sungguhan sudah dibuat).

## 3. Task breakdown

- [x] BE: `service_tickets.reportedComplaint` column.
- [x] BE: `modules/printer/types.ts` — tambah `'tanda_terima'` ke `DOCUMENT_TYPES`.
- [x] BE: `db/seed/08-printer.ts` + `ids.ts` — template `tanda_terima` (80mm,
      isDefault); `label` (58mm) sudah ada dari 6A.1, tinggal dipakai.
- [x] BE: `modules/printer/document.ts` — ekstrak `resolveTemplateAndAssignment()`
      (dipakai bersama), tambah `UNAMBIGUOUS_PAPER_SIZE` map (generalisasi
      kasus khusus invoice_a4 yang sudah ada, sekarang mencakup label=58mm,
      tanda_terima=80mm juga).
- [x] BE: `modules/printer/ticket-document.ts` (baru) — `renderTicketDocument()` +
      `buildLabelBlocks()`/`buildTandaTerimaBlocks()`.
- [x] BE: `routes/print.ts` — branch berdasar `documentType`: ticket-sourced
      (`label`/`tanda_terima`) → `renderTicketDocument`; invoice-sourced
      (`receipt`/`invoice_a4`) → `renderPosInvoiceDocument` (tak berubah).
- [x] BE: `routes/tickets.ts` — intake terima `reportedComplaint`; `GET /:id`
      tambah `invoice`; endpoint `PATCH /:id/device-passcode` (dari task
      sebelumnya, sesi yang sama, belum di-push) digeneralisasi jadi
      `PATCH /:id/intake-details` mencakup kedua field.
- [x] BE: `modules/tickets/service.ts` — `updateIntakeDetails()` (gabung
      `updateDevicePasscode`), `findActiveInvoiceForTicket()`.
- [x] FE: `PrintButton.svelte` — `documentType` union += `label`/`tanda_terima`;
      prop `invoiceId` → `id` (generik, dipakai invoice ATAU ticket id
      tergantung documentType) — 2 pemanggil lama (`InvoiceDetailModal.svelte`)
      diperbarui.
- [x] FE: `IntakeForm.svelte` + `ticket.intake.svelte.ts` — textarea Keluhan/Kerusakan.
- [x] FE: `ticket.detail.svelte.ts` — `saveComplaint()`/`openComplaintEdit()`
      (pola sama `savePasscode()`, endpoint digabung); getter `canPrintLabel`,
      `hasEnteredUnitDisimpan`, `invoice`.
- [x] FE: `TicketWorkspace.svelte` — tampil+edit keluhan (Device box, sub-section
      baru sejajar sandi/pola); card baru "Dokumen Cetak" dengan 3 `PrintButton`
      kondisional.
- [x] Test baru: `tahap-a-print-triggers.spec.ts` — Label muncul setelah
      Diagnosis + isi benar (nama, "Kerusakan: ..."); Tanda Terima HANYA di
      alur Disimpan setelah masuk Unit Disimpan + isi benar; Nota muncul
      setelah invoice sungguhan dibuat (fixture API: intake→diagnosis→charge
      labor→quotation→invoice) + benar-benar bisa dibuka (thermal/A4 preview).
- [x] Verifikasi: `db:reset`, `tsc` bersih, `svelte-check` 729 file 0 error,
      `vitest` 198/198 (nol regresi dari refactor `resolveTemplateAndAssignment`),
      **Playwright 94/94 (full suite, sekali reset db bersih)**.
- [x] Commit + update `go-live-plan.md` gap Tier-1 #3.

## 4. Di luar scope (dicatat agar tak dikira lupa)
- Auto-print (mencetak otomatis tanpa klik) — sengaja tidak dibangun, konsisten
  dengan pola "Cetak" manual yang sudah ada di seluruh app.
- Template A4 untuk label/tanda-terima — MVP thermal-only (58mm/80mm), sesuai
  ukuran fisik yang masuk akal untuk kedua dokumen ini.
- Membedakan "harga awal" (verbal) vs "harga final" (setelah WA) di alur Disimpan
  sebagai dua event terpisah — disederhanakan jadi satu sinyal (`isQuoted`/masuk
  Unit Disimpan) tanpa mengurangi nilai cetak.
