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
| [`tahap-b-peran-dan-qc.md`](tahap-b-peran-dan-qc.md) | **Rencana teknis yang sedang dikerjakan** — Fase R1–R5: peran, halaman tiket per peran, QC, retur | 🟢 Aktif |
| [`R1.5-perbaikan-hasil-uji-R1.md`](R1.5-perbaikan-hasil-uji-R1.md) | Rencana + bukti perbaikan dari catatan uji R1 | ✅ Selesai, menunggu ditutup |
| [`R1.6-perbaikan-hasil-uji-R1.5.md`](R1.6-perbaikan-hasil-uji-R1.5.md) | **Rencana + bukti perbaikan dari catatan uji R1.5** | 🟢 Kode selesai |
| [`uji-00-kondisi-sekarang.md`](uji-00-kondisi-sekarang.md) | Uji aplikasi **apa adanya hari ini** — semua area, ~150 poin | 📋 Opsional, kapan saja |
| [`uji-R1-peran-akses.md`](uji-R1-peran-akses.md) | Uji khusus Fase R1 | ✅ Sudah diisi pemilik |
| [`uji-R1.5-perbaikan.md`](uji-R1.5-perbaikan.md) | Uji khusus Fase R1.5 | ✅ Sudah diisi pemilik |
| [`uji-R1.6-perbaikan.md`](uji-R1.6-perbaikan.md) | Uji khusus Fase R1.6 | 🔴 **SIAP DIJALANKAN** |

**Checklist uji R2 dan R3 sengaja belum ditulis** — isinya akan menyesuaikan catatan pemilik
dari fase sebelumnya. Menulisnya sekarang berarti menebak.

---

## Status sekarang

**Branch:** `go-live/tahap-b` · **Baseline:** 285 unit + 21 e2e API backend hijau (dicek 2026-08-01)

```
R1   Peran & akses                ✅ SELESAI 2026-07-31 — sudah diuji pemilik
R1.5 Perbaikan hasil uji R1       ✅ SELESAI 2026-08-01 — sudah diuji pemilik
R1.6 Perbaikan hasil uji R1.5     ✅ SELESAI 2026-08-01 — menunggu uji manual pemilik
R2   Halaman tiket per peran      ⏳ menunggu catatan uji R1.6 (isi uji-R1.6-perbaikan.md)
R3   QC jadi modul sendiri        ⏳ menunggu catatan uji R2
R4   Bersih-bersih hasil audit    🟢 kecil, bisa disisipkan kapan saja
R5   Retur (pelanggan + supplier) ⏸️  menunggu bentuk retur nyata dari pilot
```

**Yang sudah masuk antrian R2 dari catatan pemilik** (jangan hilang saat R2 ditulis):
form **per tahap** alih-alih semua di halaman detail (uji-R1.5 E1); **tiket tidak boleh maju
sebelum data tahapnya lengkap** (E3 — dikonfirmasi langsung ke pemilik); alur baru *"setelah
diagnosis tiket kembali ke kasir; kasir memilih alurnya dan nota servis keluar dari kasir,
bukan teknisi"*; tombol **"minta pindah teknisi"** (boleh di-assign manajer **atau** diambil
teknisi lain); laporan bulanan teknisi berisi **unit berhasil / unit gagal / unit garansi /
sisa pekerjaan**. Semuanya menunggu satu masukan pemilik: **apa yang wajib terisi di tiap
tahap** — pertanyaannya sudah disiapkan di akhir `uji-R1.6-perbaikan.md`.

### Dikerjakan pemilik, tanpa kode

- **6D.1 — Test cetak fisik.** Seluruh jalur cetak dibangun & diuji **tanpa hardware**.
  "Kertas benar-benar keluar dan terpotong" belum pernah dibuktikan siapa pun. Checklist di
  `printer-agent/README.md`; poin **2.15** di `uji-00-kondisi-sekarang.md`.
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
