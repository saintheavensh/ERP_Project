# Checklist Uji Manual — Fase R1.10

> **Untuk pemilik.** Ditulis 2026-08-05, setelah kode R1.10 selesai.
> Rencananya: [`R1.10-perbaikan-hasil-uji-R1.9.md`](R1.10-perbaikan-hasil-uji-R1.9.md)
>
> **Ini gerbang R2.** R2 tidak dimulai sebelum berkas ini Anda isi.
>
> **Fase ini pendek** — 5 tugas, semuanya lanjutan dari catatan uji R1.9 Anda. Jadi
> checklist-nya juga pendek: **20 poin**, bukan 45 seperti kemarin.

---

## Cara mengisi

Tulis saja di kolom **Hasil**: `OK` bila sesuai, atau kalimat bebas bila tidak. Tidak perlu
rapi — kalimat apa adanya justru lebih berguna. Kalau ada yang tidak sempat diuji, tulis
`belum`.

**Akun uji** (kata sandi semuanya `admin123`):

| Peran       | Email                  |
| ----------- | ---------------------- |
| Super Admin | `admin@demo.com`       |
| Manager     | `manager@demo.com`     |
| Kasir       | `cashier@demo.com`     |
| Teknisi     | `technician@demo.com`  |
| Teknisi 2   | `technician2@demo.com` |

**Sebelum mulai — WAJIB, dua langkah:**

1. `npm install` di folder utama — fase ini memakai `vitest` di frontend, dan paketnya
   baru ditambahkan.
2. `npm run db:reset` di `flowserv-api/` — ada **dua izin baru** (`device_catalog.manage`,
   `customer.set_category`). Tanpa seed ulang, bagian B dan C di bawah tidak akan
   berperilaku seperti yang tertulis.

---

## A — Perkiraan Konter akhirnya bisa dibetulkan (jawaban poin E2 Anda)

> Anda menulis: _"di bagian mana saya bisa merubahnya untuk saat ini masih belum bisa di
> ubah nominalnya"_. Jawabannya: **memang tidak ada tombolnya.** Aturannya sudah benar di
> mesin sejak R1.9 (boleh dibetulkan selagi unit di konter, terkunci sesudahnya) — yang tak
> pernah dibuat adalah tombolnya. Sekarang ada.

| #   | Yang dilakukan                                                                                        | Yang seharusnya terjadi                                                                       | Hasil |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----- |
| A1  | Login **kasir** → Terima Unit → isi **Perkiraan Biaya** `450000` → Simpan                              | Tiket jadi (ini yang kemarin Anda tandai `X` — mestinya jalan)                                   |       |
| A2  | Buka tiket itu (masih tahap **Terima Unit**) → cari kotak **Perkiraan Konter**                        | Ada tombol **Ubah** di sebelah tulisan "PERKIRAAN KONTER"                                        |       |
| A3  | Tekan **Ubah**, ganti jadi `500000`, tekan **Simpan**                                                 | Angkanya **langsung berubah** jadi Rp 500.000 di layar                                           |       |
| A4  | Muat ulang halamannya (F5)                                                                            | Tetap Rp 500.000 — benar-benar tersimpan                                                        |       |
| A5  | ⚠️ Terima unit **baru** tanpa mengisi Perkiraan Biaya sama sekali, lalu buka tiketnya                   | Tertulis **"Belum disebutkan"** dan ada tombol **Isi** — kemarin kotaknya tidak muncul sama sekali |       |
| A6  | Tekan **Isi**, masukkan `300000`, Simpan                                                              | Tersimpan dan tampil                                                                            |       |
| A7  | Majukan tiket ke tahap berikutnya (Diagnosa), lalu lihat lagi kotak Perkiraan Konter                   | Angkanya **masih ada**, tapi tombol Ubah **hilang**, diganti kalimat "terkunci setelah unit lepas dari konter" |       |
| A8  | **Pendapat Anda:** apakah terkunci setelah lepas dari konter itu sudah benar menurut cara kerja toko? | (jawab bebas)                                                                                    |       |

> ⚠️ **A5 mengubah sesuatu yang Anda sudah uji lulus di R1.8, jadi saya sebutkan terbuka
> supaya bisa Anda tolak.** Dulu diputuskan: kotak perkiraan **tidak ditampilkan sama
> sekali** bila kasir tidak menyebut harga di depan — supaya tidak jadi baris kosong yang
> mengganggu. Sekarang kotaknya muncul (berisi "Belum disebutkan" + tombol **Isi**) **selama
> unit masih di konter saja**; begitu tiket maju, ia hilang lagi persis seperti aturan lama.
>
> Alasan saya mengubahnya: tanpa itu, kasir yang **lupa** mengisi tidak punya cara apa pun
> menambahkannya — dan itu separuh dari keluhan E2 Anda. Tapi ini tafsiran saya, bukan
> permintaan Anda. **Kalau menurut Anda lebih baik kembali seperti R1.8, tulis saja di A5 —
> mengembalikannya satu baris.**

---

## B — Katalog Device hanya untuk Anda (pemilik)

> Poin **D10** Anda: _"jangan biarkan di akses selain oleh super admin"_.
>
> **Yang perlu Anda tahu:** untuk melakukan ini dengan jujur, dibuat **izin baru**
> (`device_catalog.manage`) yang hanya Anda punya. Manager sengaja **tidak** diberi —
> padahal ia tetap boleh mengelola sparepart seperti biasa. Kalau menurut Anda manager
> juga perlu mengelola katalog device, katakan; mengembalikannya cuma satu baris.

| #   | Yang dilakukan                                                            | Yang seharusnya terjadi                                                | Hasil |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----- |
| B1  | Login **kasir** → ketik alamat `/devices` langsung di browser              | **Ditolak** — dipentalkan ke Beranda                                     |       |
| B2  | Login **manager** → ketik `/devices`                                       | **Ditolak** juga                                                         |       |
| B3  | Login **admin** (Anda) → **Lainnya → Katalog Device**                      | Terbuka seperti biasa, semua tombol jalan                                |       |
| B4  | 🔴 **PENTING** — Login **kasir** → Terima Unit → ketik "Sam" di kolom Merek | Saran merek **tetap muncul** (autocomplete hidup). Lanjutkan sampai tiket jadi |       |

> **B4 adalah poin terpenting di bagian ini.** Mengunci katalog berisiko ikut mematikan
> saran merek/model di form Terima Unit — dan kerusakan seperti itu baru ketahuan saat toko
> sedang ramai. Sudah diuji otomatis, tapi tolong buktikan sendiri.

---

## C — Kategori pelanggan hanya manajer/pemilik

> Poin **A1** Anda: _"kategori pelanggan tidak bisa di ubah ubah oleh kasir jadi
> kategorinya readonly hanya bisa di edit oleh manager"_.

| #   | Yang dilakukan                                                    | Yang seharusnya terjadi                                                             | Hasil |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----- |
| C1  | Login **kasir** → buka satu pelanggan                             | Label kategori (**Pelanggan Servis / Sparepart**) **tetap terlihat** — kasir perlu tahu |       |
| C2  | Di halaman yang sama, cari dropdown untuk menggantinya            | **Tidak ada.** Yang muncul: "Hanya manajer/pemilik yang dapat mengubah ini."           |       |
| C3  | Masih sebagai kasir: **Tambah Pelanggan**                         | Formnya **tidak punya** pilihan Kategori (pelanggan baru otomatis "Servis")            |       |
| C4  | Kasir mengubah **nama / nomor telepon** pelanggan lalu simpan     | **Tetap berhasil** — hanya kategorinya yang dibatasi, bukan seluruh halamannya         |       |
| C5  | Login **manager** → buka pelanggan yang sama → ganti kategorinya  | Dropdown-nya **ada** dan label di atasnya ikut berubah                                 |       |

---

## D — Daftar pelanggan menyegarkan diri + toast

> Poin **B4** Anda: _"tabel tidak refresh otomatis dan tidak ada toast untuk mengetahui
> apakah berhasil atau tidaknya penambahan pelanggan"_.

| #   | Yang dilakukan                                                              | Yang seharusnya terjadi                                                     | Hasil |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----- |
| D1  | Login **kasir** → Pelanggan → **Tambah Pelanggan** → isi nama & telepon → simpan | Barisnya **langsung muncul di tabel** tanpa Anda menekan refresh              |       |
| D2  | Lihat bagian atas tabel                                                     | Ada pesan hijau **"Pelanggan ... berhasil ditambahkan."**, hilang sendiri     |       |
| D3  | Coba menambah pelanggan dengan nama **satu huruf saja** (mis. `A`)          | Muncul pesan **merah** — gagalnya diberitahu, bukan diam saja                |       |

---

## E — Pencarian katalog device

> Poin **D2** Anda: _"misalnya saya cari samsung a20 tidak di temukan harus samsung galaxy
> a20 baru bisa di temukan saya harap bisa di perbaiki untuk masalah ini"_.

| #   | Yang dilakukan                                          | Yang seharusnya terjadi                                    | Hasil |
| --- | ------------------------------------------------------- | ------------------------------------------------------------ | ----- |
| E1  | Login **admin** → Katalog Device → cari **`samsung a20`** | **Ketemu** Galaxy A20 (inilah yang kemarin gagal)            |       |
| E2  | Cari **`a20 samsung`** (urutan dibalik)                  | Ketemu juga                                                  |       |
| E3  | Cari **`sam a2`** (setengah kata)                        | Tetap ketemu — mengetik separuh sudah cukup                  |       |
| E4  | Cari **`samsung iphone`**                                | **Kosong** — bukan malah menampilkan semua Samsung dan iPhone |       |

---

## F — Regresi: yang lama harus tetap jalan

| #   | Yang dilakukan                                          | Yang seharusnya terjadi | Hasil |
| --- | ------------------------------------------------------- | ----------------------- | ----- |
| F1  | Terima unit lengkap seperti biasa (pelanggan baru)      | Tetap jalan             |       |
| F2  | Login teknisi → ambil pekerjaan dari antrian di Beranda | Tetap jalan             |       |
| F3  | Kasir → transaksi POS tunai                             | Tetap jalan             |       |
| F4  | Kasir → buka Piutang, lihat pengelompokan per pelanggan | Tetap jalan             |       |
| F5  | Kasir ketik `/finance/ledger`                           | Tetap **ditolak**       |       |

---

## Kesimpulan Anda

Pilih salah satu, lalu tulis alasannya:

- [ ] **Lanjut ke R2** (form servis per tahap — yang sudah tiga kali Anda sebut, dan
      aturannya sudah Anda tetapkan 2026-08-04)
- [ ] **Masih ada yang harus diperbaiki dulu** →

```
(tulis di sini)
```

---

## Yang TIDAK ada di R1.10, supaya tidak Anda cari

1. **Device dipilih saat intake dari riwayat pelanggan** (poin A3 Anda), berikut riwayat
   pekerjaan per device dan **penghapusan fitur tambah device di halaman pelanggan**.
   Anda sendiri menyetujui ini masuk **R2** — ia mengubah alur Terima Unit, dan R2 memang
   membangun ulang form servis per tahap. Mengerjakannya sekarang berarti mengerjakannya
   dua kali.
2. **Lempar-lempar data kasir ↔ teknisi** (poin E4/E5 Anda) — **R2**, kalimat Anda sendiri:
   _"sepertinya itu thap R2 ya"_.
3. **Cetak otomatis saat simpan** (poin F5 Anda) — belum Anda coba, jadi belum diubah
   apa pun. Cetak otomatis Anda minta sendiri di uji R1.5 (A7), jadi mematikannya tanpa
   Anda coba dulu justru membatalkan permintaan Anda sebelumnya. Kalau sempat, cobalah dan
   beri tahu.
4. **Buka/Tutup Kasir** — tetap **Fase R6**, dikerjakan setelah R2 atas keputusan Anda.
5. **Cetak fisik dengan printer sungguhan** — butuh perangkat keras, sama seperti 6D.1.
