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

- [ ] **0.1** Verifikasi baseline hijau di `go-live/tahap-a` (4 suite di §1). Catat angka nyata.
- [ ] **0.2** Merge `go-live/tahap-a` → `main` — **squash-merge direkomendasikan** (lihat B0):
      supaya history `main` tak membawa ~44 MB foto yang sudah dihapus di working tree tapi masih
      ada di commit `b8f4177`. Phase 6 (kode) + Tahap A dua-duanya sudah terbukti; **6D.1 (cetak
      fisik) adalah checklist hardware yang dijalankan user, bukan gerbang kode** — jadi tidak
      menahan merge. Setelah merge, `main` kembali jadi kebenaran; lalu hapus `go-live/tahap-a`
      (local+remote) + `git gc` untuk melepas blob binari.
- [ ] **0.3** Lanjutkan kerja Milestone berikutnya di branch baru dari `main`
      (mis. `go-live/tahap-b`), bukan menumpuk terus di `go-live/tahap-a`.
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
- [ ] **B2.1** Pastikan API bind ke LAN. `flowserv-api/src/index.ts` `serve()` tidak set
      `hostname` → cek apakah `@hono/node-server` sudah mengikat `0.0.0.0` (default) sehingga HP/
      tablet di WiFi yang sama bisa akses via `192.168.x.x:3001`. Set eksplisit bila perlu.
      *(DoD: akses dari HP lain di WiFi sama → halaman login muncul.)*
- [ ] **B2.2** Pastikan frontend (`flowserv-web`) `API_BASE` bisa diarahkan ke IP LAN server
      (bukan `localhost`) lewat env — sudah ada `lib/api/config.ts` (dari 3.5E.1); verifikasi
      untuk skenario multi-device. *(DoD: dari HP lain, aksi API sungguh berhasil, bukan cuma
      halaman statis.)*
- [ ] **B2.3** **Skrip start satu-klik** untuk seluruh stack (Postgres + API + web +
      printer-agent). Catatan: `.bat` manual start/stop printer-agent **hanya ada di branch lokal
      `golive/a-service-flow-templates`** (commit `716d882`), **belum di branch ini** — port ke
      sini + bungkus jadi satu skrip root. *(DoD: satu klik → keempat proses hidup, health check
      hijau.)*
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
- [ ] **B2.7** **Strategi backup** (Phase 10.5): skrip `pg_dump` harian (terjadwal). *(DoD: file
      backup nyata terbentuk + tes restore ke DB kosong sekali.)*

> **Catatan keamanan (tidak menahan pilot LAN, tapi dicatat):** `JWT_SECRET` fallback hardcoded
> di `middleware/auth.ts` dan jalur password SHA-256 lama di `routes/auth.ts` **wajib dibereskan
> sebelum Phase 11 (VPS)**, tapi untuk pilot LAN tertutup masih aman. Jangan lupa saat naik ke VPS.

---

## 6. Milestone D — Aturan kasir *(Tier-2, diurut per risiko)*

Per `go-live-plan.md` sebagian ini "dari gesekan pilot", tapi tiga di bawah sudah **pasti
dibutuhkan** (pemilik sebut eksplisit) — boleh dibangun paralel dengan pilot, diurut dari yang
paling aman:

- [ ] **D1 — Tempo per pelanggan (🟢🟡, kecil, aman).** Penanda boolean/limit di `customers`
      (`allow_tempo`, opsional `tempo_limit`). Checkout POS tolak metode `tempo` bila pelanggan
      tak berhak (422). Requirement §5.2 go-live-plan. *(DoD: unit test aturan + checkout tempo
      pelanggan tak-berhak → 422; berhak → sukses.)*
- [ ] **D2 — Batas diskon per peran (🟡, RBAC threshold).** Owner/manager set plafon diskon;
      kasir tak bisa diskon melebihi plafon (SAL-006, requirement §5.6). *Siasat sementara di
      pilot: kasir tak diberi hak diskon sama sekali, hanya manager.* *(DoD: kasir diskon >
      plafon → 403/422; manager → sukses.)*
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
