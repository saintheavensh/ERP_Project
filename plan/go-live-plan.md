# FlowServ — Rencana Go-Live (dari obrolan pemilik, 2026-07-24)

> **Sumber:** wawancara terpandu dengan pemilik toko (developer), 2026-07-24. Dokumen ini
> menerjemahkan operasional nyata toko menjadi peta kerja agar FlowServ bisa **menggantikan
> aplikasi lama (`pos_sederhana`)** untuk pemakaian harian. `PHASES.md` tetap sumber
> kebenaran status per-task; dokumen ini adalah peta prioritas di atasnya, berbasis kebutuhan
> nyata (bukan katalog fitur).
>
> **Definition of Done tetap berlaku** (lihat `PHASES.md`): sebuah item hanya `[x]` bila ada
> tes lulus / request+response terekam / click-path yang benar-benar dijalankan.

---

## 1. Konteks toko (yang menentukan prioritas)

- **Jenis usaha:** servis/reparasi (~50%) **dan** jual sparepart/aksesoris (~40%) — dua-duanya
  vital harian. Bukan salah satu.
- **Cabang:** 2–3 cabang (nyata sekarang, bukan rencana).
- **Kondisi sekarang:** operasional masih pakai `pos_sederhana` + pencatatan manual (nota tulis
  tangan). **Motivasi utama pindah = stok berantakan** ("kelupaan ada barang di penyimpanan lain
  → kelebihan stok"). Tujuan: digitalisasi, minimal semua bertransaksi lewat sistem + cetak.
- **Pembayaran:** Tunai, Transfer/QRIS, E-wallet (Dana/OVO/GoPay), Tempo. **Tempo hanya untuk
  sebagian pelanggan** (tidak semua boleh utang).
- **Teknisi:** bayarnya **campuran** — ada yang bagi hasil (komisi per servis), ada yang gaji
  bulanan tetap.
- **Petugas per cabang:** **beda-beda tiap cabang** (kadang satu orang serba bisa, kadang
  terpisah) → RBAC harus fleksibel & per-cabang.
- **Kabari pelanggan:** lewat **WhatsApp** (manual).

---

## 2. Dua alur servis (INTI aplikasi — dikonfirmasi pemilik)

FlowServ dipilih justru karena butuh alur fleksibel. Ada **dua flow template**:

### Alur A — DITUNGGU (pelanggan menunggu di tempat)
1. Terima + diagnosa
2. Beri harga → setuju (lisan, orangnya ada di tempat)
3. QC awal *(opsional)*: cek HP nyala, **foto unit (opsional, tergantung setting)**, catat **sandi/pola**
4. Pembongkaran / pengerjaan
5. Jika ada kerusakan tambahan / diagnosa berbeda → **konfirmasi ulang harga** → setuju → lanjut (*change order*)
6. Selesai → QC akhir (kembalikan sandi/pola)
7. Serahkan langsung ke pelanggan
- **Cetak:** saat **diagnosa + harga** → **label** langsung tercetak (isi: **nama, kerusakan,
  tanggal masuk**) untuk menempel/identifikasi unit; lalu **nota serah-terima** dicetak
  **setelah selesai**. Jadi alur ditunggu = **1 label (di awal) + 1 nota (di akhir)**.

### Alur B — DISIMPAN (unit ditinggal) — sering bercabang dari Alur A di tengah jalan
1. Terima + diagnosa
2. Beri harga awal
3. Pembongkaran
4. Ternyata beda diagnosa & butuh waktu lama → **disarankan disimpan**
5. Harga final dikabari via **WA** (atau saat pelanggan datang lagi) → setuju
6. Pengerjaan → selesai → kabari via WA → pelanggan ambil
- **Cetak:** saat **diagnosa + harga** → **label** (nama, kerusakan, tgl masuk) **+ nota
  penyimpanan unit (tanda terima)**; **nota selesai** keluar belakangan saat serah-terima.

> **Kesamaan penting:** di **kedua alur**, begitu diagnosa+harga selesai, **label langsung
> tercetak**. Bedanya cuma pada nota: ditunggu → nota hanya di akhir; disimpan → ada tanda
> terima di awal + nota selesai di akhir.

> **Catatan arsitektur:** ini persis kasus penggunaan *flow engine* (flow template + node +
> transition). Alur A & B = dua template. "Ditunggu berubah jadi disimpan" = transisi/ganti
> template di tengah jalan. Fondasinya sudah ada; yang belum = mengonfigurasi dua template
> ini + pemicu cetak per-tahap.

---

## 3. Dokumen cetak yang dibutuhkan

| Dokumen | Kapan dicetak | Ukuran | Status FlowServ |
|---|---|---|---|
| Nota sparepart (POS) | Setelah bayar | Thermal | ✅ `receipt` sudah ada |
| Nota servis selesai / serah-terima | Setelah selesai | **A4** | ✅ `invoice_a4` sudah ada (perlu diarahkan ke servis) |
| **Tanda terima / nota penyimpanan unit** | Setelah diagnosa+harga (alur disimpan) | A4/thermal | ⚠️ **Belum** — jenis dokumen baru |
| **Label unit servis** (isi: nama, kerusakan, tgl masuk) | Saat **diagnosa+harga** (**kedua alur**) | Label | ⚠️ Template ada, **pemicu belum** (dulu ditunda, sekarang dibutuhkan) |

FlowServ sudah bisa atur printer **beda per jenis dokumen per cabang** — jadi "nota servis A4,
nota sparepart thermal" cocok dengan arsitektur yang ada.

---

## 4. Audit gap: sudah bisa vs masih kurang

### ✅ Sudah bisa dipakai (tinggal onboarding data + latih)
- Tiket servis (intake → diagnosa → kerjakan → tutup) + persetujuan
- POS jual sparepart
- **Stok rapi**: FIFO, terima dari supplier, cek selisih stok (`GET /inventory/reconciliation`) — **obat masalah utama**
- DP / bayar sebagian; tahan transaksi (draft)
- Cetak per-jenis-dokumen per-cabang (A4 servis / thermal sparepart)
- Ledger keuangan (COGS/pendapatan)
- Fondasi RBAC + skema multi-role & per-cabang (belum "dinyalakan")

### ⚠️ Gap — diurutkan per prioritas go-live

**TIER 1 — penting untuk operasional harian (mungkin penghalang go-live multi-cabang)**
1. **Pisah data per cabang** — kasir Cabang A tidak lihat data Cabang B. Sekarang semua lihat semua. (JWT belum bawa `branchId`; query hanya filter tenant.)
2. **Konfigurasi 2 flow template servis** (ditunggu/disimpan) + field intake **sandi/pola**.
3. **Pemicu cetak per-tahap**: tanda terima (alur disimpan, setelah diagnosa), nota selesai, label.
4. **CRUD metode pembayaran** (tambah e-wallet Dana/OVO/GoPay). — *kecil*
5. **Change order** (konfirmasi ulang harga saat ada kerusakan tambahan di tengah pengerjaan).

**TIER 2 — dibangun dari gesekan Tahap pilot**
6. **Batas diskon per peran** (owner/manager set batas; kasir tak bisa diskon terlalu besar) — SAL-006.
7. **Retur / tukar barang** — SAL-005.
8. **Tempo per pelanggan** (penanda: pelanggan ini boleh tempo / tidak).
9. **Multi-role fleksibel per cabang** + (opsional) switcher role di layout.

**TIER 3 — Phase 8 / Phase 2 (jangan menghalangi go-live; boleh manual dulu)**
10. **Gaji/komisi teknisi campuran** (bagi hasil + bulanan) + hitung komisi — TECH-011.
11. **Checklist QC** awal & akhir (HP nyala, kembalikan pola) — TECH-008.
12. **Foto/lampiran unit** (opsional per kata pemilik sendiri) — PLT-009.
13. **Waiting parts + talangan** (teknisi beli di luar dulu → baru pesan supplier → servis ditunda) — TECH-005/006. Untuk awal cukup status "ditunda" manual.
14. **Notifikasi WA otomatis** — Phase 2 (12.3). Manual dulu.

---

## 5. Requirement baru yang belum tertulis sebelumnya (dicatat di sini agar tak hilang)

1. **Teknisi punya `pay_type`**: `commission` (bagi hasil, dengan rate) **atau** `monthly_salary` (gaji tetap) — keduanya ada bersamaan. Butuh profil teknisi + perhitungan komisi.
2. **Kelayakan tempo per pelanggan**: penanda boolean/limit di `customers` — tidak semua pelanggan boleh bayar tempo.
3. **Pemicu cetak label** (dulu `label` sengaja ditunda; sekarang dibutuhkan). Dicetak **otomatis saat diagnosa+harga di kedua alur**, isi: **nama, kerusakan, tanggal masuk** — untuk menempel/identifikasi unit & mencegah unit tercecer.
4. **Jenis dokumen cetak "tanda terima / nota penyimpanan unit"** (alur disimpan, dicetak setelah diagnosa+harga).
5. **Field intake sandi/pola HP** (dicatat saat terima, dikembalikan saat serah-terima).
6. **Batas diskon per peran** (owner/manager mengatur plafon diskon kasir).

> Item 1–2 sebaiknya juga ditambahkan ke `specification/features/05-technician.md` dan
> `01-customer-device.md` saat modulnya disentuh (jangan ubah keputusan "final" tanpa diskusi;
> ini penambahan requirement, bukan pengubahan keputusan).

---

## 6. Rekomendasi arsitek: urutan kerja

**Prinsip:** jangan kejar ~170 fitur. Target = FlowServ cukup matang menggantikan `pos_sederhana`
di operasional harian, lalu diperbaiki dari pemakaian nyata (ini persis Phase 9–10 di `PHASES.md`).

**Keputusan strategi (default, bisa diveto pemilik):** **uji coba di 1 cabang dulu**, bukan
serentak semua cabang. Alasan: penghalang multi-cabang adalah "pisah data per cabang". Dengan 1
cabang, itu belum jadi masalah → bisa langsung pakai data asli & dapat feedback cepat, sambil
fitur multi-cabang dibangun paralel. Trade-off: validasi awal hanya di satu tempat.

### Urutan tahap
- **Tahap 0 (sekarang):** dokumen ini + tutup **Phase 6** (test cetak fisik + merge) sebagai milestone bersih.
- **Tahap A — Inti servis + cetak** ✅ **selesai 2026-07-24** (nilai tertinggi, karena
  servis 50% & paling khas) — lihat
  [`plan/A-service-flow-templates.md`](A-service-flow-templates.md) untuk detail bukti:
  - [x] Keluhan/kerusakan, mode ditunggu/disimpan (bisa diubah di tengah alur), sandi/pola
  - [x] Change order — ternyata sudah didukung mekanisme yang ada, tidak perlu kode baru
  - [x] Label (kedua alur, saat diagnosa+harga, tanpa harga) + tanda terima (alur
        disimpan, dengan harga+sandi) + tombol cetak invoice A4 di halaman tiket
        (sebelumnya tidak ada sama sekali)
  - [ ] CRUD metode pembayaran (e-wallet) — **belum dikerjakan, lanjut di Tahap A
        berikutnya atau kapan pun dibutuhkan**
- **Tahap B — Pilot 1 cabang (mode bayangan):** onboarding stok asli, pakai harian berdampingan dengan `pos_sederhana`. **Di sinilah stok mulai beres.** Kumpulkan masalah nyata.
- **Tahap C — Siap multi-cabang:** pisah data per cabang + multi-role fleksibel → roll-out ke semua cabang.
- **Tahap D — Aturan kasir:** batas diskon per peran, retur/tukar, tempo per pelanggan (dari gesekan Tahap B).
- **Tahap E — Phase 8:** gaji/komisi teknisi, checklist QC, foto, waiting-parts/talangan, WA otomatis.

---

## 7. Analisis plus-minus & urgensi per fitur (dasar keputusan urutan)

Skala urgensi: 🔴 wajib untuk go-live · 🟡 penting, bisa menyusul · 🟢 nanti (boleh manual dulu).
"Plus/minus" = untung/rugi kalau fitur ini dikerjakan **duluan**.

### A. Konfigurasi 2 flow template servis (+ field sandi/pola) — 🔴
- **Plus:** jantung usaha (servis 50%); tanpa ini servis tak bisa digital sama sekali. Fondasi flow engine sudah ada, jadi ini "mengonfigurasi", bukan bangun dari nol. Begitu beres, tahap-tahap lain (cetak, change order) tinggal menempel.
- **Minus:** paling kompleks & makan waktu; hasilnya tidak langsung "wow" ke mata awam. Kalau desain node/transition salah, mahal diubah belakangan.
- **Verdict:** kerjakan **pertama** di antara yang berat — semua fitur servis lain bergantung padanya.

### B. Cetak: label (kedua alur) + tanda terima + nota selesai — 🔴
- **Plus:** langsung mewujudkan tujuan utama Anda (dari tulis tangan → digital). Label menyerang langsung masalah "unit tercecer / lupa ada barang". Printer sudah dibangun (Phase 6) — tinggal wiring pemicu.
- **Minus:** waktu cetaknya bergantung pada tahap flow, jadi idealnya **setelah** A. Label butuh penyesuaian ukuran/tata letak fisik (uji di printer label asli).
- **Verdict:** kerjakan **tepat setelah A** (nempel erat). Berpasangan.

### C. CRUD metode pembayaran (e-wallet Dana/OVO/GoPay) — 🟡
- **Plus:** kecil & cepat, hasil langsung kelihatan — bagus sebagai "pemanasan" / bukti progres. Menghapus penghalang harian nyata.
- **Minus:** nilai strategis rendah, bukan pembeda; tidak menyentuh masalah inti (stok/servis). Kalau ditaruh paling depan, terasa progres tapi bukan yang paling penting.
- **Verdict:** boleh jadi **pembuka cepat** kalau Anda mau lihat hasil dulu, atau diselipkan kapan saja.

### D. Change order (konfirmasi ulang harga saat kerusakan tambahan) — 🟡
- **Plus:** bagian nyata dari alur Anda; tanpa ini revisi harga tidak rapi/terlacak.
- **Minus:** bisa disiasati sementara (teknisi/kasir edit rincian biaya lalu minta approve ulang) tanpa fitur khusus. Jadi bukan penghalang mutlak hari pertama.
- **Verdict:** kerjakan **bareng/segera setelah A–B**, tapi boleh manual dulu di pilot.

### E. Pisah data per cabang — 🔴 (jika serentak) / 🟢 (jika pilot 1 cabang)
- **Plus:** wajib kalau semua cabang go-live bersamaan — mencegah kasir Cabang A lihat/salah-ubah data Cabang B.
- **Minus:** menyentuh **auth/JWT + hampir semua query** → perubahan besar & berisiko, butuh tes menyeluruh. Kalau pilot 1 cabang, **belum perlu** → menundanya menghemat banyak waktu & risiko di awal.
- **Verdict:** **inilah alasan terkuat pilih pilot 1 cabang dulu.** Tunda sampai Tahap C.

### F. Batas diskon per peran — 🟡
- **Plus:** kontrol owner atas kasir (cegah diskon liar) — soal kepercayaan & margin.
- **Minus:** butuh RBAC + ambang batas; bisa disiasati dulu (kasir tidak diberi hak diskon sama sekali, hanya manager).
- **Verdict:** Tahap D, dari gesekan pilot.

### G. Retur / tukar barang — 🟡
- **Plus:** kejadian nyata di kasir.
- **Minus:** butuh logika stok balik + ledger; tidak terjadi tiap jam. Salah bikin = stok/uang kacau, jadi harus hati-hati (bukan buru-buru).
- **Verdict:** Tahap D.

### H. Tempo per pelanggan (penanda boleh/tidak) — 🟢🟡
- **Plus:** cegah salah kasih tempo; perubahannya kecil.
- **Minus:** bisa manual dulu (kasir hafal siapa yang boleh).
- **Verdict:** Tahap D, tambahan kecil.

### I. Gaji/komisi teknisi campuran (bagi hasil + bulanan) — 🟢 sekarang / 🔴 nanti
- **Plus:** bagian bisnis nyata (Anda harus bayar teknisi).
- **Minus:** **percuma dibangun sebelum servis dipakai nyata** — komisi dihitung dari data servis yang akurat, yang baru ada setelah pilot jalan. Kompleks (Phase 8).
- **Verdict:** **jangan sekarang.** Naik jadi prioritas setelah pilot menghasilkan data servis nyata.

### J. QC checklist / foto / waiting-parts + talangan / WA otomatis — 🟢
- **Plus:** melengkapi alur biar rapi.
- **Minus:** semuanya **bisa manual dulu** (centang QC di kepala, foto pakai HP, talangan dicatat manual, WA diketik sendiri). Membangun sekarang = **menunda go-live tanpa manfaat sepadan**.
- **Verdict:** tunda ke Phase 8/2. Untuk pilot cukup ada **status "ditunda"** manual.

### Ringkasan urutan (hasil analisis di atas)
1. **A + B** (flow servis + cetak label/tanda terima/nota) — inti, dikerjakan berpasangan.
2. **C** (metode bayar e-wallet) — selipkan; bisa jadi pembuka cepat.
3. **Pilot 1 cabang** — pakai nyata, benahi stok, kumpulkan gesekan. (**E ditunda** karena ini.)
4. **D + F + G + H** (change order matang, batas diskon, retur, tempo) — dari gesekan pilot.
5. **E** (pisah cabang) + multi-role — sebelum roll-out ke semua cabang.
6. **I + J** (komisi teknisi, QC, dll) — Phase 8, setelah operasional stabil.

---

## 8. Keputusan yang masih terbuka (untuk pemilik)

1. **Strategi go-live:** 1 cabang dulu (default rekomendasi) **vs** semua cabang sekaligus.
2. **Langkah pertama setelah dokumen ini:** langsung Tahap A (inti servis+cetak) **vs** tutup Phase 6 dulu.

> Sampai pemilik memutuskan, asumsi kerja: **1 cabang dulu**, dan **tutup Phase 6 → lanjut Tahap A**.
