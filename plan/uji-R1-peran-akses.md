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
*"R1 sudah saya uji"*. Saya baca dulu catatan Anda sebelum menyentuh R2.

---

## Persiapan

- [ ] **0.1** `flowserv-api/.env` berisi `RBAC_MODE=enforce`
  - **Harusnya:** kalau `report`, semua gerbang izin mati dan **seluruh uji ini
    tidak berarti apa-apa**
  - **Catatan saya:**

- [ ] **0.2** Jalankan `start-flowserv.bat`, 4 jendela hidup
  - **Catatan saya:**

---

# A. Kasir membuat tiket servis

- [ ] **A1** Login sebagai **Kasir**
  - **Harusnya:** menu kiri berisi Beranda, **Servis**, Kasir, Katalog Produk
  - **Catatan saya:**

- [ ] **A2** Klik menu **Servis**
  - **Harusnya:** daftar tiket terbuka, ada tombol untuk menerima unit baru
  - **Catatan saya:**

- [ ] **A3** Klik **Terima Unit**
  - **Harusnya:** form terbuka — **bukan** pesan "Anda tidak punya izin"
  - **Catatan saya:**

- [ ] **A4** Isi pelanggan **baru** (nama + nomor HP)
  - **Harusnya:** pelanggan baru bisa dibuat langsung dari sini
  - **Catatan saya:**

- [ ] **A5** Isi merk/model unit, keluhan, dan sandi/pola
  - **Catatan saya:**

- [ ] **A6** Klik Simpan
  - **Harusnya:** tiket jadi, halaman pindah ke detail tiket
  - **Catatan saya:** nomor tiket = ______________

- [ ] **A7** Perhatikan tepat setelah simpan
  - **Harusnya:** **label + nomor antrian tercetak otomatis**
  - **Catatan saya:**

- [ ] **A8** Kembali ke daftar Servis
  - **Harusnya:** tiket yang baru dibuat terlihat di daftar
  - **Catatan saya:**

- [ ] **A9** **Pertanyaan untuk Anda:** apakah tampilan daftar tiket ini sudah pas untuk
      kasir, atau kasir sebenarnya cuma butuh tombol "Terima Unit" saja?
  - **Catatan saya:**

---

# B. Teknisi mengambil pekerjaan

- [ ] **B1** Login sebagai **Teknisi** → lihat Beranda
  - **Harusnya:** ada kartu berisi jumlah tiket **menunggu diambil**, bisa diklik
  - **Catatan saya:**

- [ ] **B2** Buka menu **Pekerjaan Saya**
  - **Harusnya:** ada **dua bagian** — "Pekerjaan Saya" dan "Menunggu Diambil".
    Tiket dari A6 ada di bagian kedua
  - **Catatan saya:**

- [ ] **B3** Klik tiket di "Menunggu Diambil"
  - **Harusnya:** halaman detail tiket terbuka
  - **Catatan saya:**

- [ ] **B4** Klik **Ambil Pekerjaan**
  - **Harusnya:** nama Anda langsung muncul sebagai teknisi tiket ini
  - **Catatan saya:**

- [ ] **B5** Kembali ke daftar tiket
  - **Harusnya:** tiket **pindah** ke "Pekerjaan Saya" dan **hilang** dari
    "Menunggu Diambil" — **tanpa perlu refresh manual**
  - **Catatan saya:**

- [ ] **B6** Login sebagai **teknisi kedua** (kalau ada)
  - **Harusnya:** tiket yang sudah diambil **tidak** muncul di "Menunggu Diambil" miliknya
  - **Catatan saya:**

- [ ] **B7** Buat tiket kedua sebagai Kasir, lalu cek Beranda teknisi lagi
  - **Harusnya:** angka di kartu "menunggu diambil" bertambah
  - **Catatan saya:**

- [ ] **B8** **Pertanyaan untuk Anda:** apakah teknisi boleh mengambil tiket di tahap
      **mana pun**, atau hanya yang sudah lewat Intake?
  - **Catatan saya:**

---

# C. Regresi — pastikan yang lama tidak rusak

> Poin-poin ini **sudah jalan sebelum R1**. Kalau ada yang rusak sekarang, berarti R1
> merusak sesuatu.

- [ ] **C1** Login **Super Admin** → buka tiket → semua bagian masih tampil seperti biasa
  - **Harusnya:** **tidak ada perubahan apa pun** untuk Super Admin di fase R1
  - **Catatan saya:**

- [ ] **C2** Login **Manager** → daftar tiket
  - **Harusnya:** melihat **semua** tiket, bukan dua kelompok seperti teknisi
  - **Catatan saya:**

- [ ] **C3** Beranda untuk tiap peran (Super Admin, Manager, Teknisi, Kasir)
  - **Harusnya:** semua kartu lama masih tampil dan angkanya masih benar
  - **Catatan saya:**

- [ ] **C4** Buka papan **Kanban** tiket
  - **Harusnya:** masih jalan seperti biasa
  - **Catatan saya:**

- [ ] **C5** Kasir → menu Kasir → lakukan satu penjualan tunai sampai selesai
  - **Harusnya:** masih jalan, struk masih tercetak otomatis
  - **Catatan saya:**

- [ ] **C6** Kasir mencoba memberi **diskon**
  - **Harusnya:** kolom diskon **masih tidak terlihat** untuk kasir
  - **Catatan saya:**

- [ ] **C7** Kasir ketik alamat `/settings` langsung di browser
  - **Harusnya:** **masih ditolak** — R1 hanya menambah izin buat tiket, tidak lebih
  - **Catatan saya:**

- [ ] **C8** Kasir ketik alamat `/finance` langsung
  - **Harusnya:** masih ditolak
  - **Catatan saya:**

- [ ] **C9** Jalankan alur servis satu tiket sampai **Selesai** (boleh sebagai Super Admin)
  - **Harusnya:** masih utuh — diagnosa, sparepart, kuotasi, nota, tutup tiket
  - **Catatan saya:**

- [ ] **C10** Buka rekonsiliasi stok (`/v1/inventory/reconciliation`)
  - **Harusnya:** daftar selisih **kosong**
  - **Catatan saya:**

---

# D. Di HP

- [ ] **D1** Login Kasir dari HP → buat tiket dari awal sampai simpan
  - **Harusnya:** halaman tidak geser ke samping, tombol cukup besar
  - **Catatan saya:**

- [ ] **D2** Login Teknisi dari HP → lihat dua kelompok daftar → ambil pekerjaan
  - **Catatan saya:**

---

# Kesimpulan (isi setelah semua di atas dijalankan)

**Apakah R1 sudah benar?**

- [ ] Ya, lanjut ke R2
- [ ] Ada yang harus diperbaiki dulu — daftarnya:

```


```

**Yang jalan, tapi alurnya tidak sesuai cara toko saya:**

```


```

**Jawaban untuk dua pertanyaan di atas (A9 & B8), supaya R2 tidak salah arah:**

- A9 — kasir butuh daftar tiket penuh atau cuma tombol Terima Unit?

```


```

- B8 — teknisi boleh ambil tiket di tahap mana saja?

```


```

**Tambahan: untuk R2 nanti, siapa yang menagih & menerima uang di toko Anda — kasir saja,
atau teknisi juga bisa? Dan apakah teknisi boleh melihat harga modal sparepart?**

```


```
