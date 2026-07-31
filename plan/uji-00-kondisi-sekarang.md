# Uji Manual — Kondisi Aplikasi Sekarang (sebelum perbaikan apa pun)

> **Opsional, dan tidak menghalangi fase R1.** Ini potret aplikasi **apa adanya hari ini**.
> Kerjakan kapan sempat — bahkan sebagian saja sudah berguna.
>
> **Kenapa ada:** perbaikan R1–R3 hanya menyentuh peran, halaman tiket, dan QC. Sisa
> aplikasi (stok, pembelian, kasir, keuangan, cetak) **belum pernah Anda uji sendiri
> menyeluruh**. Kalau ada yang rusak di sana, lebih baik ketahuan sekarang daripada saat
> toko sudah bergantung padanya.
>
> **Penting:** dua peran masih terblokir hari ini — **kasir tidak bisa membuat tiket**, dan
> **teknisi tidak bisa mengambil pekerjaan yang belum bertuan**. Itu yang diperbaiki di R1.
> Jadi di berkas ini, alur servis dijalankan sebagai **Super Admin**.

## Cara mengisi

Tiap poin punya dua baris:
- **Harusnya:** apa yang saya harapkan terjadi
- **Catatan saya:** ← **yang paling berharga.** `OK` / `GAGAL — pesan xxx` /
  `Jalan, TAPI di toko saya harusnya begini...`

Centang `[x]` = sudah dijalankan (bukan berarti lulus — hasilnya di Catatan).
🚧 = **belum dibangun sama sekali**; poinnya ada supaya Anda bisa bilang butuh atau tidak.

---

# 1. Persiapan

- [ ] **1.1** Jalankan `start-flowserv.bat` — 4 jendela hidup (Postgres, API, Web, Printer Agent)
  - **Catatan saya:**

- [ ] **1.2** Buka `flowserv-api/.env`, pastikan `RBAC_MODE=enforce`
  - **Harusnya:** kalau `report`, semua gerbang izin mati dan uji peran jadi tak berarti
  - **Catatan saya:**

- [ ] **1.3** Siapkan 4 akun: Super Admin, Manager, Teknisi, Kasir
  - **Catatan saya:**

- [ ] **1.4** Buka aplikasi dari HP lewat alamat LAN yang tercetak di jendela peluncur
  - **Catatan saya:**

---

# 2. Setup Awal (sebagai Super Admin)

## 2A. Perusahaan, cabang, pengguna

- [ ] **2.1** Setelan → Perusahaan → ubah nama toko → Simpan → muat ulang
  - **Harusnya:** nama baru bertahan setelah refresh
  - **Catatan saya:**

- [ ] **2.2** Setelan → Cabang → tambah cabang baru, lalu ubah namanya
  - **Catatan saya:**

- [ ] **2.3** Perhatikan data toko yang bisa diisi
  - **Harusnya:** saat ini **hanya nama** — alamat/telepon/logo belum ada kolomnya
  - **Pertanyaan:** butuh alamat & telepon toko tercetak di nota?
  - **Catatan saya:**

- [ ] **2.4** Setelan → Pengguna & Peran → buat user baru (peran Kasir), lalu login sebagai dia
  - **Catatan saya:**

- [ ] **2.5** Nonaktifkan user itu, lalu coba login lagi
  - **Harusnya:** **ditolak** dengan pesan akun tidak aktif
  - **Catatan saya:**

- [ ] **2.6** Coba nonaktifkan **Super Admin terakhir** (akun Anda sendiri)
  - **Harusnya:** **ditolak** — pengaman supaya Anda tidak terkunci
  - **Catatan saya:**

- [ ] **2.7** Buat user dengan email yang sudah dipakai
  - **Harusnya:** ditolak, bukan bikin akun kembar
  - **Catatan saya:**

- [ ] **2.8** Ubah peran seorang user, lalu login sebagai dia
  - **Harusnya:** menunya berubah mengikuti peran baru
  - **Catatan saya:**

- [ ] **2.9** 🚧 Cari layar untuk **mengubah izin per peran** (mis. "kasir boleh diskon")
  - **Harusnya:** belum ada
  - **Pertanyaan:** seberapa sering Anda perlu mengubah ini?
  - **Catatan saya:**

## 2B. Metode pembayaran

- [ ] **2.10** Setelan → Metode Pembayaran → lihat daftar
  - **Harusnya:** tunai, transfer, QRIS, e-wallet (Dana/OVO/GoPay), tempo
  - **Catatan saya:**

- [ ] **2.11** Tambah metode baru → cek muncul di menu Kasir
  - **Catatan saya:**

- [ ] **2.12** Nonaktifkan satu metode → cek hilang dari pilihan di Kasir
  - **Catatan saya:**

## 2C. Printer

- [ ] **2.13** Setelan → Printer → tambah perangkat jenis **win32**
  - **Catatan saya:**

- [ ] **2.14** Klik **Pindai Printer di Komputer Ini**
  - **Harusnya:** printer yang terpasang di Windows muncul, yang cocok ditandai "disarankan"
  - **Catatan saya:**

- [ ] **2.15** 🔴 Pilih printer thermal Anda → klik **Test Cetak**
  - **Harusnya:** **kertas benar-benar keluar dan terpotong.** Ini pengujian yang belum
    pernah dilakukan siapa pun — hanya Anda yang punya printernya
  - **Catatan saya:**

- [ ] **2.16** Atur penugasan dokumen: cabang mana pakai template mana
  - **Catatan saya:**

- [ ] **2.17** Coba pasangkan template 80mm ke printer 58mm
  - **Harusnya:** **ditolak** — ukuran tidak cocok
  - **Catatan saya:**

- [ ] **2.18** Matikan jendela Printer Agent, lalu coba cetak
  - **Harusnya:** pesan "printer agent tidak terdeteksi", **bukan** halaman menggantung
  - **Catatan saya:**

- [ ] **2.19** Pindahkan `printer-agent.exe` ke folder lain **bersama `config.json`**,
      jalankan dari sana
  - **Harusnya:** pilihan printer tetap teringat
  - **Catatan saya:**

## 2D. Editor alur servis

- [ ] **2.20** Menu Lainnya → Alur Servis → buka alur yang ada
  - **Harusnya:** tergambar sebagai **diagram bercabang**, bukan daftar baris
  - **Catatan saya:**

- [ ] **2.21** Klik satu tahap → baca keterangannya
  - **Harusnya:** ada penjelasan "tahap ini untuk apa" dalam bahasa toko
  - **Catatan saya:**

- [ ] **2.22** Ubah **jenis tahap** (Penerimaan / Pemeriksaan / Pengerjaan / Penagihan / Penutup)
  - **Harusnya:** satu pilihan, bukan tiga sakelar
  - **Catatan saya:**

- [ ] **2.23** Sisipkan tahap baru dengan **menyeret** dari daftar ke tanda **+** di panah
  - **Catatan saya:**

- [ ] **2.24** Di HP: sisipkan tahap pakai **tombol ketuk** (bukan seret)
  - **Catatan saya:**

- [ ] **2.25** Coba **hapus tahap inti** (mis. Diagnosis) dan **tukar urutan** dua tahap inti
  - **Harusnya:** dua-duanya **ditolak** — alur inti terkunci
  - **Catatan saya:**

- [ ] **2.26** Lepas tahap tambahan (QC) dengan tombol ✕
  - **Harusnya:** alur menyambung sendiri melewatinya
  - **Catatan saya:**

- [ ] **2.27** Buat alur servis **baru** dari nol
  - **Harusnya:** lahir dengan tahap inti lengkap, bukan kanvas kosong
  - **Catatan saya:**

- [ ] **2.28** Coba hapus alur yang sedang dipakai tiket
  - **Harusnya:** ditolak dengan alasan jelas
  - **Catatan saya:**

- [ ] **2.29** Ubah jenis sebuah tahap jadi **Penerimaan**, lalu buka tiket di tahap itu
  - **Harusnya:** form sparepart terkunci — perubahan di editor **benar-benar** mengubah
    perilaku aplikasi
  - **Catatan saya:**

## 2E. Template nota

- [ ] **2.30** Setelan → Printer → Template → Edit sebuah template
  - **Harusnya:** ada pratinjau di sebelah sakelarnya
  - **Catatan saya:**

- [ ] **2.31** Nyalakan/matikan sebuah sakelar
  - **Harusnya:** pratinjau berubah **langsung**
  - **Catatan saya:**

- [ ] **2.32** Duplikat template, ubah, simpan, pakai untuk mencetak nota nyata
  - **Harusnya:** hasil cetak = yang di pratinjau
  - **Catatan saya:**

- [ ] **2.33** Coba hapus template yang sedang dipakai cabang
  - **Harusnya:** ditolak, menyebut cabangnya
  - **Catatan saya:**

- [ ] **2.34** 🚧 Cari cara mengatur **tata letak bebas** nota (geser posisi, ubah ukuran huruf)
  - **Harusnya:** belum ada — yang ada baru sakelar tampil/sembunyi
  - **Pertanyaan:** butuh?
  - **Catatan saya:**

---

# 3. Master Data Stok

- [ ] **3.1** Stok → Kategori → buat kategori + isi **target margin**
  - **Catatan saya:**

- [ ] **3.2** Coba isi target margin kotor `100` atau lebih
  - **Harusnya:** ditolak (mustahil secara matematis)
  - **Catatan saya:**

- [ ] **3.3** Stok → Merk Sparepart → tambah merk + kelas kualitas (ori/OEM/KW)
  - **Catatan saya:**

- [ ] **3.4** Stok → Supplier → tambah supplier + isi **tempo berapa hari**
  - **Catatan saya:**

- [ ] **3.5** Kaitkan supplier itu ke merk yang dia jual
  - **Catatan saya:**

- [ ] **3.6** Stok → Tambah Barang (SKU, kode, nama, kategori, harga jual, titik pesan ulang)
  - **Catatan saya:**

- [ ] **3.7** Buka detail barang itu
  - **Harusnya:** langsung punya baris stok 0 untuk **tiap cabang**, bukan error
  - **Catatan saya:**

- [ ] **3.8** Atur **harga berbeda per merk** untuk satu barang (ori vs KW)
  - **Catatan saya:**

- [ ] **3.9** Atur **kompatibilitas** barang dengan model device tertentu
  - **Catatan saya:**

- [ ] **3.10** Coba isi harga jual **di bawah harga modal**
  - **Harusnya:** ditolak, kecuali sengaja mencentang "boleh di bawah modal"
  - **Catatan saya:**

- [ ] **3.11** Isi harga jual di atas modal tapi **di bawah target margin**
  - **Harusnya:** tersimpan, tapi muncul **peringatan** margin
  - **Catatan saya:**

- [ ] **3.12** Pakai **Simulator Harga** di detail barang
  - **Catatan saya:**

- [ ] **3.13** Stok → cari barang + saring "Stok Menipis"
  - **Catatan saya:**

- [ ] **3.14** Buka Katalog Device → cek merk & model tersedia
  - **Catatan saya:**

---

# 4. Stok Masuk

> **Bagian paling menentukan.** Masalah "stok berantakan" beres atau tidak ditentukan di sini.

## 4A. Lewat Purchase Order

- [ ] **4.1** Pembelian → Buat PO baru (cabang, supplier, beberapa barang + jumlah)
  - **Catatan saya:**

- [ ] **4.2** Ubah status PO jadi **dipesan**
  - **Harusnya:** pindah ke tab "Menunggu Barang"
  - **Catatan saya:**

- [ ] **4.3** Klik **Terima Barang** di baris PO itu
  - **Harusnya:** tombolnya ada **di baris PO**, tak perlu mencari menu lain
  - **Catatan saya:**

- [ ] **4.4** Terima **sebagian** (mis. pesan 10, datang 6)
  - **Harusnya:** status jadi "Diterima sebagian", sisanya masih bisa diterima
  - **Catatan saya:**

- [ ] **4.5** Terima sisanya (4)
  - **Harusnya:** total jadi **10**, bukan 4 — angka sebelumnya tidak tertimpa
  - **Catatan saya:**

- [ ] **4.6** Coba terima **lebih banyak** dari yang dipesan
  - **Harusnya:** ditolak
  - **Catatan saya:**

- [ ] **4.7** Terima barang dengan **pecah per merk** (mis. 6 ori + 4 KW)
  - **Harusnya:** jadi dua batch terpisah dengan harga modal masing-masing
  - **Catatan saya:**

- [ ] **4.8** Cek menu Stok setelah penerimaan
  - **Harusnya:** bertambah tepat sesuai yang diterima
  - **Catatan saya:**

- [ ] **4.9** Klik **Catat Nota** di baris PO → isi nomor nota, tanggal, **harga modal asli**,
      harga jual baru
  - **Catatan saya:**

- [ ] **4.10** Pilih pembayaran **Tempo**
  - **Harusnya:** tanggal jatuh tempo terisi otomatis dari tempo supplier
  - **Catatan saya:**

- [ ] **4.11** Isi harga jual di bawah harga modal baru
  - **Harusnya:** ditolak
  - **Catatan saya:**

- [ ] **4.12** Buka detail barang → riwayat batch
  - **Harusnya:** terlihat supplier, cabang, tanggal terima, jumlah per batch
  - **Catatan saya:**

- [ ] **4.13** Buka Keuangan → Hutang Supplier
  - **Harusnya:** nota tempo tadi muncul sebagai hutang
  - **Catatan saya:**

- [ ] **4.14** Coba hapus PO yang sudah diterima
  - **Harusnya:** ditolak
  - **Catatan saya:**

## 4B. Stok awal / opname

- [ ] **4.15** Stok → Opname → masukkan barang + jumlah fisik + harga modal
  - **Harusnya:** ini jalur untuk **stok awal toko**, tanpa PO palsu
  - **Catatan saya:**

- [ ] **4.16** Cek stok setelah opname
  - **Catatan saya:**

- [ ] **4.17** Buka **Rekonsiliasi Stok** (`/v1/inventory/reconciliation`)
  - **Harusnya:** daftar selisih **kosong**. Kalau ada isinya, ada yang salah
  - **Catatan saya:**

- [ ] **4.18** 🚧 Cari tombol "terima stok manual tanpa PO" di halaman Stok
  - **Harusnya:** **tidak ada** — jalurnya ada di belakang layar tapi tanpa tombol
    (rencananya dihapus di R4)
  - **Pertanyaan:** butuh jalur ini, terpisah dari Opname?
  - **Catatan saya:**

---

# 5. Alur Servis Lengkap (jalankan sebagai **Super Admin**)

> Kasir & teknisi masih terblokir hari ini — itu yang R1 perbaiki. Untuk sekarang, jalankan
> seluruh alur pakai satu akun Super Admin supaya **alurnya sendiri** teruji.

- [ ] **5.1** Servis → Terima Unit → isi pelanggan **baru** + nomor HP
  - **Catatan saya:**

- [ ] **5.2** Ketik merk/model unit
  - **Harusnya:** muncul saran otomatis dari katalog device
  - **Catatan saya:**

- [ ] **5.3** Isi keluhan + sandi/pola unit
  - **Harusnya:** bisa pilih PIN atau pola, tidak memakan banyak tempat
  - **Catatan saya:**

- [ ] **5.4** Buka "Data tambahan (opsional)"
  - **Harusnya:** email & nomor seri ada di sini, terlipat
  - **Catatan saya:**

- [ ] **5.5** Simpan
  - **Harusnya:** **label + nomor antrian tercetak otomatis**
  - **Catatan saya:**

- [ ] **5.6** Periksa isi label
  - **Harusnya:** nomor antrian, nama, keluhan, sandi — terbaca jelas
  - **Catatan saya:**

- [ ] **5.7** Coba tambah sparepart **saat masih di tahap Intake**
  - **Harusnya:** **ditolak** — unit belum diperiksa
  - **Catatan saya:**

- [ ] **5.8** Majukan Intake → **Diagnosis**
  - **Catatan saya:**

- [ ] **5.9** Isi **Hasil Diagnosa** + estimasi lama pengerjaan → Simpan
  - **Catatan saya:**

- [ ] **5.10** Tambah sparepart dari stok + biaya jasa
  - **Catatan saya:**

- [ ] **5.11** Ubah jumlah / hapus salah satu biaya
  - **Harusnya:** total ikut berubah
  - **Catatan saya:**

- [ ] **5.12** Klik **Minta Persetujuan** / buat kuotasi
  - **Harusnya:** biaya jadi "disetujui", **stok sparepart otomatis terkunci**
  - **Catatan saya:**

- [ ] **5.13** Buka menu Kasir di tab lain, cari sparepart yang dikunci
  - **Harusnya:** stok yang bisa dijual **berkurang** sebanyak yang dikunci
  - **Catatan saya:**

- [ ] **5.14** Pilih cabang **Ditunggu** atau **Unit Disimpan**
  - **Harusnya:** dua-duanya tersedia **setelah** diagnosis, bukan ditanya di intake
  - **Catatan saya:**

- [ ] **5.15** Kalau **Unit Disimpan** — perhatikan setelah tahap berpindah
  - **Harusnya:** **tanda terima + label tercetak otomatis**
  - **Catatan saya:**

- [ ] **5.16** Kalau **Ditunggu**
  - **Harusnya:** **tidak ada** dokumen tercetak
  - **Catatan saya:**

- [ ] **5.17** Periksa isi tanda terima
  - **Harusnya:** bukti titip unit, **tanpa harga**
  - **Catatan saya:**

- [ ] **5.18** Majukan ke tahap **Pengerjaan** → klik **Pakai** pada sparepart
  - **Harusnya:** stok benar-benar berkurang (cek di menu Stok)
  - **Catatan saya:**

- [ ] **5.19** Klik **Kembalikan** pada sparepart yang belum jadi dipakai
  - **Harusnya:** stok kembali naik
  - **Catatan saya:**

- [ ] **5.20** Tambah temuan baru saat bongkar (mis. konektor rusak, Rp 50.000)
  - **Harusnya:** muncul panel **"Temuan Baru (Change Order)"**
  - **Catatan saya:**

- [ ] **5.21** Klik **Minta Persetujuan Tambahan**
  - **Harusnya:** total disetujui = total lama + temuan baru
  - **Catatan saya:**

- [ ] **5.22** Isi daftar periksa QC (kalau alur Anda memakainya)
  - **Harusnya:** bisa dicentang. **Belum bisa "silang"** — itu yang R3 perbaiki
  - **Catatan saya:**

- [ ] **5.23** Buat **nota** dari tiket
  - **Harusnya:** berisi sparepart terpakai + jasa disetujui, total benar
  - **Catatan saya:**

- [ ] **5.24** Terima tunai — isi **uang diterima** lebih besar dari total
  - **Harusnya:** kembalian dihitung otomatis dan benar
  - **Catatan saya:**

- [ ] **5.25** Isi uang diterima **kurang** dari total
  - **Harusnya:** ditolak
  - **Catatan saya:**

- [ ] **5.26** Perhatikan setelah bayar
  - **Harusnya:** struk **otomatis** terkirim ke printer, tak perlu buka Riwayat
  - **Catatan saya:**

- [ ] **5.27** Periksa isi struk
  - **Harusnya:** nama toko, item, total, uang diterima, kembalian — semua lurus
  - **Catatan saya:**

- [ ] **5.28** Coba buat nota **kedua** untuk tiket yang sama
  - **Harusnya:** ditolak
  - **Catatan saya:**

- [ ] **5.29** Majukan tiket ke **Selesai**
  - **Harusnya:** tiket tertutup, tanggal tutup terisi
  - **Catatan saya:**

- [ ] **5.30** Cek Stok
  - **Harusnya:** berkurang **tepat** sebanyak yang dipakai — tidak dobel
  - **Catatan saya:**

- [ ] **5.31** Cek Keuangan
  - **Harusnya:** pemasukan hari ini bertambah sesuai nota
  - **Catatan saya:**

- [ ] **5.32** Buka rekonsiliasi stok lagi
  - **Harusnya:** masih bersih
  - **Catatan saya:**

- [ ] **5.33** Buat tiket lain lalu **batalkan**
  - **Harusnya:** status batal, dan **stok yang dikunci dilepas kembali**
  - **Catatan saya:**

- [ ] **5.34** Buat tiket lain, dari Diagnosis langsung ke Selesai ("tidak jadi diperbaiki")
  - **Harusnya:** bisa tanpa lewat pengerjaan
  - **Catatan saya:**

- [ ] **5.35** Buka papan **Kanban** tiket
  - **Harusnya:** kolom = tahap alur, kartu hanya bisa pindah ke tahap yang sah
  - **Catatan saya:**

- [ ] **5.36** Buka Kanban dari HP
  - **Harusnya:** kolom bisa digeser, ada cara pindah tahap dengan ketuk
  - **Catatan saya:**

---

# 6. Kasir / POS (penjualan langsung)

- [ ] **6.1** Menu Kasir → cari barang → masukkan ke keranjang
  - **Catatan saya:**

- [ ] **6.2** Ubah jumlah pakai tombol **+ / −**
  - **Harusnya:** cukup besar untuk disentuh
  - **Catatan saya:**

- [ ] **6.3** Tambah baris jasa/biaya bebas (bukan dari stok)
  - **Catatan saya:**

- [ ] **6.4** Simpan keranjang sebagai **draft**, buka draft lain, lanjutkan yang tadi
  - **Harusnya:** tombol "Lanjutkan Pembayaran" **terlihat tanpa perlu hover**
  - **Catatan saya:**

- [ ] **6.5** Bayar **tunai** dengan uang diterima
  - **Harusnya:** kembalian benar
  - **Catatan saya:**

- [ ] **6.6** Bayar **transfer / QRIS / e-wallet**
  - **Harusnya:** langsung lunas, kolom uang diterima tidak muncul
  - **Catatan saya:**

- [ ] **6.7** Bayar **tempo** untuk pelanggan yang **diizinkan** berhutang
  - **Harusnya:** nota jadi, status belum lunas
  - **Catatan saya:**

- [ ] **6.8** Bayar **tempo** untuk pelanggan yang **tidak** diizinkan
  - **Harusnya:** **ditolak**
  - **Catatan saya:**

- [ ] **6.9** Riwayat → klik nota → cetak ulang struk
  - **Catatan saya:**

- [ ] **6.10** Cetak **nota A4** dari Riwayat
  - **Harusnya:** yang tercetak hanya notanya, bukan seluruh halaman aplikasi
  - **Catatan saya:**

- [ ] **6.11** Catat **cicilan** pada nota tempo
  - **Harusnya:** sisa hutang berkurang
  - **Catatan saya:**

- [ ] **6.12** Bayar **melebihi** sisa hutang
  - **Harusnya:** ditolak
  - **Catatan saya:**

- [ ] **6.13** Batalkan (void) nota yang belum dibayar
  - **Harusnya:** stok kembali naik
  - **Catatan saya:**

- [ ] **6.14** Batalkan nota yang **sama** dua kali
  - **Harusnya:** yang kedua ditolak
  - **Catatan saya:**

- [ ] **6.15** 🚧 Cari cara **retur / tukar barang** yang sudah dibayar
  - **Harusnya:** **belum ada** — void ditolak kalau sudah ada pembayaran
  - **Pertanyaan penting:** bagaimana Anda menangani retur di toko sekarang? Berapa
    sering? Uang dikembalikan tunai atau ditukar barang?
  - **Catatan saya:**

- [ ] **6.16** 🚧 Cari cara **retur ke supplier** (barang datang rusak, dikirim balik)
  - **Harusnya:** **belum ada sama sekali**
  - **Pertanyaan:** berapa sering ini terjadi?
  - **Catatan saya:**

- [ ] **6.17** Buka menu Kasir dari **HP**
  - **Harusnya:** tidak geser ke samping, tombol besar
  - **Catatan saya:**

---

# 7. Keuangan

- [ ] **7.1** Keuangan → mode **Sederhana**
  - **Harusnya:** pemasukan hari ini, perkiraan laba bulan ini, piutang & hutang
  - **Catatan saya:**

- [ ] **7.2** Keuangan → mode **Akuntan**
  - **Harusnya:** tabel pendapatan / modal / laba kotor bulan berjalan
  - **Catatan saya:**

- [ ] **7.3** Cocokkan angka pemasukan dengan nota yang benar-benar Anda buat hari ini
  - **Harusnya:** **sama persis**
  - **Catatan saya:**

- [ ] **7.4** Buku Kas → cek entri dari penjualan & servis tadi
  - **Catatan saya:**

- [ ] **7.5** Hutang ke Supplier → bayar sebagian
  - **Harusnya:** status "sebagian", sisa berkurang
  - **Catatan saya:**

- [ ] **7.6** Lunasi sisanya, lalu coba bayar lagi
  - **Harusnya:** lunas, lalu percobaan berikutnya ditolak
  - **Catatan saya:**

- [ ] **7.7** Piutang Pelanggan → cek nota tempo tadi muncul
  - **Catatan saya:**

- [ ] **7.8** 🚧 Cari tombol **ekspor ke Excel / PDF**
  - **Pertanyaan:** butuh? untuk apa (pajak, laporan, arsip)?
  - **Catatan saya:**

- [ ] **7.9** 🚧 Cari **pencatatan pengeluaran toko** (listrik, sewa, gaji)
  - **Harusnya:** belum ada — yang tercatat baru pembelian barang
  - **Pertanyaan:** butuh?
  - **Catatan saya:**

---

# 8. Cetak

- [ ] **8.1** Cetak **label** unit dari tiket
  - **Harusnya:** pas di label, teks tidak terpotong
  - **Catatan saya:**

- [ ] **8.2** Cetak **tanda terima**
  - **Catatan saya:**

- [ ] **8.3** Cetak **struk** POS
  - **Harusnya:** kolom lurus, total sejajar kanan
  - **Catatan saya:**

- [ ] **8.4** Cetak **nota A4**
  - **Catatan saya:**

- [ ] **8.5** Bandingkan hasil cetak dengan **pratinjau di layar**
  - **Harusnya:** sama persis
  - **Catatan saya:**

---

# 9. Fitur Pendukung

- [ ] **9.1** Ketik nama pelanggan di **kotak pencarian atas**
  - **Harusnya:** hasil dikelompokkan (pelanggan / tiket / barang / supplier)
  - **Catatan saya:**

- [ ] **9.2** Cari pakai **nomor HP** dan **nomor seri unit**
  - **Catatan saya:**

- [ ] **9.3** Cari dengan **salah ketik** sedikit
  - **Harusnya:** **tidak ketemu** — pencarian belum toleran salah ketik
  - **Pertanyaan:** sering salah ketik saat cari?
  - **Catatan saya:**

- [ ] **9.4** Cari dari **HP**
  - **Harusnya:** ikon pencarian membuka layar penuh
  - **Catatan saya:**

- [ ] **9.5** Buka **Beranda** untuk tiap peran
  - **Harusnya:** isinya berbeda dan sesuai pekerjaan masing-masing
  - **Catatan saya:**

- [ ] **9.6** Klik kartu "stok menipis" di Beranda
  - **Harusnya:** langsung ke daftar stok yang **sudah tersaring**
  - **Catatan saya:**

- [ ] **9.7** 🚧 Coba **geser / atur ulang** posisi kartu di Beranda
  - **Pertanyaan:** butuh?
  - **Catatan saya:**

- [ ] **9.8** Buka **Katalog Produk** sebagai Kasir & Teknisi
  - **Harusnya:** bisa cek harga & stok tanpa akses admin
  - **Catatan saya:**

- [ ] **9.9** Detail barang → **Perbandingan Supplier**
  - **Harusnya:** harga terakhir tiap supplier + tanda supplier utama
  - **Catatan saya:**

- [ ] **9.10** Sebagai Super Admin, buka **Log Audit**; lalu coba sebagai Manager
  - **Harusnya:** Super Admin bisa, Manager ditolak
  - **Catatan saya:**

- [ ] **9.11** Pelanggan → detail → riwayat servisnya
  - **Catatan saya:**

- [ ] **9.12** Beri/cabut izin **tempo** pada pelanggan
  - **Catatan saya:**

---

# 10. Pengaman (semuanya HARUS gagal)

- [ ] **10.1** Kasir mencoba memberi **diskon**
  - **Harusnya:** kolom diskon tidak terlihat untuk kasir
  - **Catatan saya:**

- [ ] **10.2** Kasir mencoba **membatalkan** nota
  - **Harusnya:** ditolak
  - **Catatan saya:**

- [ ] **10.3** Jual barang yang stoknya **0**
  - **Harusnya:** ditolak
  - **Catatan saya:**

- [ ] **10.4** Jual barang yang stoknya **sedang dikunci** untuk tiket servis
  - **Harusnya:** ditolak
  - **Catatan saya:**

- [ ] **10.5** Teknisi ketik alamat `/finance` langsung di browser
  - **Harusnya:** tidak bisa melihat data keuangan
  - **Catatan saya:**

- [ ] **10.6** Kasir ketik alamat `/settings` langsung
  - **Harusnya:** tidak bisa mengubah setelan
  - **Catatan saya:**

- [ ] **10.7** Tekan tombol **Simpan / Bayar dua kali cepat**
  - **Harusnya:** hanya **satu** tiket / satu nota yang jadi
  - **Catatan saya:**

- [ ] **10.8** Dua orang di dua HP **memakai sparepart terakhir** bersamaan
  - **Harusnya:** satu berhasil, satu ditolak — stok **tidak** minus
  - **Catatan saya:**

- [ ] **10.9** Logout, lalu tekan tombol **Back** browser
  - **Harusnya:** tidak bisa kembali ke halaman dalam
  - **Catatan saya:**

- [ ] **10.10** Biarkan aplikasi terbuka lama, lalu klik sesuatu
  - **Harusnya:** kalau sesi habis, diarahkan ke login — bukan halaman error
  - **Catatan saya:**

---

# 11. Pemakaian Nyata (LAN, HP, cadangan)

- [ ] **11.1** Buka aplikasi dari **HP** lewat alamat LAN → login
  - **Catatan saya:**

- [ ] **11.2** Buat tiket **dari HP**, dari awal sampai simpan
  - **Catatan saya:**

- [ ] **11.3** Proses penjualan **dari HP**
  - **Catatan saya:**

- [ ] **11.4** Dua orang memakai aplikasi **bersamaan** di dua perangkat
  - **Catatan saya:**

- [ ] **11.5** Matikan WiFi HP di tengah penyimpanan, nyalakan lagi
  - **Harusnya:** tidak menghasilkan data dobel
  - **Catatan saya:**

- [ ] **11.6** Restart komputer server, jalankan `start-flowserv.bat` lagi
  - **Harusnya:** semua normal, data utuh
  - **Catatan saya:**

- [ ] **11.7** Jalankan `backup-db.bat`
  - **Harusnya:** file cadangan muncul di folder `backups/`
  - **Catatan saya:**

- [ ] **11.8** Jadwalkan otomatis tiap hari (Task Scheduler), cek besok ada file baru
  - **Catatan saya:**

---

# 12. Belum Dibangun: Perlu atau Tidak? 🚧

> Semua di bawah **memang belum ada**. Bukan bug. Tulis `PERLU` / `TIDAK PERLU` /
> `NANTI SAJA` — **ini yang menentukan apa yang saya kerjakan setelah R3.**

| Hal | Perlu? | Kalau perlu, untuk apa? |
|---|---|---|
| Retur / tukar barang (pelanggan) | | |
| Retur ke supplier (barang rusak dikirim balik) | | |
| Catat pengeluaran toko (listrik, gaji, sewa) | | |
| Ekspor laporan ke Excel/PDF | | |
| Garansi (kartu garansi, klaim) | | |
| Foto unit sebelum/sesudah | | |
| Portal pelanggan (cek status sendiri) | | |
| Notifikasi WhatsApp otomatis | | |
| Komisi / gaji teknisi | | |
| Data terpisah per cabang | | |
| Layar untuk mengatur izin per peran | | |
| Atur ulang tata letak Beranda | | |
| Tata letak nota bebas (geser posisi) | | |
| Hasil QC tercetak di nota | | |
| Pencarian toleran salah ketik | | |
| Alamat & logo toko di nota | | |
| Jadwal / kalender teknisi | | |

---

# 13. Catatan Bebas Anda

**Hal yang jalan, tapi alurnya tidak sesuai cara toko saya:**

```


```

**Langkah yang terasa bertele-tele / terlalu banyak klik:**

```


```

**Istilah di layar yang membingungkan (dan seharusnya berbunyi apa):**

```


```

**Hal yang ada di aplikasi tapi tidak pernah saya pakai (boleh dihapus?):**

```


```

**Urutan kerja sebenarnya di toko saya, kalau berbeda dari yang di aplikasi:**

```


```

**Yang paling sering bikin saya / staf saya kesal saat memakai aplikasi:**

```


```
