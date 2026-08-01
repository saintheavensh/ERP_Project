# Uji Manual — Fase R1.5: Perbaikan dari Uji R1

> **Siap diuji.** Ini menutup 4 hal yang Anda temukan di
> [`uji-R1-peran-akses.md`](uji-R1-peran-akses.md).
>
> **Satu di antaranya lebih serius dari yang Anda kira** — poin C7/C8 Anda
> ("kasir bisa akses halaman itu") ternyata bukan cuma halaman kosong yang terbuka:
> kasir **dan** teknisi sama-sama bisa membaca **omzet, modal, dan laba toko** lewat API.
> Sekarang ditutup. Bagian A di bawah yang paling penting Anda pastikan.
>
> Rencana teknisnya: [`R1.5-perbaikan-hasil-uji-R1.md`](R1.5-perbaikan-hasil-uji-R1.md).

## Cara mengisi

Sama seperti sebelumnya — **Catatan saya:** isi bebas (`OK` / `GAGAL — ...` /
`Jalan, TAPI harusnya begini...`). Centang `[x]` = sudah dijalankan.

**Setelah selesai, isi "Kesimpulan" di bawah**, lalu bilang _"R1.5 sudah saya uji"_.

---

## Persiapan

- [/] **0.1** `flowserv-api/.env` berisi `RBAC_MODE=enforce`
  - **Harusnya:** kalau `report`, semua gerbang izin mati dan bagian A tidak berarti apa-apa
  - **Catatan saya:**
  saya bingung cara testnya mebedakannya bagaimana

- [X] **0.2** Jalankan `npm run db:reset` di `flowserv-api/` **sebelum** menguji
  - **Kenapa wajib:** izin teknisi berubah, dan seed tidak menimpa data lama
  - **Catatan saya:**
  Sudah di jalankan dan berhasil
- [X] **0.3** Jalankan `start-flowserv.bat`
  - **Catatan saya:**
  Bekerja dengan baik semua server langsung berjalan
---

# A. Uang toko tidak lagi bocor 🔴 (paling penting)

- [X] **A1** Login **Kasir** → ketik `/finance` langsung di alamat browser
  - **Harusnya:** dipentalkan ke Beranda + kotak kuning "Halaman itu bukan untuk peran Anda"
  - **Catatan saya:**
  sudah benar ada warning halaman bukan peran anda

- [X] **A2** Login **Kasir** → ketik `/settings`, lalu `/flows`
  - **Harusnya:** keduanya juga dipentalkan
  - **Catatan saya:**
  sudah benar juga ada warningnya

- [X] **A3** Login **Teknisi** → ulangi A1 & A2
  - **Harusnya:** sama, dipentalkan semua
  - **Catatan saya:**
  sama di pentalkan semua tapi apakah tidak apa apa di url jadi seperti ini /?ditolak=%2Fflows

- [X] **A4** Login **Manager** → buka `/finance`
  - **Harusnya:** **BISA** — manajer memang boleh melihat laporan. Kalau manajer ikut
    ditolak, perbaikannya kebablasan
  - **Catatan saya:**
    ya bisa di akses oleh akun manager

- [X] **A5** Login **Super Admin** → buka `/finance`, `/settings`, `/flows`
  - **Harusnya:** semuanya terbuka seperti biasa, tidak ada yang berubah
  - **Catatan saya:**
  super admin semuanya terbuka tidak ada akses yang di tolak

- [X] **A6** Login **Kasir** → lihat Beranda
  - **Harusnya:** kartu **piutang (AR)** masih ada dan angkanya masih benar. Ini sengaja
    dibiarkan: kasir yang menagih, jadi ia perlu tahu siapa yang berhutang. Kalau kartu ini
    jadi 0 atau hilang, berarti gerbangnya kesempitan
  - **Catatan saya:**
    sudah saya coba tetapi nilainya 0
---

# B. Teknisi tidak lagi membuat tiket

- [X] **B1** Login **Teknisi** → buka menu **Pekerjaan Saya**
  - **Harusnya:** tombol **"Terima Unit" sudah tidak ada**
  - **Catatan saya:**
  Ya sudah benar tidak bisa terima unit

- [X] **B2** Teknisi ketik `/tickets/intake` langsung di alamat
  - **Harusnya:** dipentalkan ke Beranda
  - **Catatan saya:**
  ya sesuai langsung terpental ke halaman dashoard

- [X] **B3** Teknisi → ambil satu pekerjaan dari "Menunggu Diambil"
  - **Harusnya:** **MASIH BISA.** Ini yang paling saya jaga — izin yang dicabut hanya
    "membuat tiket", bukan "mengambil pekerjaan". Kalau ini rusak, R1 ikut rusak
  - **Catatan saya:**
  Ya masih bisa tetapi alurnya masih terlalu banyak harus ke halaman pekerjaan saya kemudian lihat detail terus ambil pekerjaan menurut saya kurang simpel
- [X] **B4** Login **Kasir** → buat tiket
  - **Harusnya:** masih bisa seperti biasa
  - **Catatan saya:**
  ya benar masih bisa buat tiket service
---

# C. Sandi/pola minimal 4

- [X] **C1** Kasir → Terima Unit → isi sandi **"12"** (dua angka)
  - **Harusnya:** muncul peringatan **sambil mengetik**, sebelum menekan simpan
  - **Catatan saya:**
  ya banar tapi error masih berupa array object

- [X] **C2** Ganti jadi **"1234"**
  - **Harusnya:** peringatan hilang, bisa disimpan
  - **Catatan saya:**
  sudah berhasil di simpan

- [X] **C3** Pindah ke mode **Pola**, gambar pola **3 titik** saja
  - **Harusnya:** ditolak — minimal 4 titik
  - **Catatan saya:**
  ya benar tapi error yang di dapatkan masih berupa array object [ { "code": "custom", "message": "Pola minimal 4 titik.", "path": [ "devicePasscode" ] } ]

- [X] **C4** Gambar pola **4 titik atau lebih**
  - **Harusnya:** diterima
  - **Catatan saya:**
    Berhasil masuk dan di simpan di database

- [X] **C5** Terima unit **tanpa mengisi sandi sama sekali**
  - **Harusnya:** tetap boleh — tidak semua unit terkunci
  - **Catatan saya:**
  Ya bisa di lakukan tanpa isi pola atau sandi

- [X] **C6** Buka tiket lama → **Ubah** sandi → kosongkan
  - **Harusnya:** boleh dikosongkan (dipakai saat unit diserahkan kembali)
  - **Catatan saya:**
  Ya bisa di kosongkan maupun di edit

---

# D. Kasir tidak dilempar ke halaman detail

- [X] **D1** Kasir → Terima Unit → isi lengkap → **Simpan**
  - **Harusnya:** **tetap di form**, muncul kotak hijau "Tiket _nomor_ berhasil dibuat"
  - **Catatan saya:** nomor tiket yang muncul = ******\_\_******
    ya benar muncul toast seprti ini
    Tiket 8654f67d berhasil dibuat
Form sudah dikosongkan — langsung lanjut ke unit berikutnya.
Label belum tercetak. Belum ada printer diatur untuk cabang ini — atur di Setelan → Printer.

- [X] **D2** Perhatikan formnya setelah simpan
  - **Harusnya:** sudah kosong, siap pelanggan berikutnya
  - **Catatan saya:**
  ya benar langsung kosong dan siap pelanggan selanjutnya

- [X] **D3** Terima **3 unit berturut-turut** tanpa menekan "kembali"
  - **Harusnya:** lancar, tidak perlu bolak-balik halaman. **Ini tujuan utamanya** —
    tolong nilai apakah kecepatannya sudah seperti yang Anda bayangkan
  - **Catatan saya:**
  Ya benar seperti ini yang harus di coba berarti sekarang printernya 

- [X] **D4** Tekan tautan **"Lihat tiket"** di kotak hijau
  - **Harusnya:** membuka tiket yang barusan dibuat
  - **Catatan saya:**
  Ya benar bisa lihat detail tiket service ketika klik lihat tiket 

- [/] **D5** ⚠️ **Saat printer sudah terpasang** — cetak label otomatis
  - **Harusnya:** label + nomor antrian **tetap tercetak sendiri** setelah simpan,
    meski kasir tidak berpindah halaman. Pemicunya saya pindahkan ke form intake;
    ini **belum bisa saya uji dengan printer fisik**, jadi tolong periksa poin ini
    lebih teliti begitu printer ada
  - **Catatan saya:**
    belum saya coba nanti saja sekalian setting printernya
---

# E. Regresi — yang lama jangan sampai rusak

- [X] **E1** Alur servis satu tiket dari terima unit sampai **Selesai**
  - **Catatan saya:**
  Ya sudah bisa dari awal sampai akhir tetapi harus di perjelas juga step stepnya jadi step ini harus isi from mana sebaiknya jangan di perlihatkan semuanya dan sebaiknya ada step stepnya jadi jangan di simpan di halaman detail semuanya masalahnya teknisi jadi bingung harus mengisi yang mana sebaiknya per step saja nanti tinggal lanjtkantahap berikutnya sampai selesai

- [X] **E2** Satu penjualan tunai di menu Kasir sampai selesai
  - **Catatan saya:**
  sudah benar cuma nanti saya perlu revisi lagi

- [X] **E3** Papan **Kanban** masih jalan
  - **Catatan saya:**
Masih jalan tetapi ketika pindah status datanya masih bisa kosong itu yang bermasalah jadi datanya tidak lengkap 
- [X] **E4** Beranda tiap peran masih menampilkan kartu yang benar
  - **Catatan saya:**
  Ya menampilkan kartu yang benar tiap tiap role

- [X] **E5** Yang belum sempat Anda uji di R1 — kalau sempat sekarang:
      buat **teknisi kedua** lewat Setelan → Pengguna & Peran, lalu pastikan tiket yang
      sudah diambil teknisi A tidak muncul di antrian teknisi B (poin B6 uji R1)
  - **Catatan saya:**
  buatlah seednya jadi teknisinya ada dua sehingga saya tidak perlu tambah tambah lagi di bagian settings

- [/] **E6** Rekonsiliasi stok (`/v1/inventory/reconciliation`) — daftar selisih kosong
      (poin C10 uji R1, belum sempat)
  - **Catatan saya:**
    saya bingung untuk coba ceknya harus seperti apa
---

# Kesimpulan

**Apakah R1.5 sudah benar?**

- [ ] Ya, lanjut ke R2
- [/ ] Ada yang harus diperbaiki dulu — daftarnya:

```
Sepertinya masih ada yang perlu di perbaiki

```

**Pertanyaan untuk R2 (halaman tiket per peran), supaya tidak salah arah:**

Dari catatan R1 Anda, R2 sudah punya arah ini — mohon dikoreksi kalau meleset:

1. **Kasir** melihat: progres tiket, siapa teknisinya, dan catatan dari teknisi
   (untuk menjawab pelanggan yang bertanya) + riwayat tiket yang ia buat sendiri.
   **Tidak** melihat form diagnosa.
2. **Teknisi** melihat: pekerjaannya saja + laporan bulanan (selesai / komplain / gagal /
   sedang dikerjakan). **Tidak** ada dropdown "pilih teknisi lain" — diganti tombol
   **"minta pindah teknisi"**. **Tidak** melihat harga modal, hanya harga jual.
3. Penugasan teknisi lewat **dua jalan**: dipilih kasir/admin, atau diambil sendiri dari antrian.

- Ada yang salah dari tiga poin di atas?

```
masih ada alur yang kurang lengkap jadi setelah diagnosis tiket kembali di berikan kepada kasir yang nantinya bisa memilih alurnya dan pemberian nota service juga dari kasir sehingga nota yang keluar ke pelanggan bukan dari teknisi melainkan dari kasir

```

- Untuk "minta pindah teknisi": setelah teknisi menekannya, **siapa yang memutuskan** —
  manajer, atau teknisi lain boleh langsung mengambilnya?
  bisa di assign oleh manager bisa di ambil oleh teknisi lain 

```


```

- Laporan bulanan teknisi: angka apa saja yang benar-benar Anda pakai menilai? (biar tidak
  membuat kartu yang tak pernah dilihat)

```
unit berhasil unit gagal unit garansi sisa pekerjaan

```
