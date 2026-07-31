# Uji Manual — Fase R1: Peran & Akses

> **Status: menunggu R1 dikerjakan.** Jangan jalankan sebelum saya bilang R1 selesai.
>
> **Fokusnya sempit dan disengaja:** hanya dua hal yang R1 perbaiki —
> **kasir bisa membuat tiket servis**, dan **teknisi bisa mengambil pekerjaan yang belum
> bertuan**. Ditambah beberapa poin regresi untuk memastikan yang lama tidak ikut rusak.
>
> Rencana teknisnya: [`tahap-b-peran-dan-qc.md`](tahap-b-peran-dan-qc.md) → Fase R1.

## Cara mengisi

- **Harusnya:** apa yang saya harapkan terjadi
- **Catatan saya:** ← isi bebas: `OK` / `GAGAL — pesan xxx` /
  `Jalan, TAPI harusnya begini...`

Centang `[x]` = sudah dijalankan (bukan berarti lulus).

**Setelah selesai, isi bagian "Kesimpulan" di paling bawah**, lalu bilang ke saya
_"R1 sudah saya uji"_. Saya baca dulu catatan Anda sebelum menyentuh R2.

---

## Persiapan

- [x] **0.1** `flowserv-api/.env` berisi `RBAC_MODE=enforce`
  - **Harusnya:** kalau `report`, semua gerbang izin mati dan **seluruh uji ini
    tidak berarti apa-apa**
  - **Catatan saya:**
    Berjalan dengan baik
- [x] **0.2** Jalankan `start-flowserv.bat`, 4 jendela hidup
  - **Catatan saya:**
    Sudah berjalan dengan baik

---

# A. Kasir membuat tiket servis

- [x] **A1** Login sebagai **Kasir**
  - **Harusnya:** menu kiri berisi Beranda, **Servis**, Kasir, Katalog Produk
  - **Catatan saya:**
    Sudah berjalan dengan baik dan saya melihat semua menunya
- [x] **A2** Klik menu **Servis**
  - **Harusnya:** daftar tiket terbuka, ada tombol untuk menerima unit baru
  - **Catatan saya:**
    sudah berjalan dan daftar tiket terbuka

- [x] **A3** Klik **Terima Unit**
  - **Harusnya:** form terbuka — **bukan** pesan "Anda tidak punya izin"
  - **Catatan saya:**
    bisa mengisi form yang ada

- [x] **A4** Isi pelanggan **baru** (nama + nomor HP)
  - **Harusnya:** pelanggan baru bisa dibuat langsung dari sini
  - **Catatan saya:**
    sudah bisa mengisi pelanggan baru mesikpun belum pernah terdaftar di tabel konsumen

- [x] **A5** Isi merk/model unit, keluhan, dan sandi/pola
  - **Catatan saya:**
    Berjalan dengan baik tapi tambahkan validasi untuk pin dan polanya minimal 4 huruf

- [x] **A6** Klik Simpan
  - **Harusnya:** tiket jadi, halaman pindah ke detail tiket
  - **Catatan saya:** nomor tiket = ******\_\_******
    bisa menyimpan ke database

- [/] **A7** Perhatikan tepat setelah simpan
  - **Harusnya:** **label + nomor antrian tercetak otomatis**
  - **Catatan saya:**
    ini belum saya coba karena saya masih belum mempunyai printer di mesin yang satunya jadikan ini notes

- [x] **A8** Kembali ke daftar Servis
  - **Harusnya:** tiket yang baru dibuat terlihat di daftar
  - **Catatan saya:**
    ya tiket service yang di buat muncul di tabel daftar servicenya
- [x] **A9** **Pertanyaan untuk Anda:** apakah tampilan daftar tiket ini sudah pas untuk
      kasir, atau kasir sebenarnya cuma butuh tombol "Terima Unit" saja?
  - **Catatan saya:**
    proses pembuatan tiket service berhasil
    tapi saya ingin setelah melihat membuat tiket baru cashier jangan langsung ke halaman detail buat saja toast notifikasi tiket baru berhasil di buat dan kasir seharusnya juga bisa lihat riwayat tiket yang di input oleh dirinya sendiri atau ada popup pilih teknisi yang bisa di lewati juga
    dan ada juga menu untuk nanti alur pengambilan ponsel tabel di halaman service juga untuk kasir jangan terlalu detail intinya saja progeresnya teknisinya atau kalau ada keterangan dari teknisinya munculkan sehingga nanti ketika di tanya konsumen bisa mencari datanya atau bila perlu konfirmasi ulang kasir bisa memprosesnya

---

# B. Teknisi mengambil pekerjaan

- [x] **B1** Login sebagai **Teknisi** → lihat Beranda
  - **Harusnya:** ada kartu berisi jumlah tiket **menunggu diambil**, bisa diklik
  - **Catatan saya:**
    sudah bisa login akun teknisi tetapi UXnya terlalu bertele tele susah untuk navigasinya atau telalu banyak step sebaiknya di buat lebih simpel saja ambil kerjaan atau dari dashboard unit yang menunggu antrian tinggal klik sekali dan langsung jadi pekerjaannya dan untuk teknisi sebaiknya tidak bisa membuat tiket service sendiri tiket service hanya bisa di lakukan oleh admin atau kasir

- [x] **B2** Buka menu **Pekerjaan Saya**
  - **Harusnya:** ada **dua bagian** — "Pekerjaan Saya" dan "Menunggu Diambil".
    Tiket dari A6 ada di bagian kedua
  - **Catatan saya:**
    fokus ke pekerjaannya saja di menu pekerjaan saya jadi lebih fokus pekerjaannya dan ada laporan untuk bulan ini misalnya berhasil kerjakan berapa unit yang komplain berapa unit dan yang gagal berapa unit yang sedang di kerjakan berapa unit dan lain sebagainya

- [x] **B3** Klik tiket di "Menunggu Diambil"
  - **Harusnya:** halaman detail tiket terbuka
  - **Catatan saya:**
    Terlalu banyak step tidak langsung klik ambil kerjaan sebaiknya lakukan seperti catatan saya di poin B1

- [x] **B4** Klik **Ambil Pekerjaan**
  - **Harusnya:** nama Anda langsung muncul sebagai teknisi tiket ini
  - **Catatan saya:**
    Sudah bisa ambil kerjaan berarti tersimpan di dalam database

- [x] **B5** Kembali ke daftar tiket
  - **Harusnya:** tiket **pindah** ke "Pekerjaan Saya" dan **hilang** dari
    "Menunggu Diambil" — **tanpa perlu refresh manual**
  - **Catatan saya:**
    Ya benar ketika kerjaan sudah di ambil langsung tidak ada lagi dan statusnya menjadi kerjaan saya

- [/] **B6** Login sebagai **teknisi kedua** (kalau ada)
  - **Harusnya:** tiket yang sudah diambil **tidak** muncul di "Menunggu Diambil" miliknya
  - **Catatan saya:**
    masih belum mempunyai teknisi kedua

- [x] **B7** Buat tiket kedua sebagai Kasir, lalu cek Beranda teknisi lagi
  - **Harusnya:** angka di kartu "menunggu diambil" bertambah
  - **Catatan saya:**
    ya sudah benar alurnya

- [x] **B8** **Pertanyaan untuk Anda:** apakah teknisi boleh mengambil tiket di tahap
      **mana pun**, atau hanya yang sudah lewat Intake?
  - **Catatan saya:**
    untuk kerjaan teknisi sebenarnya ada dua cara untuk assignya pertama di pilih oleh kasir atau admin yang kedua mengambil tiket yang masih di masa antrian
    dan untuk teknisi setiap step harus ada data yang di isinya jadi di bagian kanban tidak bisa asal drag dan kemudian statusnya berubah harus ada field reqomended yang harus di isi
    dan teknisi seharusnya jangan ada menu untuk pilih teknisi di halaman detailnya jika ingin menyerahkan pekerjaannya sebaiknya ada tombol request pindah teknisi jika memang tknisi trsebut tidak sanggup mengerjakannya
    dan untuk total sebaiknya di buat bergabung saja untuk pertama kali jadi inputnya total + harga sparepart yang mana teknisi juga bisa melihat harga sparepart dari katalog yang ada jadi jangan satu satu nanti saja input seperti itu di saat sudah mulai pengerjaan di awal diagnosa jangan terlalu banyak input yang tidak perlu cukup simpel saja agar saat toko penuh pengunjung aplikasi tidak ketetran harus isi ini itu

---

# C. Regresi — pastikan yang lama tidak rusak

> Poin-poin ini **sudah jalan sebelum R1**. Kalau ada yang rusak sekarang, berarti R1
> merusak sesuatu.

- [x] **C1** Login **Super Admin** → buka tiket → semua bagian masih tampil seperti biasa
  - **Harusnya:** **tidak ada perubahan apa pun** untuk Super Admin di fase R1
  - **Catatan saya:**
    Ya masih Aman dan berjalan dengan baik

- [x] **C2** Login **Manager** → daftar tiket
  - **Harusnya:** melihat **semua** tiket, bukan dua kelompok seperti teknisi
  - **Catatan saya:**
    Ya data masih aman dan tidak ada yang hilang

- [/] **C3** Beranda untuk tiap peran (Super Admin, Manager, Teknisi, Kasir)
  - **Harusnya:** semua kartu lama masih tampil dan angkanya masih benar
  - **Catatan saya:**
    ya sudah benar tiap peran mempunyai menu yang fokus untuk perannya masing masing tetapi masih perlu di perbaiki UInya agar lebih fokus pada kerjaannya masing masing

- [x] **C4** Buka papan **Kanban** tiket
  - **Harusnya:** masih jalan seperti biasa
  - **Catatan saya:**
    Ya masih berjalan seperti seharusnya

- [/] **C5** Kasir → menu Kasir → lakukan satu penjualan tunai sampai selesai
  - **Harusnya:** masih jalan, struk masih tercetak otomatis
  - **Catatan saya:**
    printer masih belum ada di mesin ini jadi masih belum di coba bagian printingnya untuk penjualan sampai selesai overall bagus

- [/] **C6** Kasir mencoba memberi **diskon**
  - **Harusnya:** kolom diskon **masih tidak terlihat** untuk kasir
  - **Catatan saya:**
    Ya masih belum ada kolom diskon di bagian kasir

- [x] **C7** Kasir ketik alamat `/settings` langsung di browser
  - **Harusnya:** **masih ditolak** — R1 hanya menambah izin buat tiket, tidak lebih
  - **Catatan saya:**
    anehnya kasir bisa akses halaman itu tidak hanya kasir teknisi juga bisa akses

- [x] **C8** Kasir ketik alamat `/finance` langsung
  - **Harusnya:** masih ditolak
  - **Catatan saya:**
    ini sama seperti kasusnya halaman settings di poin C7

- [x] **C9** Jalankan alur servis satu tiket sampai **Selesai** (boleh sebagai Super Admin)
  - **Harusnya:** masih utuh — diagnosa, sparepart, kuotasi, nota, tutup tiket
  - **Catatan saya:**
    Sudah berhasil dari awal sampai akhir tetapi ada bebrapa catatan yang saya sudah tuangkan di poin A dan B

- [/] **C10** Buka rekonsiliasi stok (`/v1/inventory/reconciliation`)
  - **Harusnya:** daftar selisih **kosong**
  - **Catatan saya:**
    ini belum coba saya lakukan

---

# D. Di HP

- [/] **D1** Login Kasir dari HP → buat tiket dari awal sampai simpan
  - **Harusnya:** halaman tidak geser ke samping, tombol cukup besar
  - **Catatan saya:**
    ini juga belum saya coba karena saat ini saya tidak berada di dalam wifi yang sama dengan HP saya

- [/] **D2** Login Teknisi dari HP → lihat dua kelompok daftar → ambil pekerjaan
  - **Catatan saya:**
    ini juga saya belum coba sama alasannya seperti poin D1

---

# Kesimpulan (isi setelah semua di atas dijalankan)

**Apakah R1 sudah benar?**

- [ ] Ya, lanjut ke R2
- [x] Ada yang harus diperbaiki dulu — daftarnya:

```
Sudah saya jlaskan di masing masing poin

```

**Yang jalan, tapi alurnya tidak sesuai cara toko saya:**

```


```

**Jawaban untuk dua pertanyaan di atas (A9 & B8), supaya R2 tidak salah arah:**

- A9 — kasir butuh daftar tiket penuh atau cuma tombol Terima Unit?

```
Tombol terima unit

```

- B8 — teknisi boleh ambil tiket di tahap mana saja?

```
Di saat menunggu antrian saat kasir sudah input tiket service

```

**Tambahan: untuk R2 nanti, siapa yang menagih & menerima uang di toko Anda — kasir saja,
atau teknisi juga bisa? Dan apakah teknisi boleh melihat harga modal sparepart?**

```
Kasir saja, teknisi hanya bisa melihat harga jual yang di input oleh manager

```
