# Tahap A — Katalog Device (gambar/spesifikasi/saran servis) + Mode Tampilan Invoice

> **Status: SELESAI 2026-07-25.** Dipicu oleh mockup yang pemilik bagikan ("SALES
> MODULE — ADDITIONAL FEATURES & SETTINGS"), bukan item bernomor di
> [`plan/go-live-plan.md`](go-live-plan.md) — request baru di luar Tier-1, dikerjakan
> di branch yang sama (`go-live/tahap-a`) karena menyentuh area yang sama (intake
> tiket + cetak invoice). Verifikasi: `tsc` bersih, `svelte-check` 733 file 0 error,
> `vitest` 201/201 (198 + 3 baru untuk `summarizeItems`), **Playwright 99/99** (94
> lama + 5 baru, full suite sekali `db:reset` bersih).

---

## 1. Konteks & keputusan yang dibuat bersama pemilik

Mockup punya dua fitur:
1. **Invoice Display Setting** — toggle Detailed/Summary/Flexible di invoice.
2. **Unit Information with Image & Minimum Specifications** — saat intake, sistem
   otomatis tampilkan gambar + spesifikasi device + saran servis umum.

Tiga pertanyaan diselesaikan sebelum desain:

- **Sumber data gambar/spesifikasi?** → **Input manual per model**, bukan scraping API
  eksternal. (Legacy app pemilik — `legacy/apps/backend/.../devices` — sempat mencoba
  scraping GSMArena; kemungkinan besar salah satu sumber "tidak beres"-nya. Tidak
  diulang di sini.)
- **Invoice mode: sekarang atau nanti?** → **Sekalian sekarang.**
- **Per-tenant atau digeneralisir ke dashboard SaaS lintas-tenant?** → Sempat
  bimbang (khawatir spesifikasi umum, mis. RAM/storage Galaxy S25, terduplikasi
  tiap toko input ulang). **Keputusan: tetap per-tenant**, dengan alasan:
  1. Ternyata **tabel `device_models` sudah ada** di skema (`db/schema/product_catalog.ts`),
     dibuat untuk DEV-008 (kompatibilitas sparepart↔HP), **sudah per-tenant** (lewat
     `deviceBrandId → deviceBrands.tenantId`), tapi baru berisi nama merk+model, tanpa
     gambar/spesifikasi. Menambah kolom di tabel ini, bukan bikin tabel baru, berarti
     nol duplikasi konsep baru dan satu input model HP dipakai dua fungsi sekaligus
     (kompatibilitas sparepart + tampilan intake).
  2. Dashboard admin lintas-tenant (Platform Super Admin) **belum ada sama sekali**
     (Phase 12.11) — deployment sekarang masih local-first, 1 tenant nyata. Membangun
     katalog bersama lintas-tenant sekarang berarti mendahului kebutuhan yang belum
     ada.
  3. Kalau nanti ini benar jadi masalah (multi-tenant SaaS beneran jalan, Phase 11+),
     "pustaka spesifikasi bersama" bisa ditambah **di atas** tabel yang sama (mis. seed
     umum yang di-drop ke semua tenant) tanpa migrasi ulang — jadi menunda keputusan
     ini tidak membuang kerja sekarang.

## 2. Desain

### A. Katalog device (schema, diperluas — bukan tabel baru)
- `device_models` (`db/schema/product_catalog.ts`) += `imageUrl` (text, URL — bukan
  upload file; PLT-009 file storage belum dibangun, jangan mendahuluinya),
  `specs` (jsonb, `Record<string,string>` bebas — "RAM": "12GB", dst, meniru pola
  key-value legacy tapi tanpa daftar field tetap yang kaku), `suggestedServices`
  (jsonb, `string[]` — daftar servis umum, klik → isi ke Keluhan/Kerusakan).
- `customer_assets` += `deviceModelId` (uuid, nullable, FK → `device_models.id`) —
  diisi kalau intake match ke katalog; tetap `null` untuk device yang belum ada di
  katalog (entri manual apa adanya, TIDAK dipaksa harus match — sama semangatnya
  dengan `unresolvedCompatibility` yang sudah ada untuk kasus kompatibilitas sparepart
  yang tidak ketemu).

### B. CRUD katalog (baru — sebelumnya deviceBrands/deviceModels HANYA bisa dibuat
  lewat seed, tidak ada endpoint sama sekali)
- `routes/device-catalog.ts` (baru, top-level `/v1/device-catalog`, dipakai baik
  Inventory maupun Tickets jadi bukan sub-resource salah satu):
  - `GET /brands` — list merk + model bersarang, tenant-scoped, terbuka untuk semua
    user login (dibutuhkan saat intake).
  - `POST /brands` — admin-only (`inventory.manage_items`, gate yang sama dengan
    endpoint kompatibilitas yang sudah ada).
  - `GET /models?q=` — pencarian brand+model untuk autocomplete intake.
  - `POST /models`, `PATCH /models/:id` — admin-only, termasuk field baru.

### C. Intake & tampilan tiket
- `IntakeForm.svelte`: brand/model tetap text input bebas (tidak mengubah perilaku
  device yang belum dikatalogkan), + autocomplete di bawahnya yang mencari
  `GET /device-catalog/models?q=`. Pilih hasil → `deviceModelId` terisi + kartu
  kecil gambar/spesifikasi/saran-servis muncul; klik saran servis → tambah teks ke
  textarea Keluhan/Kerusakan (bukan bikin baris biaya baru — servis "dideteksi"
  cuma bantu tulis keluhan, bukan mesin pricing, sesuai SVC-003 yang memang 🟡
  Phase 2/bukan MVP).
- `GET /v1/tickets/:id` — asset join diperluas leftJoin ke `device_models` supaya
  `TicketWorkspace` bisa tampilkan gambar/spesifikasi tanpa request tambahan.

### D. Mode tampilan invoice
- `tenants.settings` (jsonb yang sudah ada, sudah dipakai untuk
  `simplifiedFinanceMode`) += `invoiceDisplayMode: 'detailed' | 'summary' | 'flexible'`,
  default `'detailed'` kalau key tidak ada — TIDAK butuh kolom/tabel baru.
- `modules/printer/render.ts`'s `buildDocumentData()` sekarang SELALU juga
  menghitung `summaryItems` (satu baris gabungan: deskripsi "`<n>` item/jasa",
  qty 1, harga = subtotal gabungan) di samping `items` (rincian penuh, perilaku
  lama tidak berubah). Murni derivasi dari `bundle.lines`, tidak sadar tenant
  setting — konsisten dengan tanggung jawab file ini (transformasi data,
  bukan resolusi setting).
- `modules/printer/document.ts`'s `renderPosInvoiceDocument` (satu-satunya
  pemanggil yang sudah fetch `invoice.tenant`) yang resolve
  `displayMode` dari `tenant.settings.invoiceDisplayMode`, set `data.displayMode`,
  dan — KHUSUS untuk cetak thermal — pilih `summaryItems` kalau mode `'summary'`
  sebelum panggil `renderThermalBlocks` (kertas dicetak sekali, tidak interaktif;
  `'flexible'` default ke Detailed di kertas, sesuai mockup "Default View:
  Detailed"). A4 (HTML, FE yang render, spec rule 2) menerima KEDUANYA
  (`items` + `summaryItems`) dan boleh toggle di klien kalau `displayMode==='flexible'`
  — ini bukan pelanggaran D1 (aturan D1 soal alignment KERTAS THERMAL, A4 memang
  sudah domain FE).
- Tab Settings baru "Penjualan" (`?tab=sales`) — radio Detailed/Summary/Flexible,
  admin-only (`settings.manage_company`, setara dengan tab Perusahaan — satu
  setting kecil, tidak perlu permission baru).

## 3. Di luar scope (dicatat agar tak dikira lupa)
- Upload gambar device (file storage) — tetap image-by-URL, PLT-009 belum dibangun.
- "Saran servis" sebagai mesin pricing otomatis (auto-tambah baris biaya) — cuma
  bantu isi teks keluhan, bukan quotation engine.
- Panel pratinjau invoice besar seperti di mockup (contoh visual Detailed vs
  Summary side-by-side) di halaman Settings — cukup pilihan + penjelasan singkat;
  pratinjau sungguhan sudah ada di alur Cetak (`PrintButton`/`A4Invoice`) itu sendiri.
- Katalog device bersama lintas-tenant — didokumentasikan di atas sebagai keputusan
  ditunda, bukan dilupakan.

## 4. Task breakdown
- [x] BE: schema `device_models` (+imageUrl/specs/suggestedServices), `customer_assets`
      (+deviceModelId), migrasi via `db:reset`.
- [x] BE: `routes/device-catalog.ts` (brands+models CRUD, search) + mount di `app.ts`.
- [x] BE: intake terima `deviceModelId` opsional; `GET /:id` join katalog.
- [x] BE: `render.ts` summaryItems; `document.ts` resolve `displayMode` dari tenant
      settings; `types.ts` field baru.
- [x] BE: `routes/settings.ts` — GET/PATCH `/v1/settings/sales`.
- [x] BE: seed — tambah imageUrl/specs/suggestedServices ke beberapa model yang
      sudah ada (Samsung Galaxy A10, dst) supaya ada data nyata untuk didemokan.
- [x] FE: halaman admin katalog device (Inventory sub-page) — CRUD merk+model,
      form gambar (URL)/spesifikasi key-value/saran servis.
- [x] FE: `IntakeForm.svelte` — autocomplete brand/model ke katalog, kartu
      gambar/spesifikasi, klik saran servis → isi keluhan.
- [x] FE: `TicketWorkspace.svelte` — tampilkan gambar/spesifikasi kalau
      `asset.deviceModelId` ada.
- [x] FE: tab Settings "Penjualan" (Detailed/Summary/Flexible).
- [x] FE: `A4Invoice.svelte` — toggle Detailed/Summary saat `displayMode==='flexible'`.
- [x] Test: backend unit (render.ts summaryItems, device-catalog service) +
      Playwright (katalog CRUD, intake autocomplete→catalog card→saran servis,
      invoice mode setting → tercermin di cetak).
- [x] Verifikasi: `tsc`, `svelte-check`, `vitest`, Playwright full suite.
- [x] Commit + update dokumen ini jadi SELESAI.
