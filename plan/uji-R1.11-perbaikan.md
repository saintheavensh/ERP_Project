# Checklist Uji Manual — Fase R1.11

> **Untuk pemilik.** Ditulis 2026-08-05, setelah kode R1.11 selesai.
> Rencananya: [`R1.11-perbaikan-hasil-uji-R1.10.md`](R1.11-perbaikan-hasil-uji-R1.10.md)
>
> **Ini gerbang R2.** R2 tidak dimulai sebelum berkas ini Anda isi.
>
> **Fase ini yang terpendek sejauh ini** — seluruh isinya berasal dari **satu kotak**
> catatan Anda (poin A7) plus satu koreksi istilah (A8). **18 poin.**

---

## Cara mengisi

Tulis di kolom **Hasil**: `OK` bila sesuai, atau kalimat bebas bila tidak. Tidak perlu rapi.
Kalau tidak sempat diuji, tulis `belum`.

**Akun uji** (kata sandi semuanya `admin123`):

| Peran       | Email                  |
| ----------- | ---------------------- |
| Super Admin | `admin@demo.com`       |
| Manager     | `manager@demo.com`     |
| Kasir       | `cashier@demo.com`     |
| Teknisi     | `technician@demo.com`  |
| Teknisi 2   | `technician2@demo.com` |

**Sebelum mulai:** `npm run db:reset` di `flowserv-api/`. Tidak ada izin baru di fase ini
(justru sebaliknya — izin yang sudah ada dipakai dengan benar), tapi data uji dari
pengembangan perlu dibersihkan.

---

## ⚠️ Yang perlu Anda tahu sebelum menguji

Saat memeriksa keluhan Anda di A7, ditemukan **bug yang jauh lebih besar dan belum pernah
Anda tabrak**:

> **Teknisi tidak bisa menyimpan hasil diagnosanya sama sekali.** Sejak 1 Agustus, saat
> Anda meminta teknisi tidak lagi membuat tiket servis (R1.5B), satu izin dicabut — dan
> tanpa disadari siapa pun, kolom "Hasil Diagnosa" ikut terkunci karena kebetulan menumpang
> izin yang sama. Sebaliknya, **kasir justru bisa menulis hasil diagnosa**.

Persis terbalik, empat hari, dan **tidak satu tes pun gagal**. Bagian **A** di bawah adalah
pembuktiannya — dan ia juga yang memblokir R2, karena aturan Anda _"Diagnosa = hasil
diagnosa + perkiraan biaya wajib sebelum lanjut"_ tak mungkin ditegakkan kalau teknisi tak
bisa menyimpan diagnosa.

---

## A — Teknisi akhirnya bisa menyimpan hasil diagnosa 🔴

| #   | Yang dilakukan                                                             | Yang seharusnya terjadi                               | Hasil |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------- | ----- |
| A1  | Login **kasir** → Terima Unit → buat tiket biasa                           | Tiket jadi                                            | OK    |
| A2  | Login **teknisi** → Beranda → ambil tiket itu dari antrian → buka tiketnya | Terbuka                                               | OK    |
| A3  | Majukan tiket ke tahap **Diagnosa**                                        | Kotak **Hasil Diagnosa & Estimasi Waktu** muncul      | OK    |
| A4  | 🔴 Tekan **Isi Diagnosa**, tulis hasilnya, tekan **Simpan**                | **Tersimpan.** Inilah yang sebelumnya gagal diam-diam | OK    |
| A5  | Muat ulang halamannya (F5)                                                 | Tulisannya masih ada — benar-benar tersimpan          | OK    |
| A6  | Isi juga **estimasi waktu** (mis. 120 menit), Simpan                       | Tersimpan dan tampil                                  | OK    |

---

## B — Teknisi tidak lagi mengubah catatan konter (jawaban langsung poin A7 Anda)

> Anda menulis: _"teknisi masih bisa edit keluhan Pola dan lainnya di halaman detail
> seharusnya tidak bisa"_.
>
> **Yang perlu Anda periksa dan boleh Anda tolak:** teknisi **tetap MELIHAT** isi
> keluhan dan sandi/pola — yang hilang cuma tombol **Ubah**-nya. Alasannya: ia butuh
> sandinya untuk menguji unit, dan keluhan adalah alasan unit itu ada di mejanya. **Kalau
> menurut Anda teknisi sebaiknya tidak melihat sandi sama sekali, tulis di B3.**

| #   | Yang dilakukan                                             | Yang seharusnya terjadi                                 | Hasil               |
| --- | ---------------------------------------------------------- | ------------------------------------------------------- | ------------------- |
| B1  | Sebagai **teknisi**, buka tiket → lihat kotak **Keluhan**  | **Tidak ada tombol Ubah.** Isinya tetap terbaca         | OK                  |
| B2  | Lihat kotak **Sandi / Pola**                               | **Tidak ada tombol Ubah.** Sandi/polanya tetap terlihat | OK                  |
| B3  | **Pendapat Anda:** teknisi tetap boleh MELIHAT sandi/pola? | (jawab bebas)                                           | ya tentu saja boleh |
| B4  | Lihat kotak **Perkiraan Konter** sebagai teknisi           | Angkanya terlihat, tapi **tidak ada tombol Ubah/Isi**   | OK                  |

---

## C — Kasir tidak lagi menulis hasil diagnosa

> Sebelum R1.11 kasir benar-benar bisa menulis hasil diagnosa teknisi.

| #   | Yang dilakukan                                             | Yang seharusnya terjadi                          | Hasil |
| --- | ---------------------------------------------------------- | ------------------------------------------------ | ----- |
| C1  | Login **kasir** → buka tiket yang sudah didiagnosa teknisi | Hasil diagnosanya **terbaca** (kasir perlu tahu) | OK    |
| C2  | Cari tombol Ubah/Edit di kotak Hasil Diagnosa              | **Tidak ada**                                    | OK    |
| C3  | Kasir mengubah **keluhan** di tiket yang sama              | **Tetap bisa** — hanya diagnosa yang dibatasi    | OK    |

---

## D — Halaman menyusul sendiri (jawaban kedua poin A7 Anda)

> Anda menulis: _"ketika teknisi sudah melakukan diagnosa di halaman detail kasir masih
> intake posisinya jadi tidak up to date"_.
>
> **Cara mengujinya butuh dua jendela browser.** Paling mudah: satu jendela biasa (kasir)
> dan satu jendela **penyamaran/incognito** (teknisi), supaya dua login tidak saling
> menimpa.

| #   | Yang dilakukan                                                                                         | Yang seharusnya terjadi                                | Hasil          |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | -------------- |
| D1  | Jendela 1: login **kasir**, buka sebuah tiket. Biarkan terbuka                                         | Terbuka, tahapnya mis. "Intake"                        | OK             |
| D2  | Jendela 2 (incognito): login **teknisi**, buka tiket yang sama, **majukan tahapnya**                   | Tahapnya berubah di jendela 2                          | OK             |
| D3  | 🔴 Kembali ke jendela 1 (klik jendelanya). **Jangan tekan F5**                                         | Tahapnya **ikut berubah sendiri** dalam beberapa detik | OK             |
| D4  | Biarkan jendela 1 terbuka tanpa disentuh, lalu ubah sesuatu lagi dari jendela 2, tunggu ±20–30 detik   | Ikut berubah sendiri juga, tanpa diklik                | OK             |
| D5  | Di jendela 1, tekan **Ubah** pada Keluhan, ketik sesuatu, **jangan simpan**. Klik jendela 2 lalu balik | Tulisan Anda **masih utuh**, kotaknya masih terbuka    | OK             |
| D6  | Buka daftar **Servis** (antrian) dan **Beranda**, lakukan hal serupa                                   | Keduanya juga menyusul sendiri                         | OK             |
| D7  | **Pendapat Anda:** 20 detik itu terlalu cepat, terlalu lambat, atau pas?                               | (jawab bebas)                                          | terlalu lambat |

---

## E — Kalimat perkiraan konter (jawaban poin A8 Anda)

> Anda mengoreksi: _"bukan lepas setelah dari konter unit masih ada di konter cuman
> statusnya berubah yang tadinya menunggu menjadi sudah di diagnosa"_. Betul — kalimatnya
> menggambarkan perpindahan barang yang tidak terjadi.
>
> **Kuncinya tetap** (pilihan Anda 2026-08-05), karena alasan aslinya tidak bergantung pada
> premis yang salah itu: angka itu sudah terlanjur didengar pelanggan, jadi ia bukti.

| #   | Yang dilakukan                                                             | Yang seharusnya terjadi                                                                               | Hasil |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----- |
| E1  | Buat tiket dengan Perkiraan Biaya `450000`, majukan ke Diagnosa, buka lagi | Tertulis **"terkunci sejak tiket masuk pemeriksaan, karena angka ini sudah disebutkan ke pelanggan"** | OK    |
| E2  | **Pendapat Anda:** kalimat itu sudah sesuai cara kerja toko?               | (jawab bebas)                                                                                         | OK    |

---

## F — Regresi: yang lama harus tetap jalan

| #   | Yang dilakukan                                            | Yang seharusnya terjadi | Hasil |
| --- | --------------------------------------------------------- | ----------------------- | ----- |
| F1  | Kasir → Terima Unit lengkap (pelanggan baru)              | Tetap jalan             | OK    |
| F2  | Kasir → betulkan Perkiraan Konter selagi tahap Penerimaan | Tetap jalan             | OK    |
| F3  | Kasir → transaksi POS tunai                               | Tetap jalan             | OK    |
| F4  | Kasir ketik `/finance/ledger` dan `/devices`              | Tetap **ditolak**       | OK    |
| F5  | Manager → buka tiket, ubah keluhan **dan** diagnosa       | **Keduanya bisa**       | OK    |

---

## G — Pertanyaan yang belum terjawab dua putaran

| #   | Pertanyaan                                                                                                                                                                  | Jawaban Anda          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| G1  | **Cetak otomatis saat simpan** — Anda minta sendiri di uji R1.5 (A7), tapi belum sempat mencobanya di R1.9 maupun R1.10. Masih diinginkan, atau sebaiknya jadi tombol saja? | jadi tombol saja dulu |

---

## Kesimpulan Anda

Pilih salah satu, lalu tulis alasannya:

- [ ] **Lanjut ke R2** (form servis per tahap — aturannya sudah Anda tetapkan 2026-08-04,
      dan sekarang teknisi sudah bisa menyimpan diagnosa, jadi gerbang "Diagnosa wajib
      terisi" akhirnya bisa dibangun)
- [ ] **Masih ada yang harus diperbaiki dulu** →

```
Spertinya kita lanjut ke R2
```

---

## Yang TIDAK ada di R1.11, supaya tidak Anda cari

1. **Halaman tiket disusun ulang per peran** (bagian mana muncul untuk siapa) — **R2**.
   R1.11 hanya menutup **tiga tombol** yang Anda temukan. Memecah halaman tiket seluruhnya
   adalah isi R2, dan mengerjakannya sekarang berarti mengerjakannya dua kali.
2. **Device dipilih dari riwayat pelanggan saat intake** (poin A3 uji R1.9) — **R2**,
   Anda sendiri sudah menyetujuinya.
3. **Lempar-lempar data kasir ↔ teknisi** — **R2**, kalimat Anda: _"sepertinya itu thap R2 ya"_.
4. **Layar berubah seketika (realtime/WebSocket)** — tidak dibangun. Anda memilih
   penyegaran berkala, dan realtime penuh ukurannya satu fase sendiri.
5. **Buka/Tutup Kasir** — tetap **Fase R6**, setelah R2.
6. **Cetak fisik dengan printer sungguhan** — butuh perangkat keras.
