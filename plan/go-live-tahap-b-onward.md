# FlowServ — Rencana Lanjutan Go-Live (Tahap B dan seterusnya)

> **Dibuat 2026-07-25.** Peta kerja untuk **melanjutkan pembangunan setelah Tahap A selesai**.
> Induk: [`plan/go-live-plan.md`](go-live-plan.md). `PHASES.md` tetap sumber kebenaran status
> per-task; dokumen ini adalah peta prioritas di atasnya.
>
> **Dua keputusan dasar (dikonfirmasi pemilik 2026-07-25):**
> 1. **Branch dasar = `go-live/tahap-a`** (line kerja `oqqinawa` di GitHub). Branch lokal
>    `golive/a-service-flow-templates` (pendekatan 1-template + `serviceMode`) dianggap
>    **superseded** — tidak dilanjutkan. Alasan: `go-live/tahap-a` lebih lengkap (2 flow
>    template + katalog device + invoice mode), lebih baru, lebih banyak test, dan sudah di
>    GitHub sebagai line kanonik.
> 2. **Strategi go-live = pilot 1 cabang dulu.** "Pisah data per cabang" (Tahap C) **ditunda**
>    sampai pilot 1 cabang berhasil. Ini menghemat perubahan besar & berisiko di awal.
>
> **Definition of Done tetap berlaku** (lihat `PHASES.md`): sebuah item hanya `[x]` bila ada
> tes lulus / request+response terekam / click-path yang benar-benar dijalankan.

---

## 1. Posisi sekarang (terverifikasi 2026-07-25)

Branch `go-live/tahap-a` = **17 commit di depan `origin/main`** dan **sudah memuat seluruh
`phase-6/printer`** (dicek: `phase-6/printer` adalah ancestor). Jadi branch ini berisi
**semua** kerja terkini:

| Blok | Status |
|---|---|
| Phase 1–5 (fondasi, auth, RBAC, ledger, purchasing, margin, UI polish) | ✅ (di `main`) |
| Phase 6 — Printer (agent Python, scan-and-pick, test-print, render) | ✅ kode selesai; **6D.1 test cetak fisik masih tertunda** (butuh hardware) |
| Tahap A #2 — 2 flow template servis (Ditunggu/Disimpan) + sandi/pola | ✅ SELESAI |
| Tahap A #3 — Pemicu cetak (label / tanda terima / nota) + field keluhan | ✅ SELESAI |
| Tahap A #4 — CRUD metode pembayaran (e-wallet Dana/OVO/GoPay) | ✅ SELESAI |
| Ekstra — Katalog device (gambar/spesifikasi/saran) + invoice display mode | ✅ SELESAI |
| **Tahap A #5 — Change Order (konfirmasi ulang harga)** | ✅ SELESAI 2026-07-25 (data layer sudah dukung; framing UI + verifikasi ditambahkan — lihat B1) |
| Tier-1 #1 — Pisah data per cabang | ⏸️ **Ditunda** (keputusan pilot 1 cabang) |

**Baseline test (klaim dokumen Tahap A):** ±201 backend unit + 99 Playwright + 42 pytest agent.
Angka ini **wajib diverifikasi ulang** (`npx vitest run`, `npm run test:e2e`, `npm run test`
di web, pytest agent) sebelum langkah Milestone 0 di bawah, supaya baseline benar-benar hijau
sebelum menambah kerja baru.

---

## 2. Prinsip urutan

Target bukan mengejar ~170 fitur. Target = FlowServ **cukup matang untuk dipakai harian di 1
cabang** menggantikan `pos_sederhana`, lalu diperbaiki dari pemakaian nyata (ini persis Phase
9–10 di `PHASES.md`). Karena itu urutan di bawah **mendahulukan "siap dipakai" ketimbang
"fitur lengkap"**.

> **Prinsip fondasi (keputusan pemilik 2026-07-25):** *fondasi dulu, hiasan belakangan.*
> Bagian inti (alur/flow servis, data) harus kokoh & sederhana dulu; fitur opsional yang
> "mewah" (gambar device di intake, alur-alur tambahan) ditambahkan **setelah** dasarnya benar.
> Kalau terus menambah hiasan, tidak akan pernah selesai. Konsekuensi konkret: intake tiket
> **teks saja** (lihat Milestone B0).

1. **Milestone 0** — konsolidasi branch (jadikan `main` benar lagi).
2. **Milestone B1** — tutup satu sisa Tier-1: **Change Order**.
3. **Milestone B2** — **Siap Pilot** (deployment LAN + onboarding data). Ini yang benar-benar
   membuka Tahap B.
4. **Milestone D** — aturan kasir yang sudah pasti dibutuhkan (tempo per pelanggan, batas
   diskon, retur) — diurut per risiko, sebagian menunggu gesekan pilot.
5. **Milestone C** — pisah data per cabang + multi-role (sebelum roll-out semua cabang).
6. **Milestone E** — Phase 8 (komisi teknisi, QC, foto, waiting-parts, WA) — setelah operasional stabil.

---

## 2b. Milestone B0 — Rampingkan device catalog + intake teks-saja ✅ *(selesai 2026-07-25, sebelum merge ke main)*

**Latar:** branch `go-live/tahap-a` membawa **~44 MB aset** untuk fitur katalog device —
padahal dua kebutuhan nyata pemilik (autocomplete intake + kompatibilitas sparepart) cukup
dilayani **data specs 792 KB**. Keputusan pemilik: **opsi (a)** — data specs tetap, foto lepas
dulu, ditambahkan on-demand nanti. Waktu terbaik = **sebelum merge ke `main`**, supaya history
`main` tak ikut membawa binari besar.

- [x] **B0.1** Hapus dari git: seluruh foto katalog `flowserv-api/public/uploads/**` (~30 MB,
      1.828 file) + 10 file test-upload nyasar di root uploads (~11 MB) + `devices_export.xlsx`
      (3.4 MB, importer tak membacanya). `uploads/` dipertahankan lewat `.gitkeep`.
      **Total 1.828 file terhapus dari tree.**
- [x] **B0.2** `.gitignore`: `flowserv-api/public/uploads/*` (kecuali `.gitkeep`) + `seed/data/*.xlsx`
      — supaya upload runtime & xlsx tak ke-commit lagi.
- [x] **B0.3** Seed bulk importer (`import-device-catalog.ts`) set `imageUrl: null` (specs tetap
      penuh). Seed kurasi `02-catalog.ts` (Galaxy A10 / iPhone X, pakai URL eksternal, dipakai
      test) tak disentuh.
- [x] **B0.4** Intake **teks saja**: hapus `<img>` dari `IntakeForm.svelte` &
      `TicketWorkspace.svelte` (autocomplete model + specs teks + chip saran-servis tetap).
- **Verifikasi:** `npx tsc --noEmit` (api) bersih; `npx svelte-check` 735 file 0 error;
      `npm run db:reset` sukses (seed jalan tanpa foto); cek DB: model kurasi tetap punya
      specs+URL eksternal, jalur bulk-import → `imageUrl` null. **Belum di-commit** (menunggu
      keputusan pemilik). *Playwright device-catalog spec belum di-run ulang — perlu start dev
      stack; risiko rendah karena test meng-assert specs+chip, bukan gambar intake.*
- **Catatan history/ukuran repo:** menghapus di commit baru **tidak** mengecilkan `.git`
      (foto masih di commit `b8f4177` yang sudah ter-push). Untuk benar-benar bersih di `main`:
      **squash-merge** `go-live/tahap-a` → `main` di Milestone 0 (main tak akan membawa binari),
      lalu hapus branch `go-live/tahap-a` + `git gc`. Alternatif `git filter-repo` (rewrite +
      force-push) lebih mengganggu — tidak direkomendasikan.
- **Yang TETAP dipertahankan** (infra "tambah gambar nanti"): route `uploads.ts`,
      `ImageUpload.svelte`, `utils/image.ts`, halaman `/devices`. Jadi owner tetap bisa menambah
      foto per model kapan pun tanpa membangun ulang apa pun.

---

## 3. Milestone 0 — Konsolidasi branch *(housekeeping, dulukan)*

**Masalah:** `main` tertinggal 17 commit; kerja nyata semua ada di `go-live/tahap-a`. Selama
`main` ≠ kerja nyata, git workflow proyek ("merge ke main setelah fase terverifikasi") rusak.

- [x] **0.1** Baseline hijau (2026-07-26): backend **212 unit**, printer-agent **42 pytest**,
      `svelte-check` **738 file 0 error**, `tsc` bersih, feature e2e (pattern/label/print-triggers/
      change-order/tempo/device-catalog) lulus.
- [x] **0.2** **Squash-merge `go-live/tahap-a` → `main` selesai 2026-07-26** (commit `c4fcb2e`,
      27 commit → 1). `git diff main go-live/tahap-a` KOSONG (tree identik, tak ada yang hilang);
      `main` bebas foto 44MB (hanya terjangkau dari `go-live/tahap-a`). Sudah di-push ke origin.
      Branch kerja baru **`go-live/tahap-b`** dibuat dari `main` (0.3). **Belum:** hapus
      `go-live/tahap-a` (local+remote) + `git gc` — ditahan, perlu konfirmasi pemilik (langkah
      irreversible; history granular ada di sana).
- [ ] **0.2-orig** ~~Merge `go-live/tahap-a` → `main` — **squash-merge direkomendasikan** (lihat B0):~~
      supaya history `main` tak membawa ~44 MB foto yang sudah dihapus di working tree tapi masih
      ada di commit `b8f4177`. Phase 6 (kode) + Tahap A dua-duanya sudah terbukti; **6D.1 (cetak
      fisik) adalah checklist hardware yang dijalankan user, bukan gerbang kode** — jadi tidak
      menahan merge. Setelah merge, `main` kembali jadi kebenaran; lalu hapus `go-live/tahap-a`
      (local+remote) + `git gc` untuk melepas blob binari.
- [x] **0.3** Branch kerja baru **`go-live/tahap-b`** dibuat dari `main` (2026-07-26). Kerja
      Milestone berikutnya (D2/B2/dst) di sini.
- [ ] **0.4** Update `PHASES.md`: tandai Phase 6 6A–6C `[x]` (sudah), catat Tahap A di bagian
      go-live, dan perbarui "Current Phase" agar tidak lagi berkata "Phase 6 IN PROGRESS" tanpa
      konteks go-live.

> **Keputusan untuk pemilik (Milestone 0):** merge ke `main` **sekarang** (rekomendasi — Phase 6
> kode + Tahap A sudah matang) **vs** tahan sampai 6D.1 (cetak fisik) benar-benar dijalankan di
> printer asli. Rekomendasi: merge sekarang, jalankan 6D.1 sebagai bagian Milestone B2.

---

## 4. Milestone B1 — Change Order ✅ *(selesai 2026-07-25 — sisa Tier-1 terakhir ditutup)*

**Kenapa:** satu-satunya item Tier-1 yang belum ditutup di branch ini. Bagian nyata alur
pemilik: saat pembongkaran ketemu kerusakan tambahan → **konfirmasi ulang harga** → setuju →
lanjut.

**Terbukti:** `addCharge()` + `generateQuotation()` (`modules/tickets/service.ts`) **sudah
repeatable** — siklus quote kedua membuat baris `approval_requests` baru untuk selisih charge-nya
saja, `service_tickets.approvedTotal` menumpuk benar. Tidak ada node-guard yang menghalangi
re-quote mid-repair (`addCharge` cuma cek tiket ada; `generateQuotation` cuma butuh charge
`estimated`). "Change order" **sudah didukung di lapisan data** — yang kurang cuma framing UI.

- [x] **B1.1** Live-verify di `go-live/tahap-a` (curl, terekam): intake → jasa 100rb → quote #1
      (`quotedAmount=100.000`, `approvedTotal=100.000`, approvalReq `448d5282`) → tambah temuan
      250rb → quote #2 (`quotedAmount=250.000` **hanya delta**, `approvedTotal=350.000`
      **kumulatif**, approvalReq **baru** `e64235b6`). Dua baris `approval_requests` benar, tak
      ada korupsi.
- [x] **B1.2** Framing UI di `TicketCharges.svelte`: begitu tiket sudah pernah di-quote DAN ada
      biaya estimasi baru, muncul panel amber **"Temuan Baru (Change Order)"** yang menjelaskan
      pelanggan hanya menyetujui biaya tambahan, menampilkan delta + total-disetujui-baru, dengan
      tombol **"Minta Persetujuan Tambahan"** (= `requestApproval()` yang sama). Saat sudah
      di-quote tapi belum ada temuan baru, ditambah hint discoverability yang menyebut jalur
      change-order. 2 Playwright test (desktop: panel muncul, delta 250rb + total 350rb, approve →
      disetujui 350rb; mobile: tak overflow). **Cetak-ulang Label/Tanda Terima sengaja TIDAK
      ditambahkan** — kedua dokumen itu tak memuat harga (label = keluhan+sandi, tanda-terima =
      bukti terima), jadi tombol "cetak ulang isi harga baru" akan menyesatkan (anti-pattern
      Track-F "kelihatan jalan, tak berarti"). Nota (yang memuat harga) sudah tercetak dari
      invoice di akhir alur, memakai `approvedTotal` kumulatif yang benar.
- [x] **B1.3** Tidak ada celah flow: re-quote tetap bisa di node mana pun (tak ada guard). Tak
      ada keputusan flow yang perlu didiskusikan — data layer sudah menangani change order utuh.

---

## 5. Milestone B2 — Siap Pilot (deployment LAN + onboarding) *(🔴 pembuka Tahap B)*

**Ini yang benar-benar memulai Tahap B.** Tanpa ini, aplikasi tidak bisa dipakai staf di cabang.
Sebagian dari Phase 9 (`PHASES.md` 9.7–9.9) + Phase 10.5, dipilih yang relevan untuk 1 cabang.

### Deployment jaringan lokal
- [x] **B2.1 ✅ (2026-07-26).** API sekarang bind `0.0.0.0` secara **eksplisit** (`HOST` env,
      default `0.0.0.0`) di `index.ts`, dan mencetak URL LAN saat start
      (`LAN: http://<ip>:3001/v1/health`). Terbukti: API menjawab di `http://172.20.10.3:3001`
      (IP LAN mesin ini), bukan cuma localhost — jadi Node memang sudah bind semua interface,
      kini eksplisit + terlihat. *(DoD "login dari HP" = user-run di mesin pilot dengan HP nyata.)*
- [x] **B2.2 ✅ (2026-07-26).** `lib/api/config.ts` baca `PUBLIC_API_URL` (client-side); default
      localhost, di-set ke `http://<ip-LAN>:3001` untuk LAN. Peluncur B2.3 meng-**auto-set**-nya
      ke IP LAN + jalankan `vite dev --host` supaya HP bisa memuat web DAN memanggil API di IP
      LAN (bukan localhost HP). `.env.example` web sudah mendokumentasikan ini. *(DoD "aksi API
      dari HP" = user-run.)*
- [x] **B2.3 ✅ (2026-07-26).** **`start-flowserv.bat`** (+ `start-flowserv.ps1`): satu double-
      click → deteksi IP LAN → buka 3 jendela (API 0.0.0.0:3001, Web `vite --host` dengan
      `PUBLIC_API_URL` diarahkan ke IP LAN, Printer Agent `dist/printer-agent.exe`), cek Postgres
      (peringatan bila mati), lalu cetak URL untuk HP (`http://<ip>:5173`). Postgres tetap servis
      Windows (tak ikut diluncurkan, hanya dicek). `start-dev.bat` lama dipertahankan sebagai
      peluncur dev minimal (API+web saja). Diverifikasi: `.ps1` lolos parse, deteksi IP → real
      `172.20.10.3`, `tsc` bersih, log startup API tampil benar. *(DoD "keempat proses hidup" =
      user-run di mesin pilot — skripnya siap.)*
- [ ] **B2.4** **6D.1 — Test cetak fisik** (Phase 6): jalankan di printer thermal + printer label
      asli. Struk POS (thermal), label unit servis (label), tanda terima, nota A4. Ini
      **hardware-dependent, dijalankan pemilik**. *(DoD: kertas benar-benar tercetak & terpotong;
      checklist di `printer-agent/README.md`.)*

### Onboarding data nyata
- [ ] **B2.5** Set data master cabang pilot: 1 tenant, 1 cabang, user + peran nyata (kasir/
      teknisi/owner sesuai orang asli), metode pembayaran (sudah ada seed 7 metode).
      *(DoD: login tiap peran nyata berhasil, menu sesuai peran.)*
- [ ] **B2.6** **Onboarding stok asli** — ini inti masalah pemilik ("stok berantakan"). Masukkan
      item + batch awal (goods receipt) sesuai stok fisik. Manfaatkan **bulk-import katalog device
      dari data legacy** yang sudah dibangun (`tahap-a-device-catalog`). *(DoD:
      `GET /inventory/reconciliation` bersih setelah input; stok layar = stok fisik.)*
- [x] **B2.7 ✅ (2026-07-26).** `backup-db.bat` (+ `backup-db.ps1`): baca `DATABASE_URL` dari
      `.env`, `pg_dump -Fc` → `backups/flowserv-<timestamp>.dump`, prune > 14 hari. Cari `pg_dump`
      di PATH lalu folder instalasi PostgreSQL. `backups/` di-gitignore (dump tak pernah di-commit).
      Instruksi jadwal harian (`schtasks`) + cara restore ada di header skrip. **DoD terpenuhi
      penuh:** backup nyata dibuat (215 KB), lalu **tes restore ke DB kosong** (`flowserv_restore`)
      → `pg_restore` exit 0, data utuh (customers=9, inventory_items=2, permissions=28), DB
      throwaway di-drop. *(Menjadwalkan lewat Task Scheduler = langkah user di mesin pilot.)*

> **Catatan keamanan (tidak menahan pilot LAN, tapi dicatat):** `JWT_SECRET` fallback hardcoded
> di `middleware/auth.ts` dan jalur password SHA-256 lama di `routes/auth.ts` **wajib dibereskan
> sebelum Phase 11 (VPS)**, tapi untuk pilot LAN tertutup masih aman. Jangan lupa saat naik ke VPS.

---

## 6. Milestone D — Aturan kasir *(Tier-2, diurut per risiko)*

Per `go-live-plan.md` sebagian ini "dari gesekan pilot", tapi tiga di bawah sudah **pasti
dibutuhkan** (pemilik sebut eksplisit) — boleh dibangun paralel dengan pilot, diurut dari yang
paling aman:

- [x] **D1 — Tempo per pelanggan ✅ (selesai 2026-07-26).** Kolom `customers.allow_tempo`
      (boolean, default **false** — pelanggan baru tak boleh utang sampai diizinkan). Gerbang
      murni `lib/tempo.ts` `evaluateTempoEligibility()` (4 unit test) dipasang di checkout POS
      (`routes/pos/invoices.ts`): metode `tempo` untuk pelanggan tak-berhak → **422
      TEMPO_NOT_ALLOWED**, metode lain selalu lolos. FE: checkbox "Boleh bayar tempo" di modal
      buat-pelanggan + kartu toggle beri/cabut di halaman detail pelanggan (optimistic update,
      2 Playwright test). Verifikasi live (curl, terekam): tak-berhak → 422; PUT allowTempo=true
      → 200; berhak → 201 (paymentStatus `unpaid`); cash tetap 201. `tempo_limit` sengaja
      **belum** ditambah — enforcement plafon butuh hitung AR outstanding per pelanggan; menambah
      kolom tanpa enforcement = dead-schema, jadi ditunda sampai ada kebutuhan nyata. *DoD
      terpenuhi.* **Catatan floating gap ditemukan (bukan D1):** `+page.server.ts` daftar &
      detail pelanggan pakai `fetch` global + `new State(data)` yang meng-capture data awal, jadi
      `invalidateAll()` tak me-refresh in-place (customer baru baru tampak setelah navigasi ulang;
      toggle diselamatkan optimistic override). Pola app-wide, layak dirapikan tersendiri.
- [x] **D2 — Batas diskon per peran ✅ (selesai 2026-07-26, pendekatan interim).** Permission
      baru `pos.apply_discount` (granted Manager + Super Admin, **bukan** Cashier). Digate
      **kondisional**: hanya saat `discountAmount > 0` — kasir tetap bisa checkout diskon 0.
      Dipasang di dua write-site: `POST /pos/invoices` (checkout) & `POST /tickets/:id/invoice`
      (faktur servis), lewat `enforcePermission()` baru di `middleware/rbac.ts` (membungkus logika
      `requirePermission` yang sama supaya bisa dipanggil di dalam handler). FE: kolom "Diskon"
      di `CartSidebar` disembunyikan untuk peran tanpa hak (kasir tak melihatnya; backend tetap
      403 kalau dipaksa). Verifikasi live (curl, RBAC_MODE=enforce): kasir diskon 5rb → **403
      PERMISSION_DENIED**, kasir diskon 0 → **201**, manager diskon 5rb → **201**. 2 Playwright
      (kasir tak lihat kolom, manager lihat). `tsc`+`svelte-check` bersih, backend 212 unit.
      **Catatan penting go-live:** gate ini (dan SEMUA gate RBAC) hanya benar-benar memblokir
      saat `RBAC_MODE=enforce`. `.env` lokal tadinya `report` — sudah di-set `enforce` (state yang
      memang dibutuhkan pilot). Break-glass: balik ke `report` bila perlu (lihat CLAUDE.md).
      *"Plafon" numerik (diskon boleh sampai X%) sengaja ditunda — interim ini biner (boleh/tidak),
      cukup untuk pilot; plafon per-peran menyusul bila pemilik butuh kasir boleh diskon kecil.*
- [ ] **D3 — Retur / tukar barang (🟡, paling berisiko — hati-hati).** Stok balik + reversal
      ledger (SAL-005). Salah bikin = stok & uang kacau. **Sebaiknya SETELAH pilot menunjukkan
      bentuk retur nyata**, bukan menebak sekarang. *(DoD: retur → stok naik tepat qty, ledger
      reversal seimbang, rekonsiliasi bersih.)*

---

## 7. Milestone C — Siap multi-cabang *(Tahap C — ditunda, tapi direncanakan)*

**Ditunda atas keputusan pilot 1 cabang.** Baru dikerjakan sebelum roll-out ke semua cabang.
Dicatat di sini agar tak hilang; **jangan mulai sebelum pilot 1 cabang sukses.**

- [ ] **C1 — Pisah data per cabang.** JWT bawa `branchId` (sekarang **tidak** — terverifikasi:
      `auth.ts` tak menyentuh `branchId`); hampir semua query tambah filter cabang; kasir Cabang A
      tak lihat/ubah data Cabang B. **Perubahan besar & berisiko** (auth + ~semua query) → butuh
      tes menyeluruh. Ini alasan terkuat memilih pilot 1 cabang dulu.
- [ ] **C2 — Multi-role fleksibel per cabang** + (opsional) switcher peran di layout. Petugas
      per cabang beda-beda (kadang serba bisa, kadang terpisah).

---

## 8. Milestone E — Phase 8 *(ditunda — setelah operasional stabil)*

Semua bisa manual dulu; membangun sekarang = menunda go-live tanpa manfaat sepadan.

- [ ] **E1** Gaji/komisi teknisi campuran (`pay_type`: `commission` + `monthly_salary`) —
      TECH-011. **Percuma sebelum ada data servis nyata dari pilot.** Requirement §5.1.
- [ ] **E2** Checklist QC awal/akhir (HP nyala, kembalikan pola) — TECH-008. Node QC sudah ada
      (placeholder struktural dari Tahap A); tinggal isi form checklist bila dibutuhkan.
- [ ] **E3** Foto/lampiran unit (before/after) — PLT-009. Butuh infra storage (belum ada).
- [ ] **E4** Waiting-parts + talangan — TECH-005/006. Cukup status "ditunda" manual dulu.
- [ ] **E5** Notifikasi WA otomatis — Phase 2 (12.3). Manual dulu.

---

## 9. Ringkasan urutan kerja

```
Milestone 0  Konsolidasi branch → main            [housekeeping, dulukan]
Milestone B1 Change Order                          ✅  (sisa Tier-1 — SELESAI 2026-07-25)
Milestone B2 Siap Pilot: deploy LAN + onboarding   🔴  (buka Tahap B) ── PILOT 1 CABANG MULAI
Milestone D  Tempo → Batas diskon → Retur          🟡  (paralel/menyusul pilot)
Milestone C  Pisah cabang + multi-role             ⏸️  (sebelum roll-out semua cabang)
Milestone E  Komisi/QC/foto/waiting-parts/WA       🟢  (Phase 8, setelah stabil)
```

**Jalur kritis menuju "dipakai harian" = Milestone 0 → B2.** B1 dan D bisa jalan berdampingan
dengan pilot. C dan E sengaja ditunda.

---

## 10. Keputusan yang masih terbuka (untuk pemilik)

1. **Milestone 0:** merge `go-live/tahap-a` → `main` **sekarang** (rekomendasi) vs tahan sampai
   6D.1 cetak fisik dijalankan.
2. **Nasib branch lokal `golive/a-service-flow-templates`:** hapus (superseded) vs simpan sebagai
   arsip. Rekomendasi: simpan sebentar sampai yakin tak ada potongan unik yang perlu diambil,
   lalu hapus.
3. **Langkah pertama konkret setelah dokumen ini:** B1 (Change Order) dulu, atau langsung B2
   (siapkan deployment + onboarding) karena itu yang benar-benar membuka pemakaian nyata?
   Rekomendasi: **B2 lebih dulu** (biar cepat dipakai & stok mulai beres), B1 menyusul cepat.
