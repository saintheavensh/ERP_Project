# Uji Manual — Fase R1.7: Perbaikan dari Uji R1.6

> **Siap diuji.** Ini menutup 4 hal yang Anda temukan di uji R1.6.
> Cerita lengkapnya (R1 → R1.7) ada di
> [`riwayat-R1-sampai-R1.7.md`](riwayat-R1-sampai-R1.7.md).
>
> **Satu temuan Anda adalah bug yang paling memalukan sejauh ini** — poin C2. Kartu
> "Piutang" di beranda kasir menautkan ke halaman yang **menolak kasir**. Tes R1.6 saya
> memeriksa API-nya membalas 200 **dan** kartunya tampil, lalu tetap lolos, karena tak satu
> pun mengikuti tautannya. Anda menemukannya dengan satu klik. Bagian A yang paling
> penting Anda pastikan.
>
> **Yang TIDAK ada di sini, dan itu bukan kelupaan:** *"halaman detail service
> membingungkan cara inputnya"* — itu inti **R2** (form per tahap), bukan tambalan.

## Cara mengisi

**Catatan saya:** isi bebas (`OK` / `GAGAL — ...` / `Jalan, TAPI harusnya begini...`).
Centang `[x]` = sudah dijalankan.

**Setelah selesai, isi "Kesimpulan" di bawah**, lalu bilang _"R1.7 sudah saya uji"_.

---

## Persiapan

- [ ] **0.1** `npm run db:reset` di `flowserv-api/`
  - **Catatan saya:**

- [ ] **0.2** Jalankan `start-flowserv.bat`
  - **Catatan saya:**

---

# A. Kartu Piutang akhirnya bisa diklik 🔴

- [ ] **A1** Login **Kasir** → Beranda → **klik kartu "Piutang (AR)"**
  - **Harusnya:** halaman **Piutang Pelanggan** benar-benar terbuka (bukan dipentalkan),
    berisi 2 faktur: Budi Santoso 450rb dan Siti Rahayu 800rb (DP 300rb)
  - **Catatan saya:**

- [ ] **A2** Masih sebagai **Kasir** → ketik `/finance` di alamat
  - **Harusnya:** **tetap ditolak.** Kasir boleh menagih, tapi tidak boleh melihat buku
    kas dan laba toko. Kalau ini ikut terbuka, perbaikan A1 kebablasan dan justru membuka
    kembali kebocoran yang R1.5 tutup
  - **Catatan saya:**

- [ ] **A3** Masih sebagai **Kasir** → ketik `/finance/ledger`, lalu `/finance/payables`
  - **Harusnya:** keduanya juga ditolak
  - **Catatan saya:**

- [ ] **A4** Login **Teknisi** → ketik `/finance/receivables`
  - **Harusnya:** **ditolak.** Teknisi tidak menagih
  - **Catatan saya:**

---

# B. Antrian ada di Beranda, rinciannya popup

- [ ] **B1** Login **Teknisi Andi** → Beranda
  - **Harusnya:** ada kotak **"Menunggu Diambil"** berisi **daftar tiketnya**, bukan
    cuma angka
  - **Catatan saya:**

- [ ] **B2** Ketuk salah satu baris di kotak itu
  - **Harusnya:** muncul **popup** (bukan pindah halaman) berisi semua yang dicatat kasir:
    nama, telepon, unit, **keluhan**, **sandi/pola**, tanggal masuk, no. antrian
  - **Catatan saya:** yang muncul di popup = \***\*\*\*\*\***\_\***\*\*\*\*\***

- [ ] **B3** Di popup itu, tekan **"Ambil Pekerjaan"**
  - **Harusnya:** popup tertutup, Anda **tetap di Beranda**, tiketnya hilang dari
    "Menunggu Diambil" dan muncul di "Tiket Terbaru Saya". **Inilah tujuan utamanya** —
    tolong nilai apakah sekarang sudah sesederhana yang Anda bayangkan
  - **Catatan saya:**

- [ ] **B4** Buka **Pekerjaan Saya** → di baris antrian, tekan **"Lihat"**
  - **Harusnya:** popup yang **sama persis** muncul di sini juga
  - **Catatan saya:**

- [ ] **B5** Di daftar **"Sedang Saya Kerjakan"**, perhatikan tombolnya
  - **Harusnya:** di sini tetap **"Buka →"** (halaman kerja penuh), bukan popup — biaya,
    daftar periksa, dan pindah tahap tidak muat di popup. Kalau menurut Anda ini pun
    sebaiknya popup, tolong bilang
  - **Catatan saya:**

---

# C. Teknisi tidak lagi bisa memilih teknisi lain

- [ ] **C1** Login **Teknisi** → buka satu tiket → lihat bagian **Teknisi**
  - **Harusnya:** hanya **nama** yang tertulis, **tidak ada dropdown** pilih teknisi
  - **Catatan saya:**

- [ ] **C2** Di tiket yang **belum bertuan**, masih sebagai Teknisi
  - **Harusnya:** tombol **"Ambil Pekerjaan"** **tetap ada** — itu menugaskan diri
    sendiri, beda dengan menugaskan orang lain. Kalau tombol ini ikut hilang, saya
    kebablasan
  - **Catatan saya:**

- [ ] **C3** Login **Manager** → buka tiket yang sama
  - **Harusnya:** dropdown pilih teknisi **masih ada** untuk manajer
  - **Catatan saya:**

---

# D. Kasir bisa memastikan unit yang barusan dicatat

- [ ] **D1** Login **Kasir** → Terima Unit → simpan satu unit
  - **Harusnya:** di bawah form muncul **"Unit Masuk Terbaru"** dan unit yang barusan
    tersimpan **langsung ada di paling atas**, tanpa memuat ulang halaman
  - **Catatan saya:**

- [ ] **D2** Simpan **2 unit lagi** berturut-turut
  - **Harusnya:** ketiganya terlihat di daftar itu, terbaru di atas
  - **Catatan saya:**

- [ ] **D3** Tekan **F5** (refresh)
  - **Harusnya:** daftarnya **masih ada** (diambil dari server, bukan cuma diingat halaman)
  - **Catatan saya:**

- [ ] **D4** Klik salah satu baris di daftar itu
  - **Harusnya:** membuka tiket tersebut
  - **Catatan saya:**

> **Catatan jujur:** daftar ini adalah **"unit masuk terbaru se-toko"**, bukan "yang saya
> input". Database tidak menyimpan siapa yang membuat tiket. Kalau Anda memang butuh
> "hanya milik saya", bilang — itu perlu tambahan kolom dan jadi tugas tersendiri.

---

# E. Regresi — yang lama jangan sampai rusak

- [ ] **E1** Pesan validasi masih kalimat (Terima Unit → pola 3 titik)
  - **Catatan saya:**

- [ ] **E2** Satu penjualan tunai di menu Kasir sampai selesai
  - **Catatan saya:**

- [ ] **E3** Alur satu tiket dari Terima Unit sampai Selesai
  - **Catatan saya:**

- [ ] **E4** Beranda tiap peran masih benar (Super Admin, Manager, Kasir, Teknisi)
  - **Catatan saya:**

---

# Kesimpulan

**Apakah R1.7 sudah benar?**

- [ ] Ya, lanjut ke R2
- [ ] Ada yang harus diperbaiki dulu — daftarnya:

```


```

---

## ⛔ R2 tidak bisa dimulai tanpa ini

Ini pertanyaan yang sama yang saya ajukan di uji R1.6 dan belum terjawab. **R2 berhenti di
sini sampai Anda mengisinya**, karena menebaknya lalu menegakkan tebakan itu persis
kesalahan yang pernah dibuat di S5 (gerbang penagihan dipasang berdasarkan tebakan, lalu
harus dicabut).

Anda menulis: *"setelah diagnosis tiket kembali di berikan kepada kasir yang nantinya bisa
memilih alurnya dan pemberian nota service juga dari kasir"*, dan *"tiket bisa maju walau
data belum diisi"* adalah masalah. Untuk menegakkannya saya perlu tahu **apa yang wajib
terisi di tiap tahap sebelum tombol lanjut boleh ditekan**:

| Tahap | Wajib terisi sebelum boleh lanjut? |
|---|---|
| **Terima Unit** (kasir) | nama? no. HP? keluhan? sandi/pola? |
| **Diagnosa** (teknisi) | hasil diagnosa? perkiraan biaya? perkiraan lama pengerjaan? |
| **Pengerjaan** (teknisi) | catatan pengerjaan? suku cadang yang dipakai? |
| **QC** | semua baris checklist harus tercentang, atau boleh sebagian? |
| **Selesai / Serah Terima** (kasir) | nota sudah dibuat? harus lunas, atau boleh ada sisa? |

```
(isi bebas — kalimat biasa juga tidak apa-apa, tidak harus mengikuti tabel)


```
