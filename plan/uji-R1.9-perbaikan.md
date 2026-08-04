# Checklist Uji Manual — Fase R1.9

> **Untuk pemilik.** Ditulis 2026-08-04, setelah kode R1.9 selesai.
> Rencananya: [`R1.9-perbaikan-hasil-uji-R1.8.md`](R1.9-perbaikan-hasil-uji-R1.8.md)
>
> **Ini gerbang R2.** R2 tidak dimulai sebelum berkas ini Anda isi.

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

**Sebelum mulai:** jalankan `npm run db:reset` di `flowserv-api/` supaya datanya segar.
Setelah reset, Budi Santoso sengaja punya **dua** nota belum lunas — itu yang membuat
bagian B bisa diuji.

---

## A — Kasir & Manager akhirnya punya jalan ke Pelanggan

> Ini poin **A6** uji R1.8 yang **tidak bisa Anda uji sama sekali** waktu itu: izinnya
> sudah kasir punya sejak dulu, tapi baris menunya tidak pernah dibuat.

| #   | Yang dilakukan                                                                 | Yang seharusnya terjadi                                                | Hasil                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Login **kasir** → lihat menu kiri                                              | Ada baris **"Pelanggan"**                                              | OK tambahan untuk kategori pelanggan tidak bisa di ubah ubah oleh kasir jadi kategorinya readonly hanya bisa di edit oleh manager                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| A2  | Klik baris itu                                                                 | Halaman Pelanggan **terbuka** (bukan dipentalkan ke Beranda)           | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A3  | Buka satu pelanggan lama → tekan **"Servis Unit Ini"** pada salah satu unitnya | Form Terima Unit terbuka, **merek & model TIDAK diminta ulang**        | untuk masalah ini sebaiknya bisa di pilih saat intake saja agar lebih cepat jadi ketika kasir memilih nama yang sudah terdaftar ada riwayat device yang pernah dia service bisa di pilih yang itu ataupun input baru jangan lewat menu pelanggan dan alangkah lebih baiknya jika ada riwayat pekerjaannya juga di bagian device pelanggan dan hapus saja fitur untuk menambahkan device di halaman pelanggan soalnya cara menambahkanya lewat intake service saja tidak lewat fitur tambah device di halaman pelanggan agar alurnya lebih rapi dan tidak ada kebingungan untuk penggunaan aplikasinya |
| A4  | Isi keluhan → Simpan                                                           | Tiket jadi. Coba juga **mengosongkan keluhan** — harus ditolak         | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A5  | Login **manager**                                                              | Baris "Pelanggan" juga ada, dan halamannya terbuka                     | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A6  | Login **teknisi**                                                              | Baris "Pelanggan" **tidak ada** (teknisi tidak mendaftarkan pelanggan) | OK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

---

## B — Siapa yang boleh memberi pelanggan hak berutang

> **Ini tidak Anda minta, dan alasannya perlu Anda setujui atau tolak.** Begitu kasir punya
> jalan ke halaman pelanggan (A di atas), ia otomatis ikut mendapat sakelar
> **"Boleh bayar tempo"** — artinya kasir bisa memberi pelanggan hak berutang. Itu menabrak
> keputusan Anda sendiri di D1 (_"pelanggan baru tak boleh utang sampai diizinkan"_), jadi
> wewenang itu dipisah: **manajer & pemilik saja.**
>
> Kalau menurut Anda kasir memang boleh, katakan — mencabutnya kembali cuma satu baris.

| #   | Yang dilakukan                                                | Yang seharusnya terjadi                                                                                                    | Hasil                                                                                                                        |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| B1  | Login **kasir** → buka satu pelanggan                         | Status tempo (**Diizinkan / Tidak diizinkan**) **tetap terlihat** — kasir perlu tahu ini sebelum menawarkan Tempo di kasir | OK                                                                                                                           |
| B2  | Di halaman yang sama, cari tombol "Izinkan tempo"             | **Tidak ada.** Yang muncul: "Hanya manajer/pemilik yang dapat mengubah ini."                                               | OK                                                                                                                           |
| B3  | Masih sebagai kasir: **Tambah Pelanggan**                     | Formnya **tidak punya** centang "Boleh bayar tempo"                                                                        | OK                                                                                                                           |
| B4  | Kasir mengubah **nama / nomor telepon** pelanggan lalu simpan | **Tetap berhasil** — hanya sakelar tempo yang dibatasi, bukan seluruh halamannya                                           | OK tapi tabel tidak refresh otomatis dan tidak ada toast untuk mengetahui apakah berhasil atau tidaknya penambahan pelanggan |
| B5  | Login **manager** → buka pelanggan yang sama                  | Tombol "Izinkan tempo" **ada** dan berfungsi                                                                               | OK                                                                                                                           |
| B6  | **Pendapat Anda:** haruskah kasir boleh memberi hak tempo?    | (jawab bebas)                                                                                                              | Tidak hak tempo hanya boleh oleh manager atau super admin                                                                    |

---

## C — Piutang dikelompokkan per pelanggan

> Poin **B1** uji R1.8: _"misalnya pelanggan itu mempunyai dua nota yang belum di bayar jadi
> rinciannya lebih jelas di bagian tagihan di lihat sub totalnya nanti bisa di klik lagi
> untuk melihat detail per notanya"_

| #   | Yang dilakukan                                      | Yang seharusnya terjadi                                                               | Hasil |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------- | ----- |
| C1  | Login **kasir** → Beranda → klik kartu **Piutang**  | Halaman piutang terbuka                                                               | OK    |
| C2  | Lihat baris **Budi Santoso**                        | **Satu** baris, bertuliskan **"2 nota"**, sisa piutang **Rp 725.000** (450rb + 275rb) | OK    |
| C3  | Klik nama **Budi Santoso**                          | Membentang jadi **dua** notanya (INV-SEED-0001 & INV-SEED-0003)                       | OK    |
| C4  | Tekan **Rincian** pada salah satunya                | Isi tagihannya terbaca (barang/jasa + jumlahnya)                                      | OK    |
| C5  | Tekan **Bayar** pada salah satunya                  | Form pembayaran terbuka untuk **nota itu saja**, bukan gabungan                       | OK    |
| C6  | Lihat baris **Siti Aminah** (hanya 1 nota)          | Tampil **datar** — tombol Rincian & Bayar langsung ada, **tanpa** perlu klik dulu     | OK    |
| C7  | Masih sebagai kasir, ketik alamat `/finance/ledger` | **Ditolak** — dipentalkan ke Beranda dengan pesan                                     | OK    |
| C8  | Sama, `/finance/payables` dan `/finance`            | **Ditolak** juga                                                                      | OK    |

> C7/C8 sengaja diulang: pengelompokan di atas tidak boleh diam-diam membuka halaman
> keuangan lain untuk kasir.

---

## D — Katalog Device: bisa dihapus & panelnya bisa ditindaklanjuti

> Poin **D1** uji R1.8: _"sebaiknya ada tombol hapus di bagian katalog devicenya dan untuk
> UI dan UXnya juga harus di perbaiki"_

| #   | Yang dilakukan                                                                                                 | Yang seharusnya terjadi                                                                          | Hasil                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Login **admin** → **Lainnya → Katalog Device**                                                                 | Halaman terbuka, tiap merek menyebut jumlah modelnya                                             |                                                                                                                                                                                    |
| D2  | Ketik **`A10`** di kotak cari                                                                                  | Hasilnya **satu daftar datar** — tiap baris menyebut mereknya. Dulu harus memindai puluhan kartu | OK tapi pencariannya harus lengkapp ya misalnya saya cari samsung a20 tidak di temukan harus samsung galaxy a20 baru bisa di temukan saya harap bisa di perbaiki untuk masalah ini |
| D3  | Buat model baru sembarang (mis. "ZZ Coba"), lalu tekan **Hapus** di barisnya                                   | Muncul konfirmasi → setelah OK, modelnya **hilang**                                              | OK                                                                                                                                                                                 |
| D4  | Coba **Hapus** model **Galaxy A10** (yang dipakai unit pelanggan dari seed)                                    | **Ditolak**, dengan pesan yang menyebut **berapa** yang memakainya — bukan error teknis          | OK                                                                                                                                                                                 |
| D5  | Coba **Hapus** merek **Samsung** (masih punya ratusan model)                                                   | **Ditolak**, pesannya menyebut jumlah modelnya                                                   | OK                                                                                                                                                                                 |
| D6  | Buat merek baru salah ketik (mis. "Smasung"), lalu tekan **Ubah**                                              | Namanya bisa dibetulkan. **Dulu tidak bisa sama sekali**                                         | OK                                                                                                                                                                                 |
| D7  | Hapus merek yang baru dibuat itu (belum punya model)                                                           | Terhapus                                                                                         | OK                                                                                                                                                                                 |
| D8  | Terima satu unit dengan merek/model yang **belum ada di katalog** (mis. "Advan G30"), lalu buka Katalog Device | Baris itu muncul di panel **"Belum ada di katalog"**                                             | OK                                                                                                                                                                                 |
| D9  | Tekan **"Tambahkan ke katalog"** di baris tersebut                                                             | Merek + modelnya **langsung dibuat**, dan barisnya **hilang** dari panel                         | OK                                                                                                                                                                                 |
| D10 | Login **kasir** → coba buka `/devices`                                                                         | (catat apa yang terjadi — ini yang belum diputuskan, lihat catatan di bawah)                     | jangan biarkan di akses selain oleh super admin                                                                                                                                    |

> **D10 sengaja terbuka.** Katalog Device sekarang hanya ada di menu Super Admin. Kalau
> menurut Anda kasir juga perlu melihatnya (bukan mengubahnya), katakan.

---

## E — Perkiraan konter vs estimasi teknisi

> Poin **F2** uji R1.8: _"ya nanti teknisi bisa saja mengubah angka estimasi itu jika memang
> di temukan ada kerusakan yang lainnya"_.
>
> **Anda memilih: simpan keduanya, angka konter tidak bisa diubah.** Jadi yang dibangun:
> kedua angka tampil berdampingan beserta **selisihnya**, dan angka konter dikunci begitu
> unitnya lepas dari meja penerimaan.

| #   | Yang dilakukan                                                                        | Yang seharusnya terjadi                                                              | Hasil                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Login **kasir** → Terima Unit → isi **Perkiraan Biaya** `450000` → Simpan             | Tiket jadi                                                                           | X                                                                                                                                                 |
| E2  | Buka tiket itu (masih tahap **Terima Unit**), lalu ubah perkiraannya jadi `500000`    | **Boleh** — salah ketik di konter harus bisa dibetulkan selagi unitnya masih di meja | di bagian mana saya bisa merubahnya untuk saat ini masih belum bisa di ubah nominalnya                                                            |
| E3  | Majukan tiket ke **Diagnosis**, lalu coba ubah perkiraannya lagi                      | **Ditolak**, dengan pesan yang menjelaskan kenapa                                    | tahap di atasnya masih belum bisa saya coba                                                                                                       |
| E4  | Login **teknisi** → catat sparepart/jasa senilai `700000` di tiket itu                | Tersimpan                                                                            | OK tetapi untuk alurnya masih belum rapi nanti di rapikan di bagian R2                                                                            |
| E5  | Lihat kotak perkiraan di halaman tiket                                                | **Perkiraan Konter Rp 500.000** dan **Estimasi Teknisi Rp 700.000** berdampingan     | OK ada di bagia detail tetapi belum sepenuhnya benar alurnya tidak ada lempar lempar data antara kasir dan juga teknisi sepertinya itu thap R2 ya |
| E6  | Lihat di bawahnya                                                                     | Ada kalimat selisih: **"Lebih mahal Rp 200.000 dari yang disebutkan di konter"**     |                                                                                                                                                   |
| E7  | **Pendapat Anda:** apakah kalimat selisih itu sudah cukup, atau perlu lebih menonjol? | (jawab bebas)                                                                        | OK sudah cukup untuk kali ini                                                                                                                     |

---

## F — Kasir memilih apa yang dicetak di Terima Unit

> Poin **F5** uji R1.8: _"biarkan ini kasir yang memilih ada opsi cetak nota"_

| #   | Yang dilakukan                                                                                                                                  | Yang seharusnya terjadi                                                                             | Hasil                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| F1  | Login **kasir** → Terima Unit → simpan satu unit                                                                                                | Panel hijau "berhasil dibuat" muncul, berisi **dua tombol**: Cetak Label & Cetak Tanda Terima       | OK                                                                                                      |
| F2  | Tekan **Cetak Tanda Terima**                                                                                                                    | Tercetak. Kalau printer/agen mati: muncul **pesan yang bisa dibaca**, halaman **tidak menggantung** | OK                                                                                                      |
| F3  | Tekan **Cetak Label**                                                                                                                           | Sama                                                                                                | OK                                                                                                      |
| F4  | Gulir ke **Unit Masuk Terbaru** di bawah form                                                                                                   | Ada tombol cetak ulang untuk unit terakhir (label copot, pelanggan minta tanda terima lagi)         | OK                                                                                                      |
| F5  | **Pertanyaan penting:** sekarang tombolnya sudah ada — apakah cetak **otomatis** saat simpan masih Anda inginkan, atau lebih baik hanya manual? | (jawab bebas)                                                                                       | masih belum saya coba ctak otomatisnya tetapi untuk tombonya sudah ada untuk cetak label dan cetak nota |

> **F5 adalah pertanyaan, bukan uji.** Cetak otomatis **sengaja tidak dicabut** — Anda
> memintanya di uji R1.5 (poin A7), jadi mematikannya diam-diam justru membatalkan
> permintaan Anda sebelumnya.

---

## G — Regresi: yang lama harus tetap jalan

| #   | Yang dilakukan                                          | Yang seharusnya terjadi | Hasil |
| --- | ------------------------------------------------------- | ----------------------- | ----- |
| G1  | Terima unit lengkap seperti biasa (pelanggan baru)      | Tetap jalan             | OK    |
| G2  | Login teknisi → ambil pekerjaan dari antrian di Beranda | Tetap jalan             | OK    |
| G3  | Kasir → transaksi POS tunai                             | Tetap jalan             | OK    |
| G4  | Kasir → terima pembayaran dari halaman Piutang          | Tetap jalan             | OK    |
| G5  | Admin → buka Buku Kas & Hutang Supplier                 | Tetap jalan             | OK    |

---

## Kesimpulan Anda

Pilih salah satu, lalu tulis alasannya:

- [ ] **Lanjut ke R2** (form servis per langkah — yang tiga kali Anda sebut)
- [x] **Ada yang harus diperbaiki dulu** →

```
ini tergantung keputusan anda apakah sebaiknya lanjut ke R2 atau perbaiki dulu catatan di atas
```

---

## Dua hal yang TIDAK ada di R1.9, supaya tidak Anda cari

1. **Buka/Tutup Kasir** (poin C1 uji R1.8). Sudah dibuka sebagai **Fase R6** di
   [`tahap-b-peran-dan-qc.md`](tahap-b-peran-dan-qc.md), dikerjakan **setelah R2** atas
   keputusan Anda. Ia menyentuh POS, piutang, dan buku kas sekaligus — bukan tambalan.
   **Nomor antrian sudah reset tiap hari secara otomatis** hari ini, jadi tidak ada yang
   rusak selama menunggu.
2. **Cetak fisik dengan printer sungguhan** — sama statusnya dengan 6D.1: butuh perangkat
   keras, tidak bisa dibuktikan dari sini. Poin F2/F3 di atas menguji sampai batas yang bisa
   diuji tanpa printer.
