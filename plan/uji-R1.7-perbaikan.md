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
> **Yang TIDAK ada di sini, dan itu bukan kelupaan:** _"halaman detail service
> membingungkan cara inputnya"_ — itu inti **R2** (form per tahap), bukan tambalan.

## Cara mengisi

**Catatan saya:** isi bebas (`OK` / `GAGAL — ...` / `Jalan, TAPI harusnya begini...`).
Centang `[x]` = sudah dijalankan.

**Setelah selesai, isi "Kesimpulan" di bawah**, lalu bilang _"R1.7 sudah saya uji"_.

---

## Persiapan

- [x] **0.1** `npm run db:reset` di `flowserv-api/`
  - **Catatan saya:**
    sudah di jalankan dan ini hasilnya
    PS C:\Users\riyan\OneDrive\Documents\VsCode\completed\Universal-Service-ERP-Specification\flowserv-api> npm run db:reset

> flowserv-api@1.0.0 db:reset
> tsx src/db/reset.ts && npm run db:push && npm run db:seed && npm run import:devices

◇ injected env (5) from .env // tip: ◈ secrets for agents [www.dotenvx.com]
◇ injected env (0) from .env // tip: ⌘ suppress logs { quiet: true }
🗑️ Dropping schema...
{
severity_local: 'NOTICE',
severity: 'NOTICE',
code: '00000',
message: 'drop cascades to 55 other objects',
detail: 'drop cascades to type charge_status\n' +
'drop cascades to type invoice_status\n' +
'drop cascades to type line_source\n' +
'drop cascades to type movement_type\n' +
'drop cascades to type payment_method\n' +
'drop cascades to type payment_status\n' +
'drop cascades to type po_status\n' +
'drop cascades to type supplier_payment_method\n' +
'drop cascades to type ticket_status\n' +
'drop cascades to table branches\n' +
'drop cascades to table permissions\n' +
'drop cascades to table role_permissions\n' +
'drop cascades to table roles\n' +
'drop cascades to table tenants\n' +
'drop cascades to table user_role_assignments\n' +
'drop cascades to table users\n' +
'drop cascades to table flow_nodes\n' +
'drop cascades to table flow_templates\n' +
'drop cascades to table flow_transitions\n' +
'drop cascades to table approval_requests\n' +
'drop cascades to table customer_assets\n' +
'drop cascades to table customers\n' +
'drop cascades to table service_tickets\n' +
'drop cascades to table ticket_checklist_results\n' +
'drop cascades to table ticket_stage_history\n' +
'drop cascades to table inventory_categories\n' +
'drop cascades to table inventory_items\n' +
'drop cascades to table item_brand_pricing\n' +
'drop cascades to table purchase_order_lines\n' +
'drop cascades to table purchase_orders\n' +
'drop cascades to table stock_batches\n' +
'drop cascades to table stock_levels\n' +
'drop cascades to table stock_movements\n' +
'drop cascades to table supplier_brands\n' +
'drop cascades to table supplier_invoices\n' +
'drop cascades to table supplier_payments\n' +
'drop cascades to table suppliers\n' +
'drop cascades to table device_brands\n' +
'drop cascades to table device_models\n' +
'drop cascades to table part_brands\n' +
'drop cascades to table product_compatibility\n' +
'drop cascades to table product_suppliers\n' +
'drop cascades to table ticket_charges\n' +
'drop cascades to table finance_ledger_entries\n' +
'drop cascades to table payment_methods\n' +
'drop cascades to table audit_logs\n' +
'drop cascades to table idempotency_keys\n' +
'drop cascades to table printer_assignments\n' +
'drop cascades to table printer_devices\n' +
'drop cascades to table printer_templates\n' +
'drop cascades to table customer_payments\n' +
'drop cascades to table invoice_sequences\n' +
'drop cascades to table pos_drafts\n' +
'drop cascades to table pos_invoice_lines\n' +
'drop cascades to table pos_invoices',
file: 'dependency.c',
line: '1171',
routine: 'reportDependentObjects'
}
✅ Schema dropped and recreated.

> flowserv-api@1.0.0 db:push
> drizzle-kit push

No config path provided, using default 'drizzle.config.ts'
Reading config file 'C:\Users\riyan\OneDrive\Documents\VsCode\completed\Universal-Service-ERP-Specification\flowserv-api\drizzle.config.ts'
Using 'pg' driver for database querying
[✓] Pulling schema from database...
[✓] Changes applied

> flowserv-api@1.0.0 db:seed
> tsx src/db/seed/index.ts

◇ injected env (5) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
◇ injected env (0) from .env // tip: ◈ secrets for agents [www.dotenvx.com]
🌱 Seeding database...
✅ Seed complete.

> flowserv-api@1.0.0 import:devices
> tsx src/db/seed/import-device-catalog.ts

◇ injected env (5) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
◇ injected env (0) from .env // tip: ⌘ suppress logs { quiet: true }
Created brand: Tecno
Created brand: Itel
Created brand: Infinix
Created brand: Realme
Created brand: vivo
Importing 1778 device models (6 already present, skipped)...
Done.

- [x] **0.2** Jalankan `start-flowserv.bat`
  - **Catatan saya:**
    sudah berjalan dengan baik

---

# A. Kartu Piutang akhirnya bisa diklik 🔴

- [x] **A1** Login **Kasir** → Beranda → **klik kartu "Piutang (AR)"**
  - **Harusnya:** halaman **Piutang Pelanggan** benar-benar terbuka (bukan dipentalkan),
    berisi 2 faktur: Budi Santoso 450rb dan Siti Rahayu 800rb (DP 300rb)
  - **Catatan saya:**
    apakah kasir sebaiknya bisa lihat detail transaksinya atau sebaiknya jangan tapi jika menurut saya lebih baik jika kasir bisa melihat detail transaksi piutangnya

- [x] **A2** Masih sebagai **Kasir** → ketik `/finance` di alamat
  - **Harusnya:** **tetap ditolak.** Kasir boleh menagih, tapi tidak boleh melihat buku
    kas dan laba toko. Kalau ini ikut terbuka, perbaikan A1 kebablasan dan justru membuka
    kembali kebocoran yang R1.5 tutup
  - **Catatan saya:**
    ya muncul toast
    Halaman itu bukan untuk peran Anda
    /finance hanya bisa dibuka oleh peran yang berwenang. Bila Anda memang membutuhkannya, minta pemilik atau admin mengubah peran akun Anda.

- [x] **A3** Masih sebagai **Kasir** → ketik `/finance/ledger`, lalu `/finance/payables`
  - **Harusnya:** keduanya juga ditolak
  - **Catatan saya:**
    ya benar sama muncul toast message juga

- [x] **A4** Login **Teknisi** → ketik `/finance/receivables`
  - **Harusnya:** **ditolak.** Teknisi tidak menagih
  - **Catatan saya:**
    ya berarti gate untuk rolenya sudah benar

---

# B. Antrian ada di Beranda, rinciannya popup

- [x] **B1** Login **Teknisi Andi** → Beranda
  - **Harusnya:** ada kotak **"Menunggu Diambil"** berisi **daftar tiketnya**, bukan
    cuma angka
  - **Catatan saya:**
    Ya ada di dashboard detail tiket yang belum ada teknisinya dan belum di ambil

- [x] **B2** Ketuk salah satu baris di kotak itu
  - **Harusnya:** muncul **popup** (bukan pindah halaman) berisi semua yang dicatat kasir:
    nama, telepon, unit, **keluhan**, **sandi/pola**, tanggal masuk, no. antrian
  - **Catatan saya:** yang muncul di popup = \***\*\*\*\*\***\_\***\*\*\*\*\***
    benar muncul poup dan isinya apa seperti yang di input kasir
    dan untuk nomor antrian masih - apakah memang seperti itu ?

- [x] **B3** Di popup itu, tekan **"Ambil Pekerjaan"**
  - **Harusnya:** popup tertutup, Anda **tetap di Beranda**, tiketnya hilang dari
    "Menunggu Diambil" dan muncul di "Tiket Terbaru Saya". **Inilah tujuan utamanya** —
    tolong nilai apakah sekarang sudah sesederhana yang Anda bayangkan
  - **Catatan saya:**
    Ya persis seperti yang di inginkan saya dan catatan untuk masalah detail servicenya buat per step jadi tiap step iptu ada requirement data yang harus di isi nanti si teknisinya tinggal next next next jadi tidak bingung bila di gabung seperti sekarang akan membingungkan teknisi

- [x] **B4** Buka **Pekerjaan Saya** → di baris antrian, tekan **"Lihat"**
  - **Harusnya:** popup yang **sama persis** muncul di sini juga
  - **Catatan saya:**
    ya permintaan saya memang seperti itu dan sekarang sudah bagus

- [x] **B5** Di daftar **"Sedang Saya Kerjakan"**, perhatikan tombolnya
  - **Harusnya:** di sini tetap **"Buka →"** (halaman kerja penuh), bukan popup — biaya,
    daftar periksa, dan pindah tahap tidak muat di popup. Kalau menurut Anda ini pun
    sebaiknya popup, tolong bilang
  - **Catatan saya:**
    current stagenya di ganti saja lebih di perjelas sekarang di tahap apa dan harus isi apa bisa next dan prev jika misalnya ada data yang salah isi jika seperti ini jadi lebih rumit untuk pengisian form servicenya

---

# C. Teknisi tidak lagi bisa memilih teknisi lain

- [x] **C1** Login **Teknisi** → buka satu tiket → lihat bagian **Teknisi**
  - **Harusnya:** hanya **nama** yang tertulis, **tidak ada dropdown** pilih teknisi
  - **Catatan saya:**
    Benar dropdown sudah hilang dan tidak ada sama sekali

- [x] **C2** Di tiket yang **belum bertuan**, masih sebagai Teknisi
  - **Harusnya:** tombol **"Ambil Pekerjaan"** **tetap ada** — itu menugaskan diri
    sendiri, beda dengan menugaskan orang lain. Kalau tombol ini ikut hilang, saya
    kebablasan
  - **Catatan saya:**
    di bagian mana di halaman mana saya harus mencarinya

- [x] **C3** Login **Manager** → buka tiket yang sama
  - **Harusnya:** dropdown pilih teknisi **masih ada** untuk manajer
  - **Catatan saya:**
    ya manager bisa memilih teknisi

---

# D. Kasir bisa memastikan unit yang barusan dicatat

- [x] **D1** Login **Kasir** → Terima Unit → simpan satu unit
  - **Harusnya:** di bawah form muncul **"Unit Masuk Terbaru"** dan unit yang barusan
    tersimpan **langsung ada di paling atas**, tanpa memuat ulang halaman
  - **Catatan saya:**
    ya sudah ada dan kalau bisa di perketat lagi validasinya saya bisa input tiket service meskipun unit service belum di isi dan buat keluhan / kerusakan jadi kolom wajib di isi
    dan buat kasir bisa memilih teknisi saat membuat tiket service dan juga kasir bisa langsung memberi harga saat pertama kali membuat tiket service

- [x] **D2** Simpan **2 unit lagi** berturut-turut
  - **Harusnya:** ketiganya terlihat di daftar itu, terbaru di atas
  - **Catatan saya:**
    ya sudah benar

- [x] **D3** Tekan **F5** (refresh)
  - **Harusnya:** daftarnya **masih ada** (diambil dari server, bukan cuma diingat halaman)
  - **Catatan saya:**
    ya benar data masih ada

- [x] **D4** Klik salah satu baris di daftar itu
  - **Harusnya:** membuka tiket tersebut
  - **Catatan saya:**
    ya langsung ke halaman detail tiket service

> **Catatan jujur:** daftar ini adalah **"unit masuk terbaru se-toko"**, bukan "yang saya
> input". Database tidak menyimpan siapa yang membuat tiket. Kalau Anda memang butuh
> "hanya milik saya", bilang — itu perlu tambahan kolom dan jadi tugas tersendiri.

---

# E. Regresi — yang lama jangan sampai rusak

- [x] **E1** Pesan validasi masih kalimat (Terima Unit → pola 3 titik)
  - **Catatan saya:**
    validasi masih berfungsi

- [x] **E2** Satu penjualan tunai di menu Kasir sampai selesai
  - **Catatan saya:**
    berjalan dengan baik tinggal perbaiki UI dan UXnya saja nanti dan untuk masalah printer ada waning seperti itu bagus jadi tahu jika misalnya ada masalah pada printernya

- [x] **E3** Alur satu tiket dari Terima Unit sampai Selesai
  - **Catatan saya:**
    ini masih harus ada pengembangan lagi dan lakukan secara bertahap masih terksesan memaksakan saya prefer per step di bagian detail servicenya

- [x] **E4** Beranda tiap peran masih benar (Super Admin, Manager, Kasir, Teknisi)
  - **Catatan saya:**
    Ya Bagus dan tiap role punya beranda yang berbeda beda

---

# Kesimpulan

**Apakah R1.7 sudah benar?**

- [ ] Ya, lanjut ke R2
- [x] Ada yang harus diperbaiki dulu — daftarnya:

```
saya sudah lampirkan di tiap poin di atas perbaikannya

```

---

## ⛔ R2 tidak bisa dimulai tanpa ini

Ini pertanyaan yang sama yang saya ajukan di uji R1.6 dan belum terjawab. **R2 berhenti di
sini sampai Anda mengisinya**, karena menebaknya lalu menegakkan tebakan itu persis
kesalahan yang pernah dibuat di S5 (gerbang penagihan dipasang berdasarkan tebakan, lalu
harus dicabut).

Anda menulis: _"setelah diagnosis tiket kembali di berikan kepada kasir yang nantinya bisa
memilih alurnya dan pemberian nota service juga dari kasir"_, dan _"tiket bisa maju walau
data belum diisi"_ adalah masalah. Untuk menegakkannya saya perlu tahu **apa yang wajib
terisi di tiap tahap sebelum tombol lanjut boleh ditekan**:

| Tahap                              | Wajib terisi sebelum boleh lanjut?                           |
| ---------------------------------- | ------------------------------------------------------------ |
| **Terima Unit** (kasir)            | nama? no. HP? keluhan? sandi/pola?                           |
| **Diagnosa** (teknisi)             | hasil diagnosa? perkiraan biaya? perkiraan lama pengerjaan?  |
| **Pengerjaan** (teknisi)           | catatan pengerjaan? suku cadang yang dipakai?                |
| **QC**                             | semua baris checklist harus tercentang, atau boleh sebagian? |
| **Selesai / Serah Terima** (kasir) | nota sudah dibuat? harus lunas, atau boleh ada sisa?         |

```
(isi bebas — kalimat biasa juga tidak apa-apa, tidak harus mengikuti tabel)


```
