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
| [`riwayat-R1-sampai-R1.7.md`](riwayat-R1-sampai-R1.7.md) | **Cerita lengkap R1 → R1.7**: apa yang direncanakan, apa yang pemilik temukan saat mengujinya, apa yang berubah karenanya. Menggantikan 5 berkas terpisah | 📖 Rujukan, jangan dihapus |
| [`uji-00-kondisi-sekarang.md`](uji-00-kondisi-sekarang.md) | Uji aplikasi **apa adanya hari ini** — semua area, ~150 poin | 📋 Opsional, kapan saja |
| [`uji-R1.7-perbaikan.md`](uji-R1.7-perbaikan.md) | Uji khusus Fase R1.7 | ✅ Sudah diisi pemilik 2026-08-02 |
| [`R1.8-perbaikan-hasil-uji-R1.7.md`](R1.8-perbaikan-hasil-uji-R1.7.md) | **Rencana aktif** — T1–T4 + dua keputusan yang ditahan + pertanyaan R2 yang dibalik bentuknya | 🟢 Aktif |

**Checklist uji R2 dan R3 sengaja belum ditulis** — isinya akan menyesuaikan catatan pemilik
dari fase sebelumnya. Menulisnya sekarang berarti menebak.

---

## Status sekarang

**Branch:** `go-live/tahap-b` · **Baseline:** 288 unit + 21 e2e API backend hijau (dicek 2026-08-01)

```
R1   Peran & akses                ✅ SELESAI 2026-07-31 — sudah diuji pemilik
R1.5 Perbaikan hasil uji R1       ✅ SELESAI 2026-08-01 — sudah diuji pemilik
R1.6 Perbaikan hasil uji R1.5     ✅ SELESAI 2026-08-01 — sudah diuji pemilik
R1.7 Perbaikan hasil uji R1.6     ✅ SELESAI 2026-08-01 — sudah diuji pemilik (14/18 lulus bersih)
R1.8 Perbaikan hasil uji R1.7     🟢 RENCANA SIAP - 2 keputusan pemilik menentukan cakupannya
R2   Halaman tiket per peran      ⛔ TERKUNCI - butuh aturan per tahap dari pemilik
R3   QC jadi modul sendiri        ⏳ menunggu catatan uji R2
R4   Bersih-bersih hasil audit    🟢 kecil, bisa disisipkan kapan saja
R5   Retur (pelanggan + supplier) ⏸️  menunggu bentuk retur nyata dari pilot
```

**⛔ Kenapa R2 TERKUNCI, bukan sekadar "menunggu".** Daftar isinya sudah lengkap dan
terkumpul dari tiga putaran uji (rinciannya di
[`riwayat-R1-sampai-R1.7.md`](riwayat-R1-sampai-R1.7.md) bagian akhir): form per tahap,
alur "setelah diagnosis kembali ke kasir", tombol minta pindah teknisi, laporan bulanan
teknisi, teknisi tidak melihat harga modal.

Satu butir menghalangi sisanya: **"tiket tidak boleh maju sebelum data tahapnya lengkap"**
menuntut pemilik menentukan **apa yang wajib terisi di tiap tahap**.

**Pertanyaannya diubah bentuk 2026-08-02** setelah tiga kali diajukan sebagai tabel kosong
dan tak pernah diisi. Itu kesalahan cara bertanya, bukan kelalaian pemilik: tabel kosong
menuntut merancang aturan dari nol, sementara pemilik menjawabnya dengan mudah begitu
pertanyaannya konkret dan sedang dipakai — poin D1 di uji R1.7 (*"buat keluhan / kerusakan
jadi kolom wajib di isi"*) sebenarnya adalah jawaban baris pertama tabel itu, ditulis
sambil menguji. Sekarang agent yang mengusulkan isi kelima barisnya, pemilik tinggal
membenarkan atau mencoret per baris — lihat
[`R1.8-perbaikan-hasil-uji-R1.7.md`](R1.8-perbaikan-hasil-uji-R1.7.md).

Menebaknya lalu menegakkan tebakan itu **persis kesalahan yang S5 sudah pernah buat dan
cabut** — gerbang penagihan dipasang berdasarkan `allowsInvoicing` hasil backfill, lalu
dicabut setelah 2 tes e2e menabraknya dan ternyata tes-nya yang benar.

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
