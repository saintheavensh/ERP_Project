# `plan/` — Peta Kerja FlowServ

> **`PHASES.md` (root) tetap sumber kebenaran status per-task.** Folder ini adalah peta
> prioritas di atasnya, plus checklist uji manual yang diisi pemilik.
>
> **Konvensi:** sebuah berkas rencana hidup **hanya selama tugasnya aktif**. Begitu selesai,
> berkasnya **dihapus** — bukti durable pindah ke `PHASES.md` dan tersimpan selamanya di
> git history. Jadi tautan `plan/…md` di `PHASES.md` yang mengarah ke berkas yang tak ada
> lagi itu **wajar** — penanda sejarah, bukan tautan rusak.

---

## Cara kerja kami (disepakati 2026-07-31)

```
   ┌────────────────────────────────────────────────────────────┐
   │ 1. Saya kerjakan SATU fase saja, sampai selesai + bertes    │
   │ 2. Saya bikin checklist uji manual khusus fase itu          │
   │ 3. Anda jalankan, isi kolom "Catatan saya"                  │
   │ 4. Anda bilang "sudah saya uji"                             │
   │ 5. Saya BACA catatan Anda dulu                              │
   │ 6. Perbaiki yang gagal ATAU lanjut ke fase berikutnya       │
   └────────────────────────────────────────────────────────────┘
```

**Kenapa ini penting, bukan sekadar formalitas:** pada 2026-07-20 ditemukan **tujuh task
ditandai selesai untuk kode yang tak pernah ditulis** — semuanya ditulis dengan itikad baik
oleh orang yang baru mengetik kode dan belum menjalankannya. Aturan "Definition of Done" di
`PHASES.md` lahir dari situ. Langkah 3–5 di atas adalah penegakan aturan itu **oleh
pemilik**, bukan agent menilai pekerjaannya sendiri.

Bug yang ditemukan 2026-07-31 adalah contohnya: tak ada tes yang gagal, TypeScript bersih,
262 unit test hijau — **tapi kasir tetap tidak bisa menerima unit servis.** Hanya pemakaian
nyata yang bisa menemukan yang seperti itu.

**Konsekuensi untuk agent:** jangan pernah mengerjakan dua fase sekaligus, dan jangan mulai
fase berikutnya sebelum catatan uji fase sebelumnya dibaca.

---

## Isi folder ini

| Berkas | Isi | Status |
|---|---|---|
| [`go-live-plan.md`](go-live-plan.md) | **Konteks toko** dari wawancara pemilik 2026-07-24 — jenis usaha, jumlah cabang, cara bayar, cara gaji teknisi, kenapa pindah dari `pos_sederhana` | 📖 Rujukan, jangan dihapus |
| [`go-live-tahap-b-onward.md`](go-live-tahap-b-onward.md) | Peta prioritas besar menuju pilot 1 cabang (Milestone 0 / B / C / D / E) | 🟢 Aktif |
| [`tahap-b-peran-dan-qc.md`](tahap-b-peran-dan-qc.md) | **Rencana teknis yang sedang dikerjakan** — Fase R1–R6: peran, halaman tiket per peran, QC, retur, buka/tutup kasir | 🟢 Aktif |
| [`R1.9-perbaikan-hasil-uji-R1.8.md`](R1.9-perbaikan-hasil-uji-R1.8.md) | Rencana **+ bukti** fase R1.9 — T1–T6 dari catatan uji R1.8 pemilik | ✅ **Kode selesai 2026-08-04** |
| [`uji-R1.9-perbaikan.md`](uji-R1.9-perbaikan.md) | **Checklist uji manual pemilik untuk R1.9** — 7 bagian (A–G) + 3 pertanyaan terbuka | 🔴 **MENUNGGU PEMILIK** ← gerbang R2 |
| [`riwayat-R1-sampai-R1.7.md`](riwayat-R1-sampai-R1.7.md) | **Cerita lengkap R1 → R1.8**: apa yang direncanakan, apa yang pemilik temukan saat mengujinya, apa yang berubah karenanya. Menggantikan 9 berkas terpisah. *(Namanya masih "…sampai-R1.7" supaya rujukan di `PHASES.md` tidak putus.)* | 📖 Rujukan, jangan dihapus |

**Berkas dirapikan 2026-08-04** atas permintaan pemilik ("jika tidak digunakan hapus saja
tapi ingat riwayatnya jangan sampai hilang"): 4 berkas selesai dihapus —
`uji-R1.7-perbaikan.md`, `R1.8-perbaikan-hasil-uji-R1.7.md`, `uji-R1.8-perbaikan.md`
(ketiganya sudah diisi/ditutup) dan `uji-00-kondisi-sekarang.md` (tak pernah dijalankan,
premisnya usang). Ceritanya + kalimat asli pemilik pindah ke `riwayat-R1-sampai-R1.7.md`
bagian **"Berkas yang dihapus"**; teks aslinya tetap utuh di git history karena tiap
catatan uji **di-commit lebih dulu** sebelum berkasnya dihapus.

**Checklist uji R1.9 ditulis 2026-08-04**, setelah kodenya selesai — bukan sebelumnya.
**Checklist R2 dan R3 masih sengaja belum ditulis**: isinya menyesuaikan hasil fase yang
bersangkutan, dan menulisnya sekarang berarti menebak.

---

## Status sekarang

**Branch:** `go-live/tahap-b` · **Baseline:** 304 unit + 21 e2e API + 212 Playwright hijau
(dicek 2026-08-03, DB bersih)

```
R1   Peran & akses                ✅ SELESAI 2026-07-31 — sudah diuji pemilik
R1.5 Perbaikan hasil uji R1       ✅ SELESAI 2026-08-01 — sudah diuji pemilik
R1.6 Perbaikan hasil uji R1.5     ✅ SELESAI 2026-08-01 — sudah diuji pemilik
R1.7 Perbaikan hasil uji R1.6     ✅ SELESAI 2026-08-01 — sudah diuji pemilik (14/18 lulus bersih)
R1.8 Perbaikan hasil uji R1.7     ✅ SELESAI 2026-08-03 — sudah diuji pemilik (A-G, TAK ADA yang gagal)
R1.9 Perbaikan hasil uji R1.8     ✅ KODE SELESAI 2026-08-04 — menunggu uji pemilik (uji-R1.9-perbaikan.md)
R2   Halaman tiket per peran      🔓 TERBUKA 2026-08-04 — aturan per tahap sudah dijawab pemilik
R3   QC jadi modul sendiri        ⏳ menunggu catatan uji R2
R4   Bersih-bersih hasil audit    🟢 kecil, bisa disisipkan kapan saja
R5   Retur (pelanggan + supplier) ⏸️  menunggu bentuk retur nyata dari pilot
R6   Buka/Tutup Kasir (FIN-002)   🆕 diminta pemilik 2026-08-04 — dikerjakan SETELAH R2
```

**R1.8 adalah putaran pertama tanpa satu pun poin GAGAL.** Keenam catatan pemilik yang jadi
R1.9 berbunyi *"sudah benar, dan sekarang saya butuh …"* — kecuali satu yang bug betulan
(**A6**: kasir punya izin `customer.manage` tapi tak punya baris menu ke halaman
Pelanggan — bentuknya persis bug R1 yang memulai cara kerja fase-demi-fase ini).

**🔓 R2 sudah TERBUKA (2026-08-04).** Ia terkunci lima fase lamanya oleh satu butir —
*"tiket tidak boleh maju sebelum data tahapnya lengkap"* — yang menuntut pemilik menentukan
**apa yang wajib terisi di tiap tahap**. Pertanyaannya diajukan **empat kali**: dua kali
sebagai tabel kosong (tak pernah diisi), lalu dua kali sebagai usul-tinggal-dicoret setelah
disimpulkan bahwa tabel kosong menuntut pemilik merancang aturan dari nol. Yang akhirnya
berhasil: **menanyakannya langsung, satu pertanyaan, dengan usul yang sudah jadi.**

Aturan yang disetujui pemilik tanpa koreksi:

| Tahap | Wajib sebelum tombol lanjut boleh ditekan |
|---|---|
| **Terima Unit** (kasir) | nama, no. HP, jenis+merek+model, **keluhan** — ✅ sudah dibangun R1.8-T1 & sudah diuji lulus |
| **Diagnosa** (teknisi) | hasil diagnosa **+ perkiraan biaya** |
| **Pengerjaan** (teknisi) | **tidak ada yang wajib** |
| **QC** | **semua** baris checklist terjawab |
| **Selesai / Serah Terima** (kasir) | nota sudah dibuat; **boleh ada sisa** (tempo) |

Rinciannya + tiga aturan yang mengikat pembangunnya (backend dulu, diturunkan dari
`stage_kind`, dan kenapa baris QC baru berarti setelah R3) ada di
[`R1.9-perbaikan-hasil-uji-R1.8.md`](R1.9-perbaikan-hasil-uji-R1.8.md) dan
[`tahap-b-peran-dan-qc.md`](tahap-b-peran-dan-qc.md) Task R2.4.

**Kenapa tidak ditebak saja dari dulu:** menegakkan tebakan lalu mencabutnya **persis
kesalahan yang S5 sudah pernah buat** — gerbang penagihan dipasang berdasarkan
`allowsInvoicing` hasil backfill, lalu dicabut setelah 2 tes e2e menabraknya dan ternyata
tes-nya yang benar. Menunggu lima fase untuk satu jawaban tetap lebih murah daripada itu.

**Sisa isi R2** (tak perlu dijawab lagi, terkumpul dari empat putaran uji): alur "setelah
diagnosis kembali ke kasir", tombol minta pindah teknisi, laporan bulanan teknisi, teknisi
tidak melihat harga modal.

### Dikerjakan pemilik, tanpa kode

- **6D.1 — Test cetak fisik.** Seluruh jalur cetak dibangun & diuji **tanpa hardware**.
  "Kertas benar-benar keluar dan terpotong" belum pernah dibuktikan siapa pun. Checklist di
  `printer-agent/README.md`.
- **B2.6 — Onboarding stok asli.** Masalah asli pemilik ("stok berantakan"). Mesinnya sudah
  siap (Opname untuk stok awal, PO untuk pembelian rutin). Setelah input, **wajib** jalankan
  `GET /v1/inventory/reconciliation` sampai daftar selisihnya kosong.

---

## Sudah selesai — berkas rencananya dihapus 2026-07-31

Bukti lengkap ada di `PHASES.md` + git history. Dihapus supaya folder ini hanya berisi yang
benar-benar aktif.

| Yang dulu ada di sini | Hasilnya |
|---|---|
| `2026-07-20-architecture-review.md` | Audit yang melahirkan Phase 3.5 + Hardening Track. Semua temuannya sudah dibangun **kecuali retur ke supplier (§5.7)** — dipindahkan ke `tahap-b-peran-dan-qc.md` Fase R5 supaya tidak hilang lagi |
| `phase-6-printer.md` | Phase 6 kode selesai (6A–6C). Sisa 6D.1 = checklist hardware, dilacak di `go-live-tahap-b-onward.md` B2.4 |
| `tahap-a-flow-templates.md` | 2 template alur servis + sandi/pola unit |
| `tahap-a-print-triggers.md` | Pemicu cetak label / tanda terima / nota + kolom keluhan pelanggan |
| `tahap-a-payment-methods.md` | CRUD metode pembayaran + e-wallet (Dana/OVO/GoPay) |
| `tahap-a-device-catalog-invoice-mode.md` | Katalog device + mode tampilan nota |
| `tahap-b-alur-pos-servis.md` | Alur POS & servis dibetulkan mengikuti urutan toko nyata (D4); aturan alur pindah dari kode ke kolom `flow_nodes` |
| `go-live-penyederhanaan.md` | S1–S5: bahasa toko, sidebar 22→6 baris, 6 layar pembelian→1, intake 9→7 kolom, jenis tahap |
| `CARA-PROMPT.md` | Panduan prompt yang merujuk berkas `H*.md` yang sudah lama tidak ada |
