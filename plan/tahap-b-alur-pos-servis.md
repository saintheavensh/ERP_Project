# Tahap B — Perbaikan Alur POS & Alur Servis

> **Dibuat 2026-07-27.** Branch `go-live/tahap-b`. Berasal dari laporan pemilik setelah
> mencoba alur nyata: lima keluhan konkret tentang alur kasir & alur servis. Induk:
> [`plan/go-live-tahap-b-onward.md`](go-live-tahap-b-onward.md) — ini masuk kategori
> "gesekan pilot" (Milestone D), bukan fitur baru.
>
> **Definition of Done tetap `PHASES.md`:** `[x]` hanya bila ada tes lulus / request+response
> terekam / click-path yang benar-benar dijalankan.

---

## 1. Temuan audit kode (terverifikasi 2026-07-27, sebelum menulis kode)

| # | Keluhan pemilik | Status | Bukti |
|---|---|---|---|
| 1 | Kasir tak memasukkan nominal saat checkout | ✅ benar | `CheckoutModal.svelte` hanya pelanggan + metode; `routes/pos/invoices.ts:148,182` langsung `paid` & `amountPaid = grandTotal` |
| 2 | Struk tak otomatis tercetak setelah bayar | ✅ benar | `pos.checkout.svelte.ts:140-149` berhenti di pesan sukses; cetak hanya lewat Riwayat → `InvoiceDetailModal.svelte:142` |
| 3 | Sparepart muncul sebelum diagnosis | ✅ benar | `TicketWorkspace.svelte:189` render `<TicketCharges>` tanpa syarat tahap |
| 4 | Nota & label tak keluar saat intake disimpan | ✅ benar | `ticket.detail.svelte.ts:137,141` — label butuh keluar Intake, tanda terima butuh node "Unit Disimpan"; keduanya belum terpenuhi tepat setelah intake |
| 5 | Mode nota detailed/gabung belum dipakai di alur servis | ⚠️ sebagian sudah ada | `document.ts:164-178` sudah menerapkan setelan tenant ke **setiap** `pos_invoice` termasuk faktur dari tiket; `A4Invoice.svelte:81` sudah punya toggle. Yang kurang: tak terlihat/terpilih di alur servis, dan pembuatan faktur tak punya nominal |

Catatan penting: keluhan #2 dan #4 **membalik keputusan lama yang disengaja** —
[`plan/tahap-a-print-triggers.md`](tahap-a-print-triggers.md) §4 menulis *"Auto-print — sengaja
tidak dibangun"*. Asumsinya sudah berubah: printer per-cabang kini benar-benar bisa diatur di
Settings (Phase 6C.5 scan-and-pick), jadi "printer mana" bukan lagi pertanyaan terbuka.

## 2. Alur servis nyata (dijelaskan pemilik 2026-07-27, sumber kebenaran)

Deskripsi ini menggantikan tebakan mana pun sebelumnya. Tiap langkah punya data yang diisi:

1. **Kasir** — pelanggan datang; input **nama, nomor telepon, keluhan**. Pelanggan
   dipersilakan menunggu panggilan.
2. **Label dicetak** untuk menandai unit. Bila antrian menumpuk, unit bisa ditunda.
3. Unit diserahkan ke teknisi, **atau teknisi mengambil sendiri** pekerjaan dari antrian.
4. **Teknisi** — diagnosis sementara, lalu menyampaikan harga & waktu ke pelanggan, dan
   **menginput: diagnosa, estimasi harga, estimasi waktu**.
5. Dari sini **tiga kemungkinan**: **Ditunggu**, **Disimpan**, atau **batal**.
6. Bila lanjut, **kasir memutuskan alurnya**:
   - **Disimpan** → cetak **nota + label** (menandai unit yang ditinggal).
   - **Ditunggu** → **tidak** ada nota; nota baru keluar **saat selesai**.

### Keputusan pemilik atas alur ini (2026-07-27, putaran kedua)

| # | Keputusan | Mengoreksi |
|---|---|---|
| 1 | **Satu template bercabang**: pilihan alur dihapus dari form intake; percabangan Ditunggu/Disimpan terjadi **setelah Diagnosis** | Aplikasi memaksa memilih alur di intake |
| 2 | **Biaya & sparepart terbuka mulai Diagnosis** | Jawaban putaran pertama ("setelah disetujui") — tak menyediakan tempat bagi estimasi teknisi |
| 3 | **Label di intake; nota hanya cabang Disimpan; Ditunggu dapat nota di akhir** | Jawaban putaran pertama ("label + nota, kedua alur, di intake") |
| 4 | **Nomor antrian + tombol "Ambil Pekerjaan"** dibangun sekarang | — (fitur baru) |

Keputusan putaran pertama yang **tetap berlaku**: auto-cetak langsung ke printer tanpa
dialog (bila printer sudah di-assign), dan input uang diterima + kembalian untuk tunai saja.

### Yang belum ada di aplikasi dan ditambahkan oleh alur ini

- **Hasil diagnosa** — `service_tickets` hanya punya `reportedComplaint` (keluhan
  pelanggan, ditambah di Tahap A). Diagnosa teknisi belum pernah ada kolomnya.
- **Estimasi waktu pengerjaan** — belum ada di skema mana pun.
- **Nomor antrian** + **teknisi menugaskan dirinya sendiri**.

## 3. Desain

### Gerbang tahap — struktural, bukan nama node

`flow_nodes` sudah punya dua sinyal yang cukup, jadi tak perlu mencocokkan nama node
(yang akan rusak begitu tenant mengganti nama):

- **`nodeType: 'decision'`** menandai node persetujuan di ketiga template
  (`Waiting Approval` / `Menunggu Persetujuan`, `seed/04-flows.ts:22,54,67`).
- **`sequenceOrder`** memberi urutan.

Aturan (revisi putaran kedua):
- **Sparepart & Biaya terbuka begitu tiket meninggalkan node intake** — yaitu sejak
  Diagnosis. Node intake dikenali struktural: node tanpa transisi masuk. Di Intake tetap
  terkunci, yang memang keluhan asli pemilik ("sparepart muncul sebelum diagnosis").
- **Faktur & pembayaran terbuka** bila node saat ini berjarak ≤ 1 langkah dari node terminal
  (node tanpa transisi keluar — definisi yang sudah dipakai backend untuk menutup tiket).
  Pada template baru ini berarti QC Akhir + Selesai, plus jalur pintas
  "Diagnosis → Selesai" (kasus "tidak ada kerusakan", tetap boleh ditagih biaya periksa).
- **Nota tanda terima** terbuka bila riwayat tiket pernah masuk tahap yang
  mengonfigurasi `tanda_terima` di `autoPrintDocuments`.
  *(Rancangan awal memakai penanda `nodeType: 'storage'`; itu ditinggalkan begitu R6
  memindahkan aturan cetak ke konfigurasi per tahap — daftar dokumen per tahap sudah
  menjawabnya tanpa perlu tipe node khusus, dan tetap bebas dari pencocokan nama.)*

### Template baru: `Servis` (tunggal, bercabang)

```
Intake(1) → Diagnosis(2) ─┬→ Ditunggu(3) ──────┐
                          ├→ Unit Disimpan(3) ─┴→ QC Awal(4) → Pengerjaan(5) → QC Akhir(6) → Selesai(7)
                          └→ Selesai  (pintas: tidak ada kerusakan)
```

- Percabangan setelah Diagnosis inilah "keputusan kasir" di langkah 6 alur pemilik.
  `Ditunggu` dan `Unit Disimpan` berbagi `sequenceOrder` yang sama (dua cabang sejajar);
  yang membedakan keduanya bukan tipe node, melainkan konfigurasi cetaknya.
- **Persetujuan pelanggan tidak lagi jadi node.** Memilih cabang Ditunggu/Disimpan **adalah**
  persetujuan itu; menolak = tombol "Batalkan Tiket" yang sudah ada (F3/SVC-013). Tombol
  "Minta Persetujuan" tetap ada sebagai aksi (membekukan estimasi jadi quote + reservasi
  stok H10), bukan sebagai tahap.
- **QC Awal & QC Akhir dipertahankan** meski pemilik tak menyebutnya di deskripsi terakhir —
  keduanya dipilih eksplisit oleh pemilik di Tahap A §1 dan tak ada permintaan mencabutnya.
- Tiga template lama (`Standard Repair`, `Servis - Ditunggu`, `Servis - Disimpan`) **tidak
  disentuh**: tiket yang sudah berjalan memakainya, dan banyak test mengunci ID node-nya.

Gerbang ini **UI-level**. Backend sengaja tidak diberi 422 baru: re-quote change order harus
tetap mungkin di node mana pun (Milestone B1), dan fixture e2e membuat charge lewat API. Ini
pola yang sama dengan `canCancel` (UI menggerbangi, API tetap penjaga sebenarnya).

### Auto-cetak

Satu helper FE bersama, `lib/api/auto-print.ts`:
1. `GET /v1/print/documents/:type/:id` (render server, sudah ada).
2. Bila `paperSize !== 'A4'` **dan** `assignment` tidak null → `POST` ke printer agent.
3. Kembalikan status: `printed` | `no-printer` | `agent-offline` | `error`.

Tidak pernah melempar error yang menggagalkan transaksi — cetak adalah efek samping, bukan
bagian dari commit. Bila gagal, UI menampilkan pesan + tombol cetak manual (yang sudah ada).

### Nominal tunai

Kolom baru `pos_invoices.amount_tendered` (money, nullable — hanya terisi untuk tunai).
Kembalian **tidak** disimpan (turunan murni `amountTendered - grandTotal`; menyimpannya =
dua sumber kebenaran). Struk thermal menampilkan baris `TUNAI` + `KEMBALI` bila terisi.

## 4. Task breakdown

Putaran pertama (selesai, sebagian direvisi putaran kedua):

- [x] **T1** POS: `amount_tendered` (schema+BE), field nominal + kembalian + tombol cepat di
      `CheckoutModal`, baris TUNAI/KEMBALI di struk. **Terverifikasi live** (curl): tunai
      kurang → 422 `INSUFFICIENT_TENDER`; tunai 250rb atas total 220rb → tersimpan, struk
      merender `TUNAI 250.000` / `KEMBALI 30.000` pas 48 kolom. 6 unit test `lib/cash.ts`.
- [x] **T2** POS: auto-cetak struk setelah checkout sukses (`lib/api/auto-print.ts`) +
      banner status & tombol Cetak Ulang bila printer mati.
- [x] **T5** Servis: faktur hanya di ujung alur, nominal tunai + kembalian (helper
      `evaluateCashTender` yang sama), mode nota terlihat, auto-cetak nota setelah faktur.
      **Terverifikasi live**: faktur servis tunai kurang → 422; 500rb atas 350rb → nota
      merender `TUNAI/KEMBALI 150.000`, `displayMode: detailed`.

Putaran kedua (revisi setelah pemilik menjelaskan alur nyata):

- [x] **R1** Seed template `Servis` tunggal bercabang, jadi `isDefault` baru (Standard Repair
      diturunkan supaya default tetap tunggal & deterministik). **Terverifikasi live**:
      `GET /v1/flows` menunjukkan `DEFAULT Servis`; grafnya `Intake→Diagnosis→{Ditunggu |
      Unit Disimpan | Selesai}`, kedua cabang menyatu di QC Awal.
- [x] **R2** Kolom `diagnosis` + `estimatedDurationMinutes` + form di tahap yang menandai
      `requiresDiagnosis`. **Terverifikasi live**: PATCH menyimpan diagnosa + 150 menit;
      tanda terima merender `Estimasi: 2 jam 30 menit`. Sekalian memperbaiki bug lama:
      `updateIntakeDetails` melempar 500 pada body tanpa field dikenal (Drizzle menolak
      `.set({})`) — kini no-op.
- [x] **R3** Gerbang biaya kini `flow_nodes.allowsCharges`, bukan tebakan struktural.
- [x] **R4** Cetak kini `flow_nodes.autoPrintDocuments`, dipicu saat MASUK node (intake &
      tiap transisi). **Terverifikasi live**: label di Intake memuat `NO. ANTRIAN 2`;
      tanda terima hanya muncul setelah masuk cabang Unit Disimpan.
- [x] **R5** Nomor antrian harian per cabang (dihitung dalam transaksi intake) + endpoint
      `POST /tickets/:id/claim` (izin `ticket.diagnose`, identitas dari JWT — teknisi
      menugaskan DIRI SENDIRI, bukan orang lain) + tombol "Ambil Pekerjaan".
      **Terverifikasi live**: dua intake berurutan → antrian 1 lalu 2; claim → 200.
- [x] **R6** *(tak direncanakan di awal — permintaan pemilik saat kerja berjalan)*
      **Kapabilitas per tahap di `flow_nodes`**: `allowsCharges`, `requiresDiagnosis`,
      `allowsInvoicing`, `autoPrintDocuments`, `description`. Semua gerbang di FE membaca
      kolom ini; tak satu pun aturan alur tersisa di kode. Ini yang membuat kalimat pemilik
      benar-benar terwujud: *"template flow service ini inti dari semua alur servicenya"*.
- [x] **R7** **Editor alur (Phase 7.1)** — `PUT /v1/flows/:id/design` (simpan seluruh
      rancangan atomik) + `POST /v1/flows`, izin baru `flow.manage` (admin-only).
      `validateFlowDesign()` murni dengan 8 unit test: tepat satu tahap awal, minimal satu
      tahap akhir, tak ada tahap yatim, tak ada transisi ke tahap tak dikenal / ke diri
      sendiri. Penghapusan tahap yang masih dipakai tiket/riwayat → **422 `NODE_IN_USE`**
      menyebut tahap mana (bukan 500 dari pelanggaran foreign key). **Terverifikasi live.**
      FE `/settings/flow`: urutkan tahap dengan seret (HTML5 native, pola papan Kanban P2)
      atau tombol panah untuk layar sentuh, keterangan per tahap, tiga sakelar kapabilitas,
      centang dokumen cetak, dan centang "lanjut ke" untuk percabangan.
- [x] **R8** *(hari yang sama, setelah pemilik memakai R7)* **Editor dipindah ke `/flows`
      dan diubah menjadi DIAGRAM, dengan urutan inti dikunci.**
      Keluhan pemilik ada tiga dan semuanya soal bentuk, bukan soal apa yang disimpan:
      (a) tempatnya salah — *"bukan di bagian setting tetapi di halaman /flow ... bila di
      setting akan lebih ribet dan juga tidak efisien"*; (b) bentuknya salah — *"editnya itu
      seperti diagram dari mana kemana, jangan perbaris"*; (c) kebebasannya kebanyakan —
      *"untuk alur intinya urutannya tidak bisa diubah, konfigurasinya hanya menambahkan qc
      kemudian melewati tahap print awal"*.
      - **Tempat**: `/settings/flow` dihapus; halaman diagram baca-saja yang sudah ada di
        `/flows/:id` sejak Phase 2C kini menjadi editornya. Tab "Alur Servis ↗" di Setelan
        tinggal penunjuk arah, bukan tempat kedua mengatur hal yang sama.
      - **Bentuk**: tata letak dihitung (pangkat = jalur TERPANJANG dari tahap awal, jalur =
        urutan dalam pangkat), jadi percabangan Ditunggu/Unit Disimpan tergambar berdampingan
        dan setiap perpindahan digambar sebagai panah SVG. Penyusunan ulang baris dihapus
        seluruhnya. Yang tersisa: seret tahap dari palet ke tanda **+** pada sebuah panah
        untuk menyisipkan, ✕ untuk melepas (alur menyambung sendiri melewatinya), klik
        tahap untuk mengatur isinya.
      - **Kunci**: kolom baru **`flow_nodes.isCore`**, dikendalikan server dan tidak pernah
        diambil dari payload — tahap yang dibuat lewat editor selalu tahap tambahan,
        sehingga owner tak bisa mengunci buatannya sendiri lalu terjebak. `validateCoreIntegrity()`
        murni + 8 unit test menjaga tiga hal: tahap inti tak boleh hilang, urutannya tak boleh
        ditukar, dan tiap sambungan inti→inti harus tetap tertempuh (boleh lewat tahap
        tambahan, tidak boleh dialihkan ke tahap inti lain).
        **Terverifikasi live (curl):** tukar urutan → 422 `CORE_STAGE_REORDERED`; hapus tahap
        inti → 422 `CORE_STAGE_REMOVED`; alihkan sambungan → 422 `CORE_PATH_BROKEN`; lepas QC
        dan sisipkan tahap baru → 200, tersimpan `isCore:false`.
      - **Dua bug ditemukan karena dijalankan, bukan dibaca** — lihat 4c #4 dan #5.
      - Tombol mati "Create Template" di `/flows` disambungkan ke `POST /v1/flows` yang
        sudah ada sejak R7.
- [x] **R9** *(hari yang sama, dua keluhan pemilik setelah memakai R8)*
      **Alur baru lahir dengan tahap intinya, dan alur bisa dihapus.**
      - *"Ketika membuat template baru alur utamanya tidak terbuat."* Benar: `POST /v1/flows`
        hanya membuat baris template. Tanpa tahap → tanpa panah → tak ada tempat menyisipkan
        apa pun; editornya buntu. `modules/flow/backbone.ts` kini memuat `CORE_BACKBONE`
        (Intake → Diagnosis → {Ditunggu | Unit Disimpan} → Pengerjaan → Selesai, plus cabang
        Diagnosis → Selesai untuk "ternyata tidak rusak"), dan `createFlowTemplate` menulisnya
        dalam satu transaksi dengan `isCore: true`.
        Seed mengambil **nama & keterangan** tahap inti dari konstanta yang sama supaya
        kalimatnya tak berselisih; **kapabilitasnya sengaja tidak diturunkan** — template
        bawaan sudah memasang QC Akhir sehingga pembayaran ada di sana, sedangkan alur baru
        belum punya QC sehingga pembayaran harus ada di Pengerjaan (kalau hanya di tahap
        akhir, kasir menagih setelah tiketnya tertutup). Dua unit test menjaga konstantanya
        sendiri: harus lolos `validateFlowDesign`, dan harus mengizinkan pembayaran di tahap
        yang belum menutup tiket.
      - *"Buatkan fitur delete alur."* `DELETE /v1/flows/:id` (admin-only, teraudit), dengan
        dua penolakan spesifik alih-alih 500 dari pelanggaran foreign key:
        **422 `TEMPLATE_IS_DEFAULT`** (dipakai setiap tiket baru — jadikan alur lain default
        dulu) dan **422 `TEMPLATE_IN_USE`** (masih ditunjuk tiket atau riwayat tiket).
        Di layar: tombol "Hapus Alur" + dialog konfirmasi di halaman editor; alasan penolakan
        tampil apa adanya di banner merah, halaman tidak berpindah.
        **Terverifikasi live:** alur baru → 6 tahap / 7 panah; hapus saat dipakai tiket →
        422 `TEMPLATE_IN_USE`; hapus alur default → 422 `TEMPLATE_IS_DEFAULT`; Manager →
        403 `PERMISSION_DENIED`.
      - Halaman editor juga diberi keadaan-kosong yang jujur untuk alur lama tanpa tahap,
        alih-alih kanvas kosong yang tampak rusak.
- [x] **Verifikasi** `tsc` bersih, `svelte-check` 744 file 0 error, `vitest` **236 lulus**
      (+10 dari `validateCoreIntegrity` & `CORE_BACKBONE`), Playwright **131/131**.
      (Pada putaran R8 sempat 128/129; kegagalannya di spec unggah katalog device, lulus
      saat dijalankan sendiri dan lulus lagi di putaran penuh R9 — flaky bergantung urutan,
      bukan akibat perubahan ini.)

## 4c. Bug nyata yang ditemukan tes, bukan pembacaan kode

1. **`bind:value` pada `<input type="number">` menulis balik *number*/`null`, bukan string.**
   Getter nominal memanggil `.trim()` → melempar → seluruh perhitungan kembalian mati diam.
   Terjadi di tiga tempat (nominal POS, nominal faktur servis, estimasi durasi).
2. **Modal pembayaran POS default ke "Dana" (e-wallet)**, bukan Tunai — hanya karena Dana
   metode aktif pertama secara abjad. Kasir harus mengklik "Tunai" di hampir setiap
   transaksi. Kini default ke tunai bila tenant punya metode tunai aktif.
3. **`currentNode.description` sudah dirender sejak Phase 3 tanpa kolomnya pernah ada** —
   selalu kosong. Ditutup oleh kolom `description` di R6.
4. **`SELECT ... FROM flow_nodes` tanpa `ORDER BY` dipakai sebagai pembanding urutan inti.**
   Urutan baris yang dikembalikan Postgres tidak dijamin, jadi penyisipan QC yang sah
   ditolak `CORE_STAGE_REORDERED` dengan pesan yang urutannya sendiri acak. Diperbaiki di
   dua lapis: query-nya diberi `ORDER BY sequence_order`, dan `validateCoreIntegrity()`
   kini mengurutkan sendiri berdasarkan `sequenceOrder` supaya pemanggil berikutnya tak
   bisa mengulang kesalahan yang sama. Ada regression test yang sengaja memberinya daftar
   teracak.
5. **Petunjuk "siap dipasang" yang hanya muncul saat menyeret MENGGESER diagram ke bawah.**
   Sasaran jatuh ikut bergeser keluar dari bawah kursor, sehingga `drop` tak pernah terjadi
   dan seretan asli tidak pernah berhasil — di Playwright maupun (yang lebih penting) di
   tangan pengguna. Barisnya kini selalu dirender, kosong saat menganggur. Ditemukan dengan
   merekam peristiwa `dragstart`/`dragover`/`drop` yang benar-benar sampai ke halaman, lalu
   membandingkannya dengan papan Kanban P2 yang seretannya memang bekerja.

## 4b. Catatan operasional (wajib disampaikan ke pemilik)

Seed hanya memasang printer untuk `receipt` (Pusat 80mm & Cabang 58mm) dan `invoice_a4`
(Pusat). **`label` dan `tanda_terima` belum punya printer ter-assign di cabang mana pun**,
jadi auto-cetak keduanya akan melapor "belum ada printer diatur" sampai di-assign lewat
**Setelan → Printer**. Sengaja tidak diseed: constraint `paperSize` device harus cocok
dengan template (label 58mm, tanda terima 80mm), dan memilih printer fisik mana untuk apa
adalah konfigurasi milik toko, bukan tebakan seed.

## 5. Di luar scope (dicatat agar tak dikira lupa)

- Bayar sebagian / DP di POS (keputusan #4) — `customer_payments` sudah mendukung di sisi
  data, tapi checkout POS belum memakainya.
- Plafon diskon numerik per peran — masih biner sejak D2.
- Nominal untuk metode non-tunai (cocokkan mutasi rekening) — belum dibutuhkan pilot.
