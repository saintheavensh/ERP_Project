# Go-live — Penyederhanaan (S1–S4)

> **Dibuka 2026-07-28**, atas permintaan langsung pemilik, di tengah pekerjaan
> template nota (Fase 7.2 baru saja selesai). Permintaan template nota berikutnya
> — editor tata letak bebas, `nota_pengambilan`, `nota_garansi`, sakelar harga
> detail/total — **sengaja ditunda sampai track ini selesai**, lihat "Yang
> ditunda" di bawah.

## Kenapa track ini ada

Kalimat pemiliknya sendiri, dan ini diagnosis yang lebih tepat dari audit mana pun:

> "saya ingin membuat aplikasi ini sefleksibel dan sedinamis mungkin tetapi malah
> jadi lebih rumit untuk orang yang tidak mengerti teknologi, sedangkan pasar yang
> akan datang adalah pasar yang hampir rata-rata kurang ahli dalam mengoperasikan
> komputer."

Dan sebelumnya: *"aplikasi ini menjadi terlalu rumit untuk digunakan"*, disertai
pengakuan jujur bahwa ia tak tahu bagian mana yang salah.

Fleksibilitas bukan kesalahannya — itu justru pembeda FlowServ (`specification/00-README.md`:
"Workflows are data/configuration, not hardcoded logic"). Kesalahannya adalah
**di mana fleksibilitas itu diletakkan**: ia bocor ke layar orang yang bekerja,
bukan tinggal di layar orang yang menyiapkan.

## Prinsip yang mengikat seluruh track ini

**"Atur sekali, lalu menghilang."**

1. Pengaturan yang hanya disentuh saat pemasangan tidak boleh terlihat tiap hari.
2. Default harus cukup baik sampai sebuah toko bisa beroperasi **tanpa pernah
   membuka Setelan sama sekali**.
3. Mesinnya tetap lentur (flow engine, template, RBAC — semuanya tak diubah).
   Yang dikurangi hanya **permukaan yang dilihat pemakai harian**.
4. Menghapus/menyembunyikan layar tidak boleh menghapus kemampuan. Kalau sebuah
   fungsi hilang dari menu, ia harus tetap terjangkau dari tempat ia dibutuhkan.

## Bukti yang memicu track ini (diukur dari kode, 2026-07-28)

| Ukuran | Angka |
|---|---|
| Halaman `(app)` | 34 |
| Endpoint API | 124 |
| Baris menu sidebar (Super Admin) | 22 |
| Tab di Setelan | 6 |
| Berkas `.svelte` | 97, **50 di antaranya** memuat teks UI bahasa Inggris |
| Kolom di formulir terima unit | 10 |

**Judul halaman yang ada sekarang** — dikutip apa adanya, inilah wujud
"rumit" itu:

```
Goods Receipt (Gudang)      Receive Items (Warehouse)   Receive PO (Warehouse)
Input Invoice & Costing (Manager)                       Purchase Invoices & Costing
Manajemen Hutang (Accounts Payable)                     Manajemen Piutang (Accounts Receivable)
Mass Initial Stock Wizard   Master Purchasing Dashboard New Service Intake
Finance Ledger              Katalog Produk              Riwayat Penjualan (POS)
```

Tiga masalah sekaligus: dua bahasa dalam satu aplikasi (bahkan dalam satu judul),
istilah akuntansi Inggris untuk pemakai yang bukan akuntan, dan **tiga layar
berbeda yang sama-sama berarti "barang datang"**.

## Kenapa ini terjadi

`PHASES.md` punya 12 fase, dan **tidak satu pun tugasnya berbunyi "kurangi"**.
Tiap fase menambah modul; tak ada fase yang merapikan. Sepuluh fase menumpuk.
Ini bukan kesalahan siapa-siapa — itu bentuk rencananya.

## Keputusan pemilik yang mengarahkan track ini

Ditanya lewat AskUserQuestion, 2026-07-28:

- **Sumber rumit:** keempat-empatnya dipilih (bahasa, jumlah menu, layar kembar,
  banyak isian).
- **Pemakai:** *"Belum dipakai staf sama sekali."*

Poin kedua adalah izin untuk berani. Tidak ada staf yang harus belajar ulang,
tidak ada hafalan yang rusak. Merapikan sekarang gratis; setahun lagi mahal.

## Tugas

### S1 — Bahasa & istilah
Seluruh teks yang dibaca pemakai jadi satu bahasa: **bahasa toko sehari-hari**,
bukan bahasa akuntansi, bukan campur.

| Sekarang | Jadi |
|---|---|
| Goods Receipt / Receive Items / Receive PO | Barang Masuk |
| Accounts Payable / Manajemen Hutang | Hutang ke Supplier |
| Accounts Receivable / Manajemen Piutang | Piutang Pelanggan |
| Input Invoice & Costing | Nota Pembelian |
| Finance Ledger | Buku Kas |
| New Service Intake | Terima Unit |
| Mass Initial Stock Wizard | Isi Stok Awal |
| Service Tickets | Servis |

Menutup utang lama yang sudah tercatat di `PHASES.md` Architecture Debt:
*"Comments and error strings mix Indonesian and English — pick one for
user-facing text"*.

### S2 — Sidebar diringkas
22 baris → pekerjaan harian saja, sisanya di satu tempat yang jarang dibuka.
Menghilang dari menu ≠ hilang: tiap fungsi tetap terjangkau dari tempat ia
dipakai.

### S3 — Gabung layar kembar
3 layar "barang datang" → 1. 6 layar pembelian → 2. Yang digabung adalah
**layarnya**, bukan datanya — endpoint dan aturan bisnisnya tak disentuh.

### S4 — Terima unit ringkas
Yang jarang dipakai di meja depan dilipat ke "Data tambahan (opsional)".
Terima unit adalah tugas paling sering di toko servis; ia harus paling cepat.

**Koreksi saat mengerjakan.** Percobaan pertama juga melipat **sandi/pola**, dengan
alasan "pad polanya memakan banyak ruang". Itu salah: `PasscodeField` default-nya
mode PIN — dua tombol kecil + satu input, setinggi kolom biasa; pad pola baru muncul
kalau ditekan "Pola". Dan untuk servis HP teknisi hampir selalu perlu membuka unit,
jadi itu bagian dari pekerjaan intake. Dikembalikan ke tampak; yang dilipat tinggal
email & nomor seri. Ketahuan karena 2 tes e2e sandi/pola gagal — bukan karena dibaca ulang.

## Hasil (2026-07-28)

| | Sebelum | Sesudah |
|---|---|---|
| Baris menu sidebar (pemilik) | 22 | **6** (5 harian + "Lainnya" tertutup) |
| Baris menu (teknisi / kasir) | 3 | 3 (bahasa dirapikan) |
| Layar daftar pembelian | 6 | **1** bertab |
| Layar "barang datang" | 3 | **0 sebagai tujuan** — jadi tombol di baris PO |
| Kolom terlihat di terima unit | 9 | **7** (2 dilipat ke opsional) |
| Judul halaman berbahasa Inggris | 19 dari 30 | **0** |

**S3 — yang sebenarnya dilakukan.** Bukan sekadar menggabung empat daftar jadi satu
halaman bertab. Yang lebih menentukan: pekerjaan "terima barang" dan "catat nota"
berhenti menjadi **tujuan yang harus dicari di menu** dan berubah jadi **tombol pada
baris PO yang memang sedang membutuhkannya** (`primaryAction()` di
`inventory/purchasing/+page.svelte`). Sebelumnya pemakai harus tahu lebih dulu
layar mana yang benar — padahal namanya tak bisa dibedakan. Sekarang tak ada yang
perlu diketahui lebih dulu.

Yang dihapus: `inventory/receive/`, `inventory/purchasing/receipts/`,
`inventory/purchasing/orders/`, `inventory/purchasing/invoices/`.
Yang tetap, karena memang aksi nyata dan bukan kembaran: `purchasing/new`,
`purchasing/[id]`, `purchasing/[id]/receive`, `purchasing/[id]/invoice`.

**Tidak ada kemampuan yang hilang.** Diperiksa lebih dulu: satu-satunya tautan ke
keempat halaman itu adalah sidebar; sisanya endpoint API (`/v1/purchasing/orders`),
yang tak disentuh.

## Bukti nyata bahwa kekhawatiran pemilik benar

Pemilik menuliskannya begini:

> *"yang ada di benak saya malah nanti aplikasinya banyak bug karena alur penting
> dan juga yang lainnya terlalu banyak di-tweak."*

Track ini tanpa sengaja menghasilkan buktinya. Saat menjalankan suite penuh,
**6 tes gagal yang tak ada hubungannya dengan perubahan apa pun**:
`tahap-a-change-order`, `tahap-b-pos-service-flow`, `tahap-b-flow-builder`, dan
tiga tes `p6b1-printer-settings`. Setelah `npm run db:reset`, keenam-enamnya lulus.

Sebabnya persis yang ditakutkan pemilik: **`tahap-b-flow-builder` mengubah template
alur bersama** (mematikan kemampuan sebuah tahap untuk membuktikan bahwa
mematikannya benar-benar mengunci form biaya). Template itu tidak dikembalikan,
sehingga tes berikutnya berjalan di atas aturan alur yang sudah lain — dan gagal
dengan pesan yang sama sekali tidak menunjuk ke penyebabnya
(`getByRole('button', { name: 'Jasa' })` tidak ketemu). Pola yang sama pada
`p6b1-printer-settings`: satu tesnya menghapus asimetri seed yang tes lain
andalkan.

Ini "alur penting di-tweak lalu yang lain rusak", dalam skala kecil dan aman —
di suite tes, bukan di toko. Di toko bentuknya akan sama: satu orang mengubah
satu sakelar di satu tahap, lalu sesuatu yang tampaknya tak berhubungan berhenti
bekerja, dan pesan errornya tidak menyebut sakelar itu.

**Kesimpulan yang dibawa ke rekomendasi arsitektur:** yang berbahaya bukan
jumlah pilihan, melainkan jumlah **kombinasi** yang tak pernah diuji. Tiga
sakelar aturan per tahap = 8 kemungkinan per tahap; alur 6 tahap = ~260.000
bentuk. Bandingkan dengan nota: berapa pun sakelarnya, jalur rendernya tetap
**satu** (dijamin tes `renderTemplatePreview` vs `renderThermalBlocks`), jadi
tak ada kombinasi yang bisa meledak.

Karena itu arahnya: **bebas di tampilan, sempit & terkunci di aturan uang/stok.**
Usulan konkretnya — ganti 3 boolean bebas jadi beberapa "jenis tahap" bernama
(Pemeriksaan / Pengerjaan / Penagihan / QC / Selesai), masing-masing dengan
kemampuan tetap yang sudah diuji. Belum dikerjakan; dicatat di sini sebagai
tugas tersendiri.

## S5 — Jenis tahap, dan aturan yang akhirnya benar-benar ditegakkan

Dikerjakan 2026-07-28 setelah pemilik menjawab *"ya lanjutkan usulan anda"*.

**Temuan yang mengubah bentuk pekerjaan ini.** Saat memeriksa kode untuk
memulai, ternyata `allowsCharges` / `requiresDiagnosis` / `allowsInvoicing`
**tidak ditegakkan di mana pun di backend** — pencarian menyeluruh hanya
menemukannya di schema, seed, backbone, dan flow service (baca/tulis rancangan).
Yang membacanya cuma frontend, untuk mengunci form. Artinya **kuncinya semu**:
satu panggilan API langsung, atau satu bug di frontend, menembusnya.

Itu bentuk cacat yang sama dengan yang dulu dibereskan Track F — tampilan yang
berbohong tentang aturan yang sebenarnya tidak ada. Jadi "jenis tahap" saja
tidak cukup; tanpa penegakan, ia hanya mengganti nama hiasan.

**Yang dikerjakan, dua hal sekaligus:**

1. **`modules/flow/stage-kinds.ts`** — 5 jenis tahap (Penerimaan, Pemeriksaan,
   Pengerjaan, Penagihan, Penutup), masing-masing membawa kapabilitas tetap.
   `stage_kind` jadi satu-satunya sumber kebenaran di `flow_nodes`; ketiga kolom
   boolean tetap ada tapi **selalu diturunkan** (`capabilitiesFor()`), tak pernah
   ditulis sendiri — di seed, di `createFlowTemplate`, maupun di `saveFlowDesign`.
   Klien mengirim jenisnya saja, jadi ia **tak punya cara** mengirim kombinasi di
   luar kelima yang teruji.

   Angka 5 bukan penyederhanaan yang dipaksakan: dari 8 kombinasi yang mungkin,
   data yang benar-benar ada (seed + backbone) hanya memakai 5. Kelimanya
   diberi nama; tak ada satu pun tahap yang berubah artinya.

2. **Penegakan di server** — `assertStageAllows()` di `modules/tickets/service.ts`,
   dipasang di `addCharge`. Menolak dengan **422** `CHARGES_NOT_ALLOWED_AT_STAGE`,
   pesannya menyebut nama tahapnya. Tiket tanpa tahap aktif (data lama) sengaja
   tidak diblokir — mengunci tiket yang sedang berjalan lebih merusak daripada
   aturan yang belum berlaku baginya.

   **Koreksi, ditemukan dengan menjalankan tes.** Gerbang yang sama sempat
   dipasang di `generateTicketInvoice` (`INVOICING_NOT_ALLOWED_AT_STAGE`) dan
   **dicabut lagi**. Dua tes e2e menabraknya, dan setelah diperiksa keduanya
   benar: mereka menerbitkan nota setelah kuotasi disetujui, sebelum
   pengerjaan — urutan yang normal untuk alur "Ditunggu" (pelanggan setuju,
   membayar, baru unitnya dikerjakan).
   Yang memblokir bukan kebijakan toko, melainkan nilai `allowsInvoicing` hasil
   **tebakan backfill** (`sequenceOrder >= maxOrder - 1`). Menegakkan angka
   tebakan seolah-olah keputusan justru menghasilkan kelas bug yang track ini
   ada untuk mencegahnya.
   `allowsCharges` ditegakkan karena nilainya memang keputusan pemilik yang
   dinyatakan eksplisit ("sparepart baru boleh setelah diagnosis");
   `allowsInvoicing` belum pernah diputuskan siapa pun, jadi untuk sekarang ia
   tetap **petunjuk tampilan, bukan aturan** — dicatat apa adanya di kode,
   bukan dibiarkan tampak seperti kunci yang nyata.

**Editor:** tiga sakelar → satu pilihan "Jenis tahap" + kalimat penjelas.
Daftar jenisnya **dikirim server** lewat `GET /v1/flows/:id` (`stageKinds`),
tidak disalin ke frontend — label, penjelas, dan kapabilitas hanya hidup di satu
berkas, jadi yang dilihat pemilik selalu sama dengan yang ditegakkan API.

**Diverifikasi langsung (curl, bukan hanya tes):** tiket baru di tahap Intake →
tambah biaya ditolak `422 CHARGES_NOT_ALLOWED_AT_STAGE "…di tahap \"Intake\""`.
Kedelapan tahap seed terbaca konsisten antara `stage_kind` dan kapabilitas
turunannya, dan daftar jenis yang dikirim ke editor cocok dengan kapabilitas
yang ditegakkan.

**12 tes unit baru** (`__tests__/stage-kinds.test.ts`) menguji klaimnya, bukan
sekadar fungsinya: jumlah jenis memang sedikit dan tetap, tiap jenis punya
kombinasi kapabilitas yang **berbeda** (dua jenis identik = kendali mati),
tahap yang mewajibkan diagnosis harus boleh mencatat biaya, pemetaan baris lama
bolak-balik tanpa berubah, dan kombinasi tak terpakai tak pernah **melonggarkan**
aturan.

**Satu perbaikan tambahan pada tes e2e:** tes yang mengubah template alur
bersama kini mengembalikannya di `finally`. Versi sebelumnya mengembalikan di
akhir badan tes — jadi saat ia gagal di tengah, pengembaliannya tak pernah
tercapai dan enam tes lain ikut gagal. Itu persis mekanisme yang dijelaskan di
bagian sebelumnya.

## Temuan sampingan (belum diperbaiki, sengaja)

`POST /v1/inventory/:id/receive` — terima stok manual tanpa PO — **tak punya satu pun
pemanggil di frontend**. Diperiksa saat memastikan S3 tidak menghapus jalur terima
manual: halaman `/inventory/receive` yang dihapus ternyata bukan UI-nya (ia mendaftar
PO berstatus `ordered`), jadi endpoint ini memang sudah yatim sejak sebelum track ini.

Bentuk cacatnya sama persis dengan yang Track F dulu bereskan: kode yang ada tapi
"berbohong". Tidak diperbaiki di sini karena di luar lingkup S1–S4, dan menambal UI
baru justru melawan tujuan track ini. Dicatat supaya tidak hilang lagi.

## Yang ditunda (bukan dibatalkan)

Permintaan pemilik 2026-07-28, tepat sebelum track ini dibuka:

- Editor tata letak nota yang bebas (urutan blok, rata kiri/tengah/kanan, ukuran huruf)
- Jenis nota baru: `nota_pengambilan`, `nota_garansi`
- Sakelar harga: rincian per item vs total saja (per template, bukan per tenant —
  sekarang ada di `tenants.settings.invoiceDisplayMode`, lihat `INVOICE_DISPLAY_MODES`)

Ketiganya **menambah hal yang harus diatur**. Mengerjakannya sekarang berarti
menambah ke tumpukan yang persis sedang dikeluhkan. Dikerjakan setelah S1–S4,
dengan prinsip "atur sekali lalu menghilang" sudah berlaku — jadi editornya
tinggal di tempat penyiapan, dan kasir tak pernah melihatnya.

Catatan teknis untuk nanti: `renderTemplatePreview()` di
`modules/printer/sample.ts` sudah menjamin pratinjau memakai mesin cetak yang
sama; jenis nota baru cukup menambah builder di `ticket-document.ts` +
`DOCUMENT_TYPES`, dan sakelar harga sudah punya cetak birunya di
`summarizeItems()` + `data.displayMode`.
