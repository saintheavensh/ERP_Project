# Uji Manual — Fase R1.6: Perbaikan dari Uji R1.5

> **Siap diuji.** Ini menutup 4 hal yang Anda temukan di
> [`uji-R1.5-perbaikan.md`](uji-R1.5-perbaikan.md).
>
> **Ujinya lebih pendek dari sebelumnya, dan itu disengaja.** Tiga hal yang Anda ragukan
> ternyata bukan bug (piutang 0, URL `?ditolak=`, penjualan tunai yang "hilang") — sudah
> saya periksa sendiri ke database, penjelasannya ada di
> [`R1.6-perbaikan-hasil-uji-R1.5.md`](R1.6-perbaikan-hasil-uji-R1.5.md) bagian 0. Yang
> tersisa untuk Anda hanya yang benar-benar berubah di layar.
>
> **Dua catatan Anda TIDAK ada di sini, dan itu bukan kelupaan** — E1 (form per tahap) dan
> E3 (tiket bisa maju walau data kosong) masuk **R2**, karena keduanya butuh Anda
> menentukan aturannya dulu.

## Cara mengisi

Sama seperti sebelumnya — **Catatan saya:** isi bebas (`OK` / `GAGAL — ...` /
`Jalan, TAPI harusnya begini...`). Centang `[x]` = sudah dijalankan.

**Setelah selesai, isi "Kesimpulan" di bawah**, lalu bilang _"R1.6 sudah saya uji"_.

---

## Persiapan

- [ ] **0.1** Jalankan `npm run db:reset` di `flowserv-api/` — **wajib**, karena seed
      berubah (ada teknisi kedua dan dua faktur piutang baru)
  - **Catatan saya:**

- [ ] **0.2** Jalankan `start-flowserv.bat`
  - **Catatan saya:**

> **Akun baru:** `technician2@demo.com`, sandi `admin123` (Teknisi Rina). Yang lama tetap:
> `admin@demo.com`, `manager@demo.com`, `technician@demo.com`, `cashier@demo.com`.

---

# A. Pesan error berhenti berupa "array object" 🔴

> Ini yang paling luas dampaknya — perbaikannya bukan di halaman Terima Unit saja, tapi di
> **semua** halaman yang punya form. Kalau Anda menemukan JSON mentah muncul di layar mana
> pun selama menguji, itu temuan penting; tolong catat halaman apa.

- [ ] **A1** Kasir → Terima Unit → mode **Pola**, gambar **3 titik** → Simpan
  - **Harusnya:** yang muncul persis kalimat **"Pola minimal 4 titik."** — tanpa tanda
    `[`, tanpa `"code"`, tanpa `"path"`
  - **Catatan saya:** pesan yang muncul = \***\*\*\*\*\***\_\***\*\*\*\*\***

- [ ] **A2** Ganti ke mode **Sandi**, isi **"12"** → Simpan
  - **Harusnya:** **"Sandi/PIN minimal 4 karakter."**
  - **Catatan saya:**

- [ ] **A3** Isi pola **4 titik** atau sandi **"1234"** → Simpan
  - **Harusnya:** tersimpan seperti biasa, tidak ada peringatan
  - **Catatan saya:**

---

# B. Ambil pekerjaan cukup satu klik

- [ ] **B1** Login **Teknisi Andi** → buka **Pekerjaan Saya**
  - **Harusnya:** di daftar **"Menunggu Diambil"**, tiap baris sekarang punya tombol
    biru **"Ambil"** di sebelah "Buka →"
  - **Catatan saya:**

- [ ] **B2** Tekan **Ambil** di salah satu baris — jangan buka detailnya dulu
  - **Harusnya:** tiketnya langsung **pindah** dari "Menunggu Diambil" ke "Sedang Saya
    Kerjakan", tanpa berpindah halaman. **Inilah tujuan utamanya** — tolong nilai apakah
    sekarang sudah sesederhana yang Anda bayangkan
  - **Catatan saya:**

- [ ] **B3** Buka satu tiket yang belum bertuan lewat "Buka →", lalu tekan
      **"Ambil Pekerjaan"** di halaman detail
  - **Harusnya:** **masih bisa.** Tombol lama tidak dihapus — sebagian orang terlanjur
    membuka detailnya dulu
  - **Catatan saya:**

- [ ] **B4** ⭐ **Yang belum pernah bisa Anda uji (poin B6 uji R1).** Sekarang login
      **Teknisi Rina** (`technician2@demo.com` / `admin123`)
  - **Harusnya:** tiket yang barusan diambil Andi **tidak muncul** di antrian Rina, dan
    tidak muncul di "Sedang Saya Kerjakan" milik Rina
  - **Catatan saya:**

---

# C. Kartu Piutang akhirnya ada isinya

> Nilai 0 yang Anda lihat kemarin **bukan** karena izin kasir kesempitan — seed memang
> tidak pernah membuat satu pun faktur POS, jadi kartu itu 0 untuk semua peran termasuk
> Super Admin. Sekarang ada dua faktur contoh.

- [ ] **C1** Login **Kasir** → Beranda
  - **Harusnya:** kartu **Piutang (AR)** menunjukkan **Rp 950.000** dari **2 faktur**
  - **Catatan saya:**

- [ ] **C2** Klik kartu itu
  - **Harusnya:** membuka daftar piutang: satu faktur 450rb belum dibayar sama sekali,
    satu faktur 800rb sudah **DP 300rb** (sisa 500rb)
  - **Catatan saya:**

- [ ] **C3** Login **Kasir** → ketik `/finance` di alamat
  - **Harusnya:** **tetap dipentalkan.** Kasir boleh melihat siapa yang berhutang
    (dia yang menagih), tapi **tidak** boleh melihat buku kas dan laba toko
  - **Catatan saya:**

---

# D. Alamat `?ditolak=` bersih sendiri

- [ ] **D1** Login **Kasir** → ketik `/flows` di alamat
  - **Harusnya:** kotak kuning "Halaman itu bukan untuk peran Anda" **tetap muncul**,
    tapi alamat di atas kembali bersih jadi `/` saja
  - **Catatan saya:**

- [ ] **D2** Tekan **F5** (refresh) di halaman itu
  - **Harusnya:** kotak kuningnya **tidak muncul lagi** — Anda tidak sedang ditolak
    apa-apa sekarang
  - **Catatan saya:**

- [ ] **D3** Ketik `/settings` → dipentalkan lagi
  - **Harusnya:** kotak kuning muncul **lagi**, kali ini menyebut `/settings`
  - **Catatan saya:**

---

# E. Regresi — yang lama jangan sampai rusak

- [ ] **E1** Kasir → Terima **2 unit berturut-turut** (tanpa menekan "kembali")
  - **Harusnya:** masih selancar R1.5 — form kosong sendiri, kotak hijau muncul
  - **Catatan saya:**

- [ ] **E2** Satu penjualan tunai di menu Kasir sampai selesai
  - **Harusnya:** selesai normal. **Jangan `db:reset` setelah ini** kalau Anda ingin
    fakturnya tetap terlihat di daftar
  - **Catatan saya:**

- [ ] **E3** Buka satu form lain yang punya validasi (mis. tambah Pelanggan, atau tambah
      Barang di Stok) → sengaja kosongkan kolom wajib → Simpan
  - **Harusnya:** pesannya kalimat, bukan JSON. **Ini yang membuktikan perbaikan A
    berlaku di seluruh aplikasi**, bukan cuma di Terima Unit
  - **Catatan saya:** halaman yang saya coba = \***\*\*\*\*\***\_\***\*\*\*\*\***

- [ ] **E4** Beranda tiap peran masih menampilkan kartu yang benar
  - **Catatan saya:**

---

# Kesimpulan

**Apakah R1.6 sudah benar?**

- [ ] Ya, lanjut ke R2
- [ ] Ada yang harus diperbaiki dulu — daftarnya:

```


```

---

## Bahan untuk R2 (jangan diisi sekarang kalau lelah — R2 belum mulai)

Dari jawaban Anda kemarin, R2 sudah punya bentuk ini. Yang saya butuhkan **sebelum**
mulai membangun hanya satu hal: **aturan per tahap**.

Anda menulis: *"setelah diagnosis tiket kembali di berikan kepada kasir yang nantinya bisa
memilih alurnya dan pemberian nota service juga dari kasir"*. Untuk menegakkan "tiket tidak
boleh maju sebelum datanya lengkap" (temuan E3 Anda), saya perlu tahu **apa yang wajib
terisi di tiap tahap sebelum boleh lanjut**:

| Tahap | Wajib terisi sebelum boleh lanjut? |
|---|---|
| Terima Unit (Intake) | contoh: nama + no. HP + keluhan. Sandi/pola? |
| Diagnosa | hasil diagnosa? perkiraan biaya? perkiraan lama pengerjaan? |
| Pengerjaan | catatan pengerjaan? suku cadang yang dipakai? |
| QC | semua baris checklist harus tercentang, atau boleh sebagian? |
| Selesai / Serah Terima | nota sudah dibuat? sudah dibayar lunas, atau boleh ada sisa? |

```
(isi bebas — boleh ditulis sebagai kalimat biasa, tidak harus mengikuti tabel)


```
