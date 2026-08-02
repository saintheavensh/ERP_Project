# Uji Manual — Fase R1.8: Perbaikan dari Uji R1.7

> **Siap diuji.** Ini menutup semua yang Anda tulis di
> [`uji-R1.7-perbaikan.md`](uji-R1.7-perbaikan.md), termasuk dua permintaan yang sempat
> saya tahan karena menabrak keputusan Anda sendiri — keduanya sudah Anda putuskan
> 2026-08-02. Rencananya [`R1.8-perbaikan-hasil-uji-R1.7.md`](R1.8-perbaikan-hasil-uji-R1.7.md).
>
> **Tiga catatan Anda ternyata bukan bug**, dan itu sudah saya periksa ke kode sebelum
> mengerjakan apa pun:
> - **B2** nomor antrian `-` → fiturnya selalu jalan; **seed**-nya yang tidak mengisi.
> - **C2** tombol Ambil Pekerjaan → tombolnya ada; **poin ujinya** yang usang.
> - **A1** rincian piutang → memang belum ada, dan sekarang sudah.
>
> **Yang tampak sepele di catatan Anda justru yang paling longgar:** poin D1. Sebuah
> tiket sah bisa berisi seluruh unitnya cuma kata "Smartphone", dan keluhan tak diperiksa
> di mana pun. Bagian A yang paling penting Anda pastikan.
>
> **Yang TIDAK ada di sini, dan itu bukan kelupaan:** form servis per langkah
> ("next-next-next"). Itu inti **R2**, bukan tambalan — dan R2 masih menunggu satu
> jawaban Anda di bagian paling bawah berkas ini.

## Cara mengisi

**Catatan saya:** isi bebas (`OK` / `GAGAL — ...` / `Jalan, TAPI harusnya begini...`).
Centang `[x]` = sudah dijalankan.

**Setelah selesai, isi "Kesimpulan"**, lalu bilang _"R1.8 sudah saya uji"_.

---

## Persiapan

- [ ] **0.1** `npm run db:reset` di `flowserv-api/`
      **Wajib kali ini**, bukan opsional: R1.8 menambah satu kolom baru
      (`intake_estimated_cost`) dan mengisi nomor antrian di data contoh. Tanpa reset,
      poin C dan F tidak akan berjalan.
  - **Catatan saya:**

- [ ] **0.2** Jalankan `start-flowserv.bat`
  - **Catatan saya:**

---

# A. Terima Unit tidak bisa lagi setengah kosong 🔴

> Poin uji R1.7 D1. Login sebagai **Kasir**, buka **Terima Unit**.

- [ ] **A1** Isi nama + pilih Jenis saja. **Kosongkan Merek, Model, Keluhan** → Simpan
  - **Harusnya:** muncul pesan **kalimat** ("Merek unit wajib diisi…"), Anda **tetap di
    form**, dan **tidak ada** tiket yang terbuat
  - **Catatan saya:**

- [ ] **A2** Isi Merek + Model, tapi **Keluhan dikosongkan** → Simpan
  - **Harusnya:** ditolak, pesannya menyebut keluhan
  - **Catatan saya:**

- [ ] **A3** Isi Keluhan dengan **`-`** saja → Simpan
  - **Harusnya:** tetap ditolak ("minimal 3 huruf"). Ini menutup jalan pintas mengetik
    strip supaya form lolos — begitu sebuah kolom jadi wajib, itu yang selalu terjadi
  - **Catatan saya:**

- [ ] **A4** Isi semuanya: Merek **Advan**, Model **G30** (sengaja yang tidak ada di
      katalog), keluhan wajar → Simpan
  - **Harusnya:** **berhasil.** Ini yang membuktikan aturan barunya **tidak** menutup
    jalan yang Anda minta tetap terbuka: *"bisa di isi merknya Advan tipenya G30, bisa
    seperti itu jadi flexible"*
  - **Catatan saya:**

- [ ] **A5** Sandi/pola **dikosongkan** saat menyimpan
  - **Harusnya:** tetap boleh kosong — tidak semua unit terkunci, dan memaksa staf
    mengarang sandi lebih buruk daripada membiarkannya kosong
  - **Catatan saya:**

- [ ] **A6** Buka pelanggan lama → tombol **"Servis Unit Ini"** pada unit yang sudah
      terdaftar
  - **Harusnya:** Merek/Model **tidak** diminta ulang (unitnya sudah tercatat), tapi
    **keluhan tetap wajib**. Kalau di sini Anda dipaksa mengetik ulang merek, saya
    kebablasan
  - **Catatan saya:**

---

# B. Kasir bisa melihat isi tagihan piutang

> Poin uji R1.7 A1 — Anda bertanya sekaligus menjawab sendiri.

- [ ] **B1** Login **Kasir** → Beranda → kartu **Piutang (AR)** → di daftar, tekan
      **"Rincian"**
  - **Harusnya:** muncul isi tagihannya — item yang dibeli, sudah dibayar berapa, sisa
    berapa, plus riwayat pembayaran kalau ada
  - **Catatan saya:**

- [ ] **B2** Perhatikan tombol di dalam rincian itu
  - **Harusnya:** hanya **Tutup** dan **Bayar**. **Tidak ada** "Void" maupun "Ubah" —
    keduanya wewenang yang kasir tidak punya, dan menampilkan tombol yang pasti gagal
    saat ditekan adalah hal yang justru sedang kita berantas
  - **Catatan saya:**

- [ ] **B3** Masih sebagai Kasir → ketik `/finance`, lalu `/finance/ledger`, lalu
      `/finance/payables`
  - **Harusnya:** **ketiganya tetap ditolak.** Kalau salah satu terbuka, perbaikan B1
    kebablasan dan membuka lagi kebocoran yang R1.5 tutup
  - **Catatan saya:**

---

# C. Nomor antrian

- [ ] **C1** Buat satu unit lewat **Terima Unit**, lalu buka tiketnya
  - **Harusnya:** nomor antrian **muncul** (bukan `-`)
  - **Catatan saya:**

- [ ] **C2** Login **Teknisi** → Beranda → ketuk baris di "Menunggu Diambil"
  - **Harusnya:** popup rinciannya menampilkan **No. Antrian** berisi angka, termasuk
    untuk tiket contoh dari seed
  - **Catatan saya:**

---

# D. Katalog Device tahu ada unit yang belum terdaftar

> Permintaan Anda 2026-08-02: *"dapat pesan notifikasi pada device katalog bahwa ada unit
> service yang masih belum ada katalognya"*.

- [ ] **D1** Login **Admin/Manager** → sidebar **"Lainnya"** (tertutup default, klik dulu)
      → **Katalog Device**. Atau langsung ketik `/devices`
  - **Harusnya:** ada panel kuning **"Belum ada di katalog"**, dan **Advan G30** dari
    poin A4 ada di dalamnya
  - **Catatan saya:**

- [ ] **D2** Terima satu unit lagi bermerek **Samsung** model **Galaxy A10** (yang sudah
      ada di katalog), lalu buka `/devices` lagi
  - **Harusnya:** unit itu **TIDAK** muncul di panel. Panel yang menyuruh Anda menambahkan
    sesuatu yang sudah ada akan lebih buruk daripada tidak ada panel sama sekali
  - **Catatan saya:**

- [ ] **D3** Terima unit bermerek asing yang **sama** dua kali
  - **Harusnya:** ia tetap satu baris, dengan angka **`2× masuk`**. Yang sering masuk
    naik ke atas — itu yang paling layak Anda tambahkan ke katalog
  - **Catatan saya:**

> **Sengaja bukan lonceng atau popup.** Ini pekerjaan admin yang bisa ditunda, bukan
> kabar mendesak. Mengganggu kasir yang sedang melayani antrean dengan ini justru bikin
> orang berhenti mengisi merek dengan jujur — dan itu merusak bagian A sekaligus.

---

# E. Kasir bisa menunjuk teknisi (opsional)

> Permintaan Anda di D1, pilihan Anda: **opsional**.

- [ ] **E1** Terima unit, **kosongkan** pilihan Teknisi ("Biarkan masuk antrian")
  - **Harusnya:** tiket masuk ke **"Menunggu Diambil"** di beranda teknisi, seperti
    sebelumnya
  - **Catatan saya:**

- [ ] **E2** Terima unit lagi, kali ini **pilih Teknisi Andi**
  - **Harusnya:** tiket **langsung bertuan** — muncul di "Sedang Saya Kerjakan" milik
    Andi, dan **tidak** muncul di antrian siapa pun
  - **Catatan saya:**

- [ ] **E3** Login **Teknisi Rina**, buka tiket yang tadi ditugaskan ke Andi
  - **Harusnya:** Rina **tidak** melihat pemilih teknisi (aturan R1.7 masih berlaku)
  - **Catatan saya:**

- [ ] **E4** Login **Kasir**, buka halaman detail tiket mana pun yang **sudah berjalan**
  - **Harusnya:** kasir **tidak** bisa memindahkan tiket itu ke teknisi lain. Menunjuk
    **saat membuat** tiket bukan hal yang sama dengan **mencabut** pekerjaan teknisi yang
    sedang berjalan — yang kedua tetap wewenang manajer.
    **Kalau Anda ingin kasir bisa memindahkan juga, tulis di sini** — itu keputusan
    terpisah yang tidak saya ambil diam-diam
  - **Catatan saya:**

---

# F. Perkiraan biaya di konter

> Permintaan Anda di D1, pilihan Anda: **perkiraan biaya**, bukan biaya sungguhan.

- [ ] **F1** Terima unit, isi **Perkiraan Biaya** `450000`
  - **Harusnya:** tersimpan; buka tiketnya → ada baris **"Perkiraan Biaya (Konter)"**
    berisi Rp450.000
  - **Catatan saya:**

- [ ] **F2** Login **Teknisi**, buka tiket itu
  - **Harusnya:** teknisi **melihat** angka itu — dia perlu tahu apa yang sudah terlanjur
    dijanjikan ke pelanggan sebelum menyebut angkanya sendiri
  - **Catatan saya:**

- [ ] **F3** Di tiket yang masih di tahap **Intake**, coba tambahkan **biaya/sparepart**
  - **Harusnya:** **tetap ditolak.** Perkiraan biaya bukan tagihan; aturan "belum boleh
    mencatat biaya sebelum unit diperiksa" yang Anda setujui dulu **tidak** ikut dicabut.
    Kalau di sini biaya bisa masuk, saya sudah membongkar gerbang yang justru dipasang
    supaya tiket tak punya tagihan sebelum ada yang melihat unitnya
  - **Catatan saya:**

- [ ] **F4** Terima unit **tanpa** mengisi perkiraan biaya
  - **Harusnya:** tak ada baris perkiraan sama sekali di tiketnya — bukan "Rp0"
  - **Catatan saya:**

- [ ] **F5** *(butuh printer — boleh dilewati)* Cetak **Tanda Terima** untuk tiket yang
      punya perkiraan biaya
  - **Harusnya:** tercetak "Perkiraan biaya: Rp 450.000" **beserta** keterangan "(belum
    final, menunggu pemeriksaan)". Pelanggan memegang kertas itu; angka tanpa keterangan
    akan dibaca sebagai harga pasti
  - **Catatan saya:**

---

# G. Regresi — yang lama jangan sampai rusak

- [ ] **G1** Alur satu tiket dari Terima Unit sampai Selesai masih bisa ditempuh
  - **Catatan saya:**

- [ ] **G2** Satu penjualan tunai di menu Kasir sampai selesai
  - **Catatan saya:**

- [ ] **G3** Beranda tiap peran masih benar (Super Admin, Manager, Kasir, Teknisi)
  - **Catatan saya:**

- [ ] **G4** Teknisi mengambil pekerjaan dari popup antrian di beranda (inti R1.7)
  - **Catatan saya:**

- [ ] **G5** Pesan validasi masih kalimat, bukan JSON (Terima Unit → sandi/pola 3 titik)
  - **Catatan saya:**

---

# Kesimpulan

**Apakah R1.8 sudah benar?**

- [ ] Ya, lanjut ke R2
- [ ] Ada yang harus diperbaiki dulu — daftarnya:

```


```

---

## ⛔ R2 masih terkunci tanpa ini — dan sekarang tinggal dicentang

Pertanyaan ini sudah saya ajukan **tiga kali** sebagai tabel kosong dan belum pernah
terjawab. Menurut saya itu **salah cara saya bertanya**, bukan kelalaian Anda: tabel kosong
menuntut Anda merancang aturan dari nol, sementara Anda menjawabnya dengan mudah begitu
pertanyaannya konkret dan sedang dipakai — catatan D1 Anda ("keluhan wajib, unit wajib")
sebenarnya **jawaban baris pertama tabel ini**, ditulis sambil menguji.

Jadi bentuknya saya balik: **saya yang mengusulkan, Anda tinggal menyetujui atau
mencoret.** Usulannya diturunkan dari kalimat Anda sendiri, bukan selera saya.

| Tahap | Usul saya: wajib terisi sebelum tombol lanjut boleh ditekan | Setuju? |
|---|---|---|
| **Terima Unit** (kasir) | nama, no. HP, jenis+merek+model, **keluhan**. Sandi/pola **tidak** wajib | ☐ setuju / koreksi: |
| **Diagnosa** (teknisi) | hasil diagnosa + perkiraan biaya. Lama pengerjaan **tidak** wajib | ☐ setuju / koreksi: |
| **Pengerjaan** (teknisi) | **tidak ada yang wajib** — menahan teknisi di sini menghalangi kerja, bukan menjaga mutu | ☐ setuju / koreksi: |
| **QC** | **semua** baris checklist tercentang. Kalau sebagian boleh, kalimat "QC lulus" tak berarti apa-apa | ☐ setuju / koreksi: |
| **Selesai / Serah Terima** (kasir) | nota sudah dibuat. **Boleh ada sisa** (pelanggan tempo) | ☐ setuju / koreksi: |

**Tulis koreksi Anda di sini (kalimat biasa saja):**

```


```

**Kenapa saya tidak menebaknya saja:** menegakkan tebakan lalu mencabutnya adalah
kesalahan yang S5 sudah pernah buat — gerbang penagihan dipasang berdasarkan tebakan
backfill, lalu harus dibongkar setelah 2 tes menabraknya dan ternyata tes-nya yang benar.

---

## Yang masih menunggu, bukan dilupakan

| Hal | Kenapa belum |
|---|---|
| Form servis **per langkah** (next-next-next) | Inti **R2**, menunggu tabel di atas |
| Alur "setelah diagnosis kembali ke kasir" | R2 |
| Tombol "minta pindah teknisi" | R2 |
| Laporan bulanan teknisi (unit berhasil/gagal/garansi/sisa) | R2 |
| Teknisi tidak melihat harga modal | R2 |
| Perbaikan UI/UX halaman Kasir | Anda sendiri menulis "nanti" (uji-R1.7 E2) |
| Katalog device pindah ke admin SaaS (dipakai semua tenant) | Perubahan kepemilikan data lintas tenant — Phase 11/12, bukan fase perbaikan. Panel D di atas adalah langkah pertamanya |
| Cetak fisik dengan printer sungguhan | Belum bisa diuji siapa pun tanpa hardware (sama statusnya dengan 6D.1) |
