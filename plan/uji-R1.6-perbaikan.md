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

- [X] **0.1** Jalankan `npm run db:reset` di `flowserv-api/` — **wajib**, karena seed
      berubah (ada teknisi kedua dan dua faktur piutang baru)
  - **Catatan saya:**
  sudah di jalankan dan ini buktinya 
  PS C:\Users\Good\Documents\web\ERP_Project\flowserv-api> npm run db:reset

> flowserv-api@1.0.0 db:reset
> tsx src/db/reset.ts && npm run db:push && npm run db:seed && npm run import:devices

◇ injected env (6) from .env // tip: ⌘ suppress logs { quiet: true }
◇ injected env (0) from .env // tip: ⌘ enable debugging { debug: true }
🗑️  Dropping schema...
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
Reading config file 'C:\Users\Good\Documents\web\ERP_Project\flowserv-api\drizzle.config.ts'
Using 'pg' driver for database querying
[✓] Pulling schema from database...
[✓] Changes applied

> flowserv-api@1.0.0 db:seed
> tsx src/db/seed/index.ts

◇ injected env (6) from .env // tip: ⌁ auth for agents [www.vestauth.com]
◇ injected env (0) from .env // tip: ⌁ auth for agents [www.vestauth.com]
🌱 Seeding database...
✅ Seed complete.

> flowserv-api@1.0.0 import:devices
> tsx src/db/seed/import-device-catalog.ts

◇ injected env (6) from .env // tip: ◈ encrypted .env [www.dotenvx.com]
◇ injected env (0) from .env // tip: ◈ encrypted .env [www.dotenvx.com]
Created brand: Tecno
Created brand: Itel
Created brand: Infinix
Created brand: Realme
Created brand: vivo
Importing 1778 device models (6 already present, skipped)...
Done.

- [X] **0.2** Jalankan `start-flowserv.bat`
  - **Catatan saya:**
  sudah di jalankan

> **Akun baru:** `technician2@demo.com`, sandi `admin123` (Teknisi Rina). Yang lama tetap:
> `admin@demo.com`, `manager@demo.com`, `technician@demo.com`, `cashier@demo.com`.

---

# A. Pesan error berhenti berupa "array object" 🔴

> Ini yang paling luas dampaknya — perbaikannya bukan di halaman Terima Unit saja, tapi di
> **semua** halaman yang punya form. Kalau Anda menemukan JSON mentah muncul di layar mana
> pun selama menguji, itu temuan penting; tolong catat halaman apa.

- [X] **A1** Kasir → Terima Unit → mode **Pola**, gambar **3 titik** → Simpan
  - **Harusnya:** yang muncul persis kalimat **"Pola minimal 4 titik."** — tanpa tanda
    `[`, tanpa `"code"`, tanpa `"path"`
  - **Catatan saya:** pesan yang muncul = \***\*\*\*\*\***\_\***\*\*\*\*\***
  sudah benar dan ini buktinya 
  Gagal menyimpan unit masuk
Pola minimal 4 titik.

- [X] **A2** Ganti ke mode **Sandi**, isi **"12"** → Simpan
  - **Harusnya:** **"Sandi/PIN minimal 4 karakter."**
  - **Catatan saya:**
  bekerja juga 
  Gagal menyimpan unit masuk
Sandi/PIN minimal 4 karakter.

- [X] **A3** Isi pola **4 titik** atau sandi **"1234"** → Simpan
  - **Harusnya:** tersimpan seperti biasa, tidak ada peringatan
  - **Catatan saya:**
 berhasil 
 Tiket bdd6afbc berhasil dibuat
Form sudah dikosongkan — langsung lanjut ke unit berikutnya.

Label belum tercetak. Belum ada printer diatur untuk cabang ini — atur di Setelan → Printer.
---

# B. Ambil pekerjaan cukup satu klik

- [X] **B1** Login **Teknisi Andi** → buka **Pekerjaan Saya**
  - **Harusnya:** di daftar **"Menunggu Diambil"**, tiap baris sekarang punya tombol
    biru **"Ambil"** di sebelah "Buka →"
  - **Catatan saya:**
    sebaiknya untuk daftar antrian service atau service yang belum di ambil oleh teknisi di sertakan di bagian dashboard jadi tinggal ambil saja 
    dan unutk detailnya jangan buka halaman baru jika ingin lihat detail munculkan popup saja untuk halaman teknisi jadi di halaman teknisi jika misalnya klik tiket servicenya muncul popup semua yang di inputkan kasir keluhan nama tanggal pola dan lain sebagainya nanti teknisi tersebut memutuskan jika ingin mengambil pekerjaan tersebut tinggal klik ambil pekerjaan dan terassign ke teknisi tersebut 

- [X] **B2** Tekan **Ambil** di salah satu baris — jangan buka detailnya dulu
  - **Harusnya:** tiketnya langsung **pindah** dari "Menunggu Diambil" ke "Sedang Saya
    Kerjakan", tanpa berpindah halaman. **Inilah tujuan utamanya** — tolong nilai apakah
    sekarang sudah sesederhana yang Anda bayangkan
  - **Catatan saya:**
  sudah bisa di ambil pekerjaannya tetapi langkahnya terlalu banyak saya sertakan semuanya di poin B1

- [X] **B3** Buka satu tiket yang belum bertuan lewat "Buka →", lalu tekan
      **"Ambil Pekerjaan"** di halaman detail
  - **Harusnya:** **masih bisa.** Tombol lama tidak dihapus — sebagian orang terlanjur
    membuka detailnya dulu
  - **Catatan saya:**
  Ya masih bisa dan sebaiknya di ubah halaman detail unit servicenya soalnya membingungkan cara inputnya dan di halaman detail service sebaiknya teknisi tidak bisa memlih teknisi lainnya soalnya itu membigungkan 

- [X] **B4** ⭐ **Yang belum pernah bisa Anda uji (poin B6 uji R1).** Sekarang login
      **Teknisi Rina** (`technician2@demo.com` / `admin123`)
  - **Harusnya:** tiket yang barusan diambil Andi **tidak muncul** di antrian Rina, dan
    tidak muncul di "Sedang Saya Kerjakan" milik Rina
  - **Catatan saya:**
  sudah benar yang ketika saya login teknisi 2 data di halaman yang sudah di ambil teknisi 1 menghilang dan itu yang harusnya terjadi jadi teknisi 2 tidak bisa melihat pekerjaan yang di lakukan teknisi lainnya 

---

# C. Kartu Piutang akhirnya ada isinya

> Nilai 0 yang Anda lihat kemarin **bukan** karena izin kasir kesempitan — seed memang
> tidak pernah membuat satu pun faktur POS, jadi kartu itu 0 untuk semua peran termasuk
> Super Admin. Sekarang ada dua faktur contoh.

- [X] **C1** Login **Kasir** → Beranda
  - **Harusnya:** kartu **Piutang (AR)** menunjukkan **Rp 950.000** dari **2 faktur**
  - **Catatan saya:**
  Ya ada nominalnya sekarang untuk piutang

- [X] **C2** Klik kartu itu
  - **Harusnya:** membuka daftar piutang: satu faktur 450rb belum dibayar sama sekali,
    satu faktur 800rb sudah **DP 300rb** (sisa 500rb)
  - **Catatan saya:**
Tidak bisa di klik ketika login kasir karena akses di tolak 
http://localhost:5188/?ditolak=%2Ffinance%2Freceivables
- [X] **C3** Login **Kasir** → ketik `/finance` di alamat
  - **Harusnya:** **tetap dipentalkan.** Kasir boleh melihat siapa yang berhutang
    (dia yang menagih), tapi **tidak** boleh melihat buku kas dan laba toko
  - **Catatan saya:**
  ya benar ada warning seperti ini
  Halaman itu bukan untuk peran Anda
/finance hanya bisa dibuka oleh peran yang berwenang. Bila Anda memang membutuhkannya, minta pemilik atau admin mengubah peran akun Anda.

---

# D. Alamat `?ditolak=` bersih sendiri

- [X] **D1** Login **Kasir** → ketik `/flows` di alamat
  - **Harusnya:** kotak kuning "Halaman itu bukan untuk peran Anda" **tetap muncul**,
    tapi alamat di atas kembali bersih jadi `/` saja
  - **Catatan saya:**
  Ya benar sekali 
  Halaman itu bukan untuk peran Anda

/flows hanya bisa dibuka oleh peran yang berwenang. Bila Anda memang membutuhkannya, minta pemilik atau admin mengubah peran akun Anda.
ini urlnya 
http://localhost:5188/
sudah bersih

- [X] **D2** Tekan **F5** (refresh) di halaman itu
  - **Harusnya:** kotak kuningnya **tidak muncul lagi** — Anda tidak sedang ditolak
    apa-apa sekarang
  - **Catatan saya:**
  Ya warningnya sudah hilang ketika di refresh

- [X] **D3** Ketik `/settings` → dipentalkan lagi
  - **Harusnya:** kotak kuning muncul **lagi**, kali ini menyebut `/settings`
  - **Catatan saya:**
  ya sudah benar
  Halaman itu bukan untuk peran Anda

/settings hanya bisa dibuka oleh peran yang berwenang. Bila Anda memang membutuhkannya, minta pemilik atau admin mengubah peran akun Anda.

---

# E. Regresi — yang lama jangan sampai rusak

- [X] **E1** Kasir → Terima **2 unit berturut-turut** (tanpa menekan "kembali")
  - **Harusnya:** masih selancar R1.5 — form kosong sendiri, kotak hijau muncul
  - **Catatan saya:**
  Ya berhasil tidak ada masalah sama sekali 
tinggal tambahkan riwayat input tiket service di bagian kasir untuk memastikannya 

- [X] **E2** Satu penjualan tunai di menu Kasir sampai selesai
  - **Harusnya:** selesai normal. **Jangan `db:reset` setelah ini** kalau Anda ingin
    fakturnya tetap terlihat di daftar
  - **Catatan saya:**
  ya sudah berhasil dan nota langsung tercetak ketika sudah melakukan pembayaran

- [X] **E3** Buka satu form lain yang punya validasi (mis. tambah Pelanggan, atau tambah
      Barang di Stok) → sengaja kosongkan kolom wajib → Simpan
  - **Harusnya:** pesannya kalimat, bukan JSON. **Ini yang membuktikan perbaikan A
    berlaku di seluruh aplikasi**, bukan cuma di Terima Unit
  - **Catatan saya:** halaman yang saya coba = \***\*\*\*\*\***\_\***\*\*\*\*\***
  di halaman tambah pelanggan ketika field yang wajib tidak di isi tombol save customer tidak bisa di klik dan itu sudah bagus 

- [X] **E4** Beranda tiap peran masih menampilkan kartu yang benar
  - **Catatan saya:**
    Ya sudah benar tinggal bagian teknisi saja di perbaki sedikit
---

# Kesimpulan

**Apakah R1.6 sudah benar?**

- [ ] Ya, lanjut ke R2
- [X] Ada yang harus diperbaiki dulu — daftarnya:

```
Baca catatan di atas sepertinya belum bisa lanjut

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
