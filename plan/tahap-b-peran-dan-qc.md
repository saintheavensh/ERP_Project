# Tahap B — Perbaikan Peran, Halaman Tiket per Peran, dan QC

> **Dibuat 2026-07-31.** Branch kerja: `go-live/tahap-b`.
> Induk: [`go-live-tahap-b-onward.md`](go-live-tahap-b-onward.md).
> `PHASES.md` tetap sumber kebenaran status per-task; dokumen ini rencana di atasnya.
>
> **Aturan Definition of Done tetap berlaku:** sebuah task hanya `[x]` bila ada tes lulus /
> request+response terekam / click-path yang benar-benar dijalankan. "Kodenya sudah ditulis
> dan kelihatan benar" **bukan** selesai.

---

## 0. Temuan terverifikasi (dibaca dari kode, 2026-07-31)

Tiga hal yang pemilik laporkan **semuanya nyata**, dan penyebabnya bukan yang terduga.
Ini dicatat lebih dulu supaya perbaikannya menyasar sebab, bukan gejala.

### T1 — Kasir memang tidak bisa membuat tiket servis (dua lapis sekaligus)

**Lapis 1 — izin.** `flowserv-api/src/db/seed/01-core.ts` baris ~102:

```ts
[IDS.roleCashier]: [
  'pos.process_payment',
  'customer.manage',
],
```

Kasir **tidak punya `ticket.create`**. Endpoint `POST /v1/tickets/intake` digerbangi
`requirePermission('ticket.create')` → kasir dapat **403 PERMISSION_DENIED**.

**Lapis 2 — menu.** `flowserv-web/src/routes/(app)/+layout.svelte` baris 90–96: menu Cashier
hanya `Beranda / Kasir / Katalog Produk`. Tidak ada "Servis", jadi `/tickets/intake` bahkan
tak terjangkau untuk dicoba.

**Yang membuat ini penting:** `modules/flow/backbone.ts` mendeskripsikan tahap Intake
sebagai *"**Kasir** mencatat nama, nomor telepon, dan keluhan pelanggan"*. Jadi kode alur
dan katalog izin **saling bertentangan sejak awal** — bukan regresi baru.

### T2 — Teknisi tak pernah melihat tiket yang belum bertuan

Endpoint dan tombolnya **sudah benar**:
- `POST /v1/tickets/:id/claim` digerbangi `ticket.diagnose` → Technician **punya** izin itu.
- Tombol "Ambil Pekerjaan" di `TicketWorkspace.svelte` baris 225 muncul saat
  `!assignedTechnician && status === 'open'` → kondisinya juga benar.

Yang salah ada di **daftar tiket**. `flowserv-web/src/routes/(app)/tickets/+page.server.ts`
baris 13–16:

```ts
const isTechnician = locals.user?.roleName === 'Technician';
const url = isTechnician ? '.../v1/tickets?assignedTo=me' : '.../v1/tickets';
```

Teknisi **hanya** melihat tiket yang sudah ditugaskan kepadanya. Tiket yang belum bertuan
tidak muncul di daftar mana pun → halaman detailnya tak terjangkau → tombol "Ambil
Pekerjaan" tak pernah bisa ditekan. Beranda teknisi (`(app)/+page.server.ts` baris 89) pakai
filter yang sama.

Ini persis bentuk cacat yang dulu dibereskan Track F, hanya terbalik arahnya: F2 dulu
**menambahkan** filter `assignedTo=me` karena "My Jobs" menampilkan semua tiket. Filter itu
benar untuk daftar "punya saya", tapi menjadi satu-satunya daftar yang teknisi punya.

### T3 — Halaman detail tiket sama persis untuk semua peran

`TicketWorkspace.svelte` (440 baris) merender **semua** bagian tanpa memandang peran:
pelanggan, device, sandi, dokumen cetak, form diagnosa, dropdown "assign teknisi ke siapa
saja", sparepart & biaya, QC, dan panel transisi tahap.

Akibat nyatanya:
- **Teknisi** melihat dropdown "tugaskan ke teknisi lain" — padahal ia tak punya izin
  `ticket.assign_technician`, jadi memakainya menghasilkan **403**. Tombol yang kelihatan
  hidup tapi mati = anti-pattern yang Track F ada untuk membasminya.
- **Kasir** (nanti, setelah T1 dibereskan) akan melihat form "Hasil Diagnosa & Estimasi
  Waktu" yang bukan pekerjaannya.
- Tiap peran harus **memindai** layar penuh untuk menemukan satu-dua hal yang jadi
  urusannya — persis keluhan pemilik: *"aplikasi ini menjadi terlalu rumit untuk digunakan"*.

### T4 — QC sekarang: satu daftar datar, menempel di tahap, dan tak bisa "silang"

| Yang ada sekarang | Yang diminta pemilik |
|---|---|
| Item disimpan di `flow_nodes.checklist_items` (jsonb) — **milik satu tahap di satu alur** | Tabel template QC **terpisah**, bisa menyimpan banyak template dan dipakai ulang |
| Daftar **datar**, tanpa pengelompokan | Berkategori: *Pengecekan Luar* (sebelum dibongkar) & *Pengecekan Dalam* (setelah dibongkar) |
| Jawaban `checked: boolean` | **✓ / ✗** — "sudah diperiksa & bagus" vs "sudah diperiksa & bermasalah" harus bisa dibedakan |

**Masalah paling penting di kolom kiri, dan ini bukan soal tampilan:** `checked: false`
sekarang berarti **dua hal sekaligus** — "belum diperiksa" dan "diperiksa, hasilnya jelek".
Untuk QC yang gunanya *bukti ke pelanggan*, dua hal itu tidak boleh tercampur. Ini alasan
teknis terkuat kenapa permintaan pemilik memang harus dikerjakan, bukan sekadar preferensi.

---

## 1. Pagar scope (baca sebelum mulai — ini yang menjaga pekerjaan tidak melebar)

Track ini **hanya** menyentuh: izin peran, daftar tiket, halaman detail tiket, dan modul QC.

**TIDAK dikerjakan di sini**, walau tergoda:

| Godaan | Kenapa ditolak | Rumahnya di mana |
|---|---|---|
| Membangun UI matriks RBAC (7.3) | Track ini butuh **satu baris grant** berubah, bukan editor izin | Phase 7.3 |
| Pisah data per cabang | Perubahan auth + hampir semua query. Pilot masih 1 cabang | Milestone C1 |
| Retur / tukar barang | Risiko tertinggi di aplikasi; menunggu bentuk retur nyata dari pilot | Fase R5 di bawah |
| Foto before/after di QC | Butuh infra storage yang belum ada di mana pun | Milestone E3 |
| Cetak hasil QC di nota | Menyentuh mesin render cetak bersama — task sendiri | Setelah R3 |
| Merapikan 53 `catch (err: any)` | Hutang teknis, tidak menghalangi siapa pun hari ini | Per-modul saat disentuh |
| Menambah peran baru (Branch Mgr, Inv Staff, dst) | 4 peran seed sudah cukup untuk pilot 1 cabang | Setelah pilot |

**Aturan pengerjaan:** satu fase = satu commit atau lebih, **tidak pernah menggabung dua
fase dalam satu commit**. Fase berikutnya baru dimulai setelah checklist uji manual fase
sebelumnya dijalankan pemilik dan hasilnya dicatat.

---

## 2. Urutan fase

```
R1  Peran & akses                 🔴 kecil, membuka pemakaian harian     ← MULAI DI SINI
R2  Halaman tiket per peran       🟠 sedang, murni frontend
R3  QC jadi modul sendiri         🔴 besar, sentuh DB + BE + FE
R4  Bersih-bersih hasil audit     🟢 kecil, bisa disisipkan kapan saja
R5  Retur / tukar barang          ⏸️  tunggu pilot
```

Alasan R1 dulu: ia **memblokir pemakaian harian** (kasir tak bisa terima unit, teknisi tak
bisa ambil kerja) dan perubahannya paling kecil. R2 sebelum R3 karena R3 akan menambah satu
bagian besar ke halaman tiket — lebih murah menaruhnya ke struktur yang sudah rapi daripada
merapikan setelahnya.

---

# FASE R1 — Peran & Akses

**Tujuan:** kasir bisa menerima unit servis; teknisi bisa mengambil pekerjaan yang menunggu.
**Perkiraan:** paling kecil dari tiga fase. Backend nyaris tak berubah.

## Task R1.1 — Kasir dapat izin `ticket.create`

- [ ] Tambahkan `'ticket.create'` ke `ROLE_PERMISSION_CODES[IDS.roleCashier]`
- [ ] Jalankan `npm run db:reset` (di `flowserv-api/`) agar grant baru masuk

**File terpengaruh:**
- `flowserv-api/src/db/seed/01-core.ts` — **1 baris**

**⚠️ Perhatian ekstra:**
- Seed bersifat `onConflictDoNothing`. Menambah kode di array **tidak** otomatis masuk ke
  DB yang sudah ada — **wajib `db:reset`**, bukan `db:seed` saja. Kalau di mesin pilot
  datanya sudah nyata dan tak boleh dihapus, grant-nya harus di-`INSERT` manual ke
  `role_permissions`. Catat langkah ini sebelum onboarding data asli (B2.5).
- Jangan sekalian memberi kasir `ticket.manage_charges` atau `ticket.diagnose`. Kasir
  **menerima unit**, bukan memeriksa atau memberi harga. Menambah lebih dari yang perlu
  akan langsung mengaburkan batas peran yang justru sedang kita pertegas.

## Task R1.2 — Menu Kasir dapat "Servis"

- [ ] Tambahkan `{ label: 'Servis', path: '/tickets' }` pada menu Cashier
- [ ] Putuskan: apakah kasir melihat **semua** tiket atau hanya yang perlu tindakannya
      → lihat **Keputusan K1** di bagian 6

**File terpengaruh:**
- `flowserv-web/src/routes/(app)/+layout.svelte` — blok `roleName === 'Cashier'`

**⚠️ Perhatian ekstra:**
- Menu kasir sengaja dibuat 3 baris di S2. Menambah baris ke-4 masih sejalan dengan prinsip
  "atur sekali lalu menghilang" **karena terima-unit adalah pekerjaan harian**, bukan
  setelan. Tetapi jangan tambah lebih dari satu baris di fase ini.

## Task R1.3 — Backend: filter tiket "belum bertuan"

- [ ] Terima `?assignedTo=none` (atau `unassigned`) di `GET /v1/tickets` →
      `isNull(serviceTickets.assignedTechnicianId)`
- [ ] Pertahankan perilaku `?assignedTo=me` dan `?assignedTo=<uuid>` apa adanya

**File terpengaruh:**
- `flowserv-api/src/routes/tickets.ts` — blok filter baris ~27–34

**⚠️ Perhatian ekstra:**
- Filter yang ada sekarang **permisif**: nilai `status` yang tak dikenal diabaikan, bukan
  error. Ikuti gaya itu — jangan tiba-tiba melempar 400 untuk nilai `assignedTo` asing,
  karena Kanban board & dashboard memakai endpoint yang sama.
- Jangan lupa `?status=open` ikut dipakai; tiket `closed`/`cancelled` yang tak bertuan tidak
  boleh muncul di antrian "siap diambil".

## Task R1.4 — Daftar tiket teknisi: dua kelompok

- [ ] `+page.server.ts` untuk Technician mengambil **dua** daftar:
      `?assignedTo=me` dan `?assignedTo=none&status=open`
- [ ] Halaman menampilkan dua bagian: **"Pekerjaan Saya"** lalu **"Menunggu Diambil"**
- [ ] Baris di "Menunggu Diambil" mengarah ke halaman detail tiket (tempat tombol
      "Ambil Pekerjaan" sudah ada dan sudah benar)

**File terpengaruh:**
- `flowserv-web/src/routes/(app)/tickets/+page.server.ts`
- `flowserv-web/src/routes/(app)/tickets/+page.svelte`

**⚠️ Perhatian ekstra:**
- `+page.server.ts` masih memakai `http://localhost:3001` **hardcoded** (server-side sengaja
  dibiarkan sampai Phase 11 — lihat 3.5E.1). **Jangan diperbaiki di sini**; ubah cuma
  URL-nya di tempat, biarkan pola lamanya. Merapikan itu = fase lain.
- Ada gap yang sudah diketahui: pola `+page.server.ts` + `new State(data)` membuat
  `invalidateAll()` tidak menyegarkan di tempat pada beberapa halaman. Setelah teknisi
  menekan "Ambil Pekerjaan", pastikan daftarnya benar-benar berubah saat kembali — kalau
  tidak, **catat sebagai temuan**, jangan langsung dibetulkan di fase ini.

## Task R1.5 — Beranda teknisi: kartu "Menunggu Diambil"

- [ ] Tambah satu kartu berisi jumlah + daftar pendek tiket tak bertuan
- [ ] Tautkan ke `/tickets`

**File terpengaruh:**
- `flowserv-web/src/routes/(app)/+page.server.ts` (baris ~89)
- `flowserv-web/src/routes/(app)/+page.svelte`

**⚠️ Perhatian ekstra:**
- Ada 5 test Playwright dashboard peran (`p3-role-dashboards.spec.ts`) — menambah widget
  bisa membuat assertion "jumlah kartu" atau strict-mode locator gagal. Jalankan spec itu
  ulang, jangan hanya spec baru.

## Task R1.6 — Tes

- [ ] Playwright baru `tahap-b-peran-akses.spec.ts`:
  - kasir login → menu Servis ada → buat tiket → **201**, tiket muncul
  - teknisi login → daftar punya bagian "Menunggu Diambil" berisi tiket tak bertuan
  - teknisi buka tiket itu → "Ambil Pekerjaan" → tiket pindah ke "Pekerjaan Saya"
  - teknisi B tidak melihat tiket yang sudah diambil teknisi A di "Menunggu Diambil"
- [ ] Jalankan ulang: `p3-role-dashboards`, `p2-ticket-kanban`, `intake-to-close`

**Definition of Done R1:**
`npx vitest run` hijau · `svelte-check` 0 error · spec baru + 3 spec lama lulus ·
**checklist uji manual R1 (bagian 5) dijalankan pemilik dan hasilnya dicatat**

---

# FASE R2 — Halaman Tiket Menyesuaikan Peran

**Tujuan:** tiap peran melihat layar yang sesuai cara kerjanya, bukan layar Super Admin yang
dipangkas seadanya.
**Sifat:** **frontend saja.** Tidak ada endpoint baru, tidak ada kolom DB baru.

## Pendekatan: pecah dulu, baru susun per peran

`TicketWorkspace.svelte` (440 baris) dipecah jadi komponen-bagian, lalu **disusun ulang per
peran**. Bukan menyalin halaman jadi tiga — itu akan jadi tiga tempat yang harus diperbaiki
tiap ada perubahan.

Bagian yang ada sekarang (dari pembacaan berkas):

| # | Bagian | Baris |
|---|---|---|
| 1 | Header + tombol Batalkan Tiket | 21–34 |
| 2 | Pelanggan & Device + sandi/pola + keluhan | 43–140 |
| 3 | Dokumen Cetak (label / tanda terima / nota) | 141–170 |
| 4 | Hasil Diagnosa & Estimasi Waktu | 172–216 |
| 5 | Teknisi (ambil pekerjaan / dropdown assign) | 218–260 |
| 6 | Sparepart & Biaya + minta persetujuan | 261–292 |
| 7 | Daftar periksa (QC) + bukti tahap lalu | 293–391 |
| 8 | Tahap saat ini + tombol lanjut tahap | 392–440 |

## Usulan pembagian per peran

> **Ini usulan, bukan keputusan.** Tabel ini yang paling butuh koreksi pemilik —
> lihat **Keputusan K2** di bagian 6, ada kolom komentar untuk diisi.

| Bagian | Kasir | Teknisi | Manager | Super Admin |
|---|:---:|:---:|:---:|:---:|
| Pelanggan & Device | **edit** | baca | edit | edit |
| Sandi / pola | **edit** | **baca** | edit | edit |
| Keluhan pelanggan | **edit** | baca | edit | edit |
| Dokumen cetak | **✓** | ✕ | ✓ | ✓ |
| Hasil diagnosa & estimasi | baca | **edit** | baca | edit |
| Ambil pekerjaan (diri sendiri) | ✕ | **✓** | ✕ | ✓ |
| Tugaskan teknisi lain | ✕ | **✕** | **✓** | ✓ |
| Sparepart & biaya | baca-total | **edit** | edit | edit |
| Minta persetujuan / kuotasi | ✓ | ✕ | ✓ | ✓ |
| Daftar periksa QC | ✕ | **✓** | ✓ | ✓ |
| Buat nota & terima bayar | **✓** | ✕ | ✓ | ✓ |
| Batalkan tiket | ✕ | ✕ | ✓ | ✓ |
| Lanjut tahap | sesuai izin tahap | sesuai izin tahap | ✓ | ✓ |

## Task R2.1 — Pecah `TicketWorkspace` jadi komponen-bagian

- [ ] Buat `lib/components/tickets/sections/` berisi: `CustomerDeviceSection`,
      `PrintSection`, `DiagnosisSection`, `TechnicianSection`, `ChargesSection`,
      `ChecklistSection`, `StageSection`
- [ ] `TicketWorkspace.svelte` jadi **penyusun** saja, bukan perender

**⚠️ Perhatian ekstra:**
- Ini **refactor murni**: setelah task ini, tampilan Super Admin harus **identik** dengan
  sebelumnya. Cara membuktikannya: jalankan `p4-ticket-detail-polish.spec.ts` dan
  `intake-to-close.spec.ts` **tanpa mengubah satu baris pun di spec itu**. Kalau spec-nya
  harus diubah, berarti ini bukan refactor lagi.
- Semua bagian membaca `TicketDetailState` (753 baris) yang sama. **Jangan pecah state-nya**
  di fase ini — memecah tampilan dan memecah state sekaligus membuat kegagalan sulit
  dilacak.

## Task R2.2 — Lapisan "apa yang boleh dilihat peran ini"

- [ ] Satu berkas murni, mis. `lib/states/tickets/ticket-view.ts`:
      `ticketSectionsFor(roleName, ticket) → { showDiagnosis, canAssignOthers, ... }`
- [ ] `TicketWorkspace` memakai hasilnya untuk memutuskan bagian mana yang dirender
- [ ] Unit test untuk fungsi itu (murni, tanpa DB/HTTP — pola yang sama dengan
      `evaluateRbac` dan `capabilitiesFor`)

**⚠️ Perhatian ekstra — ini yang paling penting di fase R2:**
- **Menyembunyikan tombol bukan keamanan.** Backend tetap satu-satunya gerbang. Fungsi ini
  hanya boleh **menyembunyikan yang backend memang akan tolak** — jangan sampai ia
  memunculkan sesuatu yang backend larang (tombol mati), atau menyembunyikan sesuatu yang
  backend izinkan (fitur hilang diam-diam).
- Aturan turunannya: daftar bagian **diturunkan dari peran**, dan tiap barisnya harus bisa
  ditunjuk ke permission backend yang bersangkutan. Kalau sebuah baris tak punya pasangan
  di backend, itu tanda desainnya belum benar.
- Peran `'no-role'` harus dapat tampilan paling sempit, bukan error.

## Task R2.3 — Tes

- [ ] Playwright `tahap-b-tiket-per-peran.spec.ts`: untuk tiap peran, buka tiket yang sama
      dan buktikan bagian yang seharusnya ada memang ada, yang tidak seharusnya **tidak ada
      di DOM** (bukan sekadar tak terlihat)
- [ ] Satu tes khusus: **teknisi tidak melihat dropdown "tugaskan teknisi lain"** — ini
      tombol-403 yang jadi alasan fase ini ada
- [ ] Jalankan ulang `p4-ticket-detail-polish`, `intake-to-close`, `tahap-b-qc-checklist`,
      `tahap-a-change-order`, `tahap-b-pos-service-flow`

**Definition of Done R2:**
tampilan Super Admin tak berubah (dibuktikan spec lama lulus tanpa diedit) · spec per-peran
lulus · `svelte-check` 0 error · **checklist uji manual R2 dijalankan pemilik**

---

# FASE R3 — QC Jadi Modul Sendiri

**Tujuan:** template QC bisa banyak & dipakai ulang, berkategori, dan teknisi tinggal
**✓ / ✗**.
**Sifat:** fase terbesar. Sentuh DB, backend, editor alur, dan halaman tiket.

## Bentuk data yang diusulkan

```
qc_templates                 satu template, mis. "QC Servis HP", "QC Laptop"
├─ id, tenant_id, name, description, is_active, created_at
│
qc_template_sections         KATEGORI — inilah "pengecekan luar / dalam"
├─ id, qc_template_id, name, description, sort_order
│  contoh: "Pengecekan Luar (sebelum dibongkar)", "Pengecekan Dalam (setelah dibongkar)"
│
qc_template_items            baris yang dicentang
├─ id, qc_template_section_id, label, sort_order, is_required, allows_note
   contoh: "Layar tidak retak", "Tombol power berfungsi", "Baut lengkap"
```

Tahap alur **menunjuk** ke template, tidak lagi menyimpan itemnya sendiri:

```
flow_nodes.qc_template_id  (uuid, nullable)   ← menggantikan checklist_items (jsonb)
```

Jawaban per tiket:

```
ticket_checklist_results  (tabel yang sudah ada, diperluas)
├─ + result: 'ok' | 'not_ok' | 'na'           ← menggantikan checked: boolean
├─ + section_label (disalin, seperti label)
└─ unique tetap (ticket_id, node_id, item_id)
```

**Tiga keputusan desain yang perlu dipahami sebelum menulis kode:**

1. **`checked: boolean` → `result` tiga nilai.** Ini inti permintaan pemilik ("ceklis atau
   silang"). `false` sekarang berarti "belum diperiksa" **dan** "diperiksa, jelek" — dua hal
   yang untuk bukti ke pelanggan tidak boleh sama. Setelah ini: `ok` = ✓, `not_ok` = ✗,
   tidak ada baris = belum diperiksa.
2. **`section_label` ikut disalin** ke jawaban, dengan alasan yang sama persis kenapa
   `label` sudah disalin sekarang: mengganti nama kategori di template tidak boleh mengubah
   bunyi bukti tiket yang sudah lewat.
3. **`checklist_items` (jsonb) DIHAPUS, bukan dibiarkan berdampingan.** Dua sumber kebenaran
   untuk hal yang sama adalah cacat yang berulang kali dibereskan proyek ini (H1, F6).
   Konsekuensinya: seed dan editor alur ikut berubah di fase ini juga — tidak bisa dicicil.

## Task R3.1 — Skema + seed

- [ ] Tiga tabel baru di `flowserv-api/src/db/schema/` (berkas baru `qc.ts`) + relations
- [ ] `flow_nodes`: tambah `qc_template_id`, hapus `checklist_items`
- [ ] `ticket_checklist_results`: `checked` → `result`, tambah `section_label`
- [ ] Seed: 1 template contoh **"QC Servis Umum"** dengan 2 kategori (Luar/Dalam) dan
      beberapa item nyata; tahap QC Awal/QC Akhir di seed alur menunjuk ke sana
- [ ] `npm run db:reset` dua kali → hasilnya identik (idempoten)

**File terpengaruh:** `db/schema/qc.ts` (baru), `db/schema/flow.ts`, `db/schema/tickets.ts`,
`db/schema/relations.ts`, `db/schema/index.ts`, `db/seed/04-flows.ts`, `db/seed/ids.ts`,
`db/seed/index.ts`

**⚠️ Perhatian ekstra:**
- `db:reset` **menghapus seluruh data lokal**. Aman selama data lokal masih boleh dibuang —
  benar sampai Phase 10. **Bila mesin pilot sudah berisi data asli, fase R3 butuh skrip
  migrasi, bukan reset.** Putuskan ini sebelum mulai (**Keputusan K4**).
- Jangan bikin `qc_template_id` di `flow_nodes` bertipe `notNull` — tahap non-QC memang tak
  punya template.

## Task R3.2 — Backend: CRUD template QC

- [ ] `modules/qc/{service,types}.ts` + `routes/qc.ts`
- [ ] `GET/POST/PATCH/DELETE /v1/qc/templates` (+ section & item di dalam satu payload,
      disimpan atomik — pola yang sama dengan `PUT /v1/flows/:id/design`)
- [ ] Izin: pakai `flow.manage` yang sudah ada (template QC adalah bagian dari perancangan
      alur), **jangan** bikin permission baru kecuali pemilik meminta
- [ ] Hapus template yang masih dipakai tahap mana pun → **422 `QC_TEMPLATE_IN_USE`**,
      menyebut nama tahapnya — pola yang sama dengan `TEMPLATE_IN_USE` di printer & flow

**⚠️ Perhatian ekstra:**
- Ikuti bentuk modul di `coding-guidelines.md` §6 sejak awal (`routes.ts` tipis,
  `service.ts` bisa diuji tanpa HTTP). Ini modul **baru**, jadi tak ada alasan mewarisi
  bentuk lama route-tebal.
- Simpan seluruh template dalam **satu transaksi**. Template setengah tersimpan (kategori
  ada, item hilang) akan langsung merusak tiket yang sedang memakainya.

## Task R3.3 — Backend: jawaban ✓/✗ berkategori

- [ ] `modules/tickets/checklist.ts`: `ChecklistLine` bawa `sectionId`/`sectionLabel` dan
      `result` (bukan `checked`); `mergeChecklist` mengelompokkan per kategori dengan urutan
      dari template
- [ ] `checklistProgress` menghitung tiga angka: **✓ berapa, ✗ berapa, belum berapa**
- [ ] `checklist-service.ts` membaca item lewat `qc_template_id`, bukan jsonb
- [ ] Perbarui/tambah unit test (sekarang 10 tes `mergeChecklist`)

**⚠️ Perhatian ekstra — ini bagian paling rawan di seluruh track:**
- Perilaku **"item dihapus dari template, jawabannya tetap tampil, ditandai 'tidak lagi
  diperiksa'"** harus tetap hidup — dan sekarang berlaku dua tingkat: item dihapus **dan
  kategori dihapus**. Tes untuk keduanya wajib ada; ini satu-satunya yang menjaga bukti
  pelanggan tidak lenyap saat pemilik merapikan template.
- Ada 4 tes Playwright QC (`tahap-b-qc-checklist.spec.ts`) yang **pasti** berubah karena
  `checked` → `result`. Ubah tesnya untuk mencerminkan aturan baru, **jangan** dilonggarkan
  supaya lulus.

## Task R3.4 — Frontend: pengelola template QC

- [ ] Halaman/tab pengelola template: buat, salin, ubah, hapus; kategori bisa ditambah &
      diurutkan; item di dalam kategori bisa ditambah & diurutkan
- [ ] Di editor alur (`/flows/:id`), panel tahap: editor item bawaan **diganti** dropdown
      "pakai template QC: ___"

**File terpengaruh:** `lib/components/flow/FlowDiagram.svelte`,
`lib/states/flow/flow.diagram.svelte.ts` (baris 48, 92–113, 195–196, 403, 454–475, 539),
`routes/(app)/settings/+page.svelte` (tab baru) **atau** halaman sendiri — lihat
**Keputusan K3**

**⚠️ Perhatian ekstra:**
- `flow.diagram.svelte.ts` menyimpan `checklistItems` di **8 tempat** (preset, parse, add,
  remove, reorder, save). Semuanya berubah jadi satu `qcTemplateId`. Ini justru
  **mengurangi** kode — kalau setelah task ini kodenya bertambah, kemungkinan besar arahnya
  salah.
- Prinsip S2 "atur sekali, lalu menghilang" berlaku: pengelola template QC adalah **setelan**
  (disentuh sesekali), bukan pekerjaan harian. Jangan letakkan di menu utama.

## Task R3.5 — Frontend: teknisi mengisi QC

- [ ] `ChecklistSection` (dari R2) menampilkan item **berkelompok per kategori**, dengan
      judul kategori
- [ ] Tiap baris: dua tombol besar **✓** dan **✗** (target sentuh ≥ 40×40px — pelajaran
      dari P12), plus catatan opsional
- [ ] Ringkasan per kategori: "Pengecekan Luar — 5 ✓ / 1 ✗ / 2 belum"
- [ ] Bukti dari tahap yang sudah lewat tetap tampil baca-saja, ikut berkategori

**⚠️ Perhatian ekstra:**
- Ini layar yang dipakai sambil memegang obeng. Tombol kecil = tidak akan dipakai. P12 sudah
  menemukan dua bug target-sentuh nyata di POS; jangan ulangi.
- Jangan pakai pola `opacity-0 group-hover:` di mana pun — di layar sentuh `:hover` tidak
  pernah terjadi (bug P12).

## Task R3.6 — Tes

- [ ] Unit: `mergeChecklist` berkategori, item dihapus, kategori dihapus, hitung tiga angka
- [ ] Playwright: buat template 2 kategori → pasang ke tahap → teknisi isi ✓ dan ✗ → simpan →
      muat ulang, hasil tetap → tiket maju tahap → bukti tetap terbaca
- [ ] Playwright: hapus template yang dipakai → pesan penolakan yang menyebut tahapnya
- [ ] Jalankan ulang seluruh suite

**Definition of Done R3:**
`npx vitest run` hijau · seluruh Playwright hijau · `db:reset` idempoten ·
**checklist uji manual R3 dijalankan pemilik**

---

# FASE R4 — Bersih-bersih Hasil Audit (kecil, bisa disisipkan)

Dari audit 2026-07-31. Tidak memblokir siapa pun, tapi keduanya bentuk cacat "kelihatan
jalan padahal tidak".

## Task R4.1 — `approval_requests` yang tak pernah dibaca lagi

`generateQuotation()` (`modules/tickets/service.ts` baris ~398) memasukkan baris berstatus
`'pending'`, dan **tidak ada satu baris kode pun yang pernah mengubahnya**. Sementara
biayanya sendiri langsung jadi `approved` di transaksi yang sama. Jadi kolom `status` itu
selamanya `pending` dan tidak berarti apa-apa.

- [ ] Putuskan: **(a)** persetujuan pelanggan jadi langkah nyata (tombol Setuju/Tolak, status
      benar-benar berubah), atau **(b)** kolom `status` dihapus dan baris itu jujur disebut
      *catatan kuotasi* — lihat **Keputusan K5**
- [ ] Kerjakan yang dipilih; jangan biarkan di tengah

## Task R4.2 — Endpoint terima stok manual yang yatim

`POST /v1/inventory/:id/receive` lengkap & teruji, tapi **tak ada pemanggil di frontend**.
Tugasnya sudah ditutupi halaman Opname.

- [ ] Rekomendasi: **hapus endpoint-nya**. Bentuk cacat yang sama dengan tabel
      `warranty_records` yang F6 hapus, dan alasannya sama: menyimpan jalan masuk kedua ke
      stok yang tak pernah dites lewat UI = risiko tanpa manfaat
- [ ] Bila dipertahankan, harus punya tombol nyata di `/inventory` — bukan dibiarkan begitu

---

# FASE R5 — Retur ⏸️

**Sengaja belum dijadwalkan.** Ini risiko tertinggi di aplikasi (stok + uang sekaligus), dan
`go-live-tahap-b-onward.md` D3 sudah memutuskan menunggu bentuk retur nyata dari pilot.

**Ada DUA jenis retur, dan keduanya belum dibangun:**

| Jenis | Keadaan sekarang | Kode fitur |
|---|---|---|
| **Retur pelanggan** (barang dibeli lalu dikembalikan/ditukar) | Hanya ada *void* nota, dan void **ditolak bila sudah ada pembayaran tercatat** — jadi begitu uang masuk, tak ada jalan mundur | SAL-005 |
| **Retur ke supplier** (barang datang rusak/salah, dikirim balik) | **Tidak ada sama sekali** — tak ada endpoint, tak ada layar. Stok yang dikembalikan ke supplier tidak punya cara turun selain opname manual | PUR-007, INV-008 |

> **Catatan asal:** retur ke supplier ditemukan di `plan/2026-07-20-architecture-review.md`
> §5.7 (audit 2026-07-20). Berkas itu dihapus 2026-07-31 karena semua temuan lainnya sudah
> dibangun; **temuan ini satu-satunya yang belum, dan belum tercatat di dokumen aktif mana
> pun** — jadi dipindahkan ke sini supaya tidak hilang lagi.

**Yang harus disiapkan sekarang, tanpa menulis kode:** prosedur manual tertulis untuk kasir
bila ada retur selama pilot (catat di buku, jangan diakali lewat void). Tanpa ini, staf akan
mengarangnya sendiri dan stok jadi tidak cocok — persis masalah yang aplikasi ini ada untuk
menghentikan.

---

# 5. Checklist Uji Manual — satu berkas per fase

**Checklist uji dipisah dari dokumen ini**, satu berkas per fase, supaya pemilik bisa
mengisinya bebas dan agent tahu persis apa yang harus dibaca sebelum lanjut.

| Berkas | Untuk | Kapan ditulis |
|---|---|---|
| [`uji-00-kondisi-sekarang.md`](uji-00-kondisi-sekarang.md) | Aplikasi apa adanya hari ini — semua area, di luar tiga fase ini | Sudah ada, opsional, kapan saja |
| [`uji-R1-peran-akses.md`](uji-R1-peran-akses.md) | Fase R1 | Sudah ada, jalankan **setelah** R1 selesai |
| `uji-R2-*.md` | Fase R2 | **Ditulis saat R2 dikerjakan** |
| `uji-R3-*.md` | Fase R3 | **Ditulis saat R3 dikerjakan** |

**Kenapa R2/R3 belum ditulis:** isinya harus menyesuaikan catatan pemilik dari fase
sebelumnya. Menulisnya sekarang berarti menebak bentuk akhirnya — dan tebakan itu justru
yang membuat pekerjaan melebar.

**Alurnya:**

```
saya kerjakan R1  →  saya tulis uji-R1  →  pemilik isi  →  saya BACA catatannya
                                                              ↓
                              perbaiki yang gagal  ATAU  mulai R2 (+ tulis uji-R2)
```

Tiap berkas uji punya bagian **Kesimpulan** di bawah: "lanjut" atau "perbaiki dulu",
ditambah pertanyaan-pertanyaan yang jawabannya dibutuhkan fase berikutnya.

---

# 6. Keputusan yang menunggu jawaban Anda

Saya bisa mulai R1 tanpa jawaban apa pun. Yang lain butuh keputusan Anda supaya tidak salah
arah.

| # | Keputusan | Usulan saya | Jawaban Anda |
|---|---|---|---|
| **K1** | Kasir melihat daftar seluruh tiket, atau hanya tombol "Terima Unit"? | Daftar tiket cabangnya — kasir yang menyerahkan unit ke pelanggan, jadi perlu mencari tiket | |
| **K2** | Tabel pembagian bagian per peran di Fase R2 | Seperti tabel di atas | |
| **K3** | Pengelola template QC: tab di Setelan, atau halaman sendiri? | Tab di `/settings` — ia setelan, disentuh sesekali | |
| **K4** | Saat R3 dikerjakan, apakah data lokal sudah berisi data asli? | Kalau **belum**, `db:reset` (cepat & bersih). Kalau **sudah**, saya buat skrip migrasi (lebih lama, lebih hati-hati) | |
| **K5** | `approval_requests`: buat nyata, atau hapus kolom statusnya? | Hapus dulu — persetujuan pelanggan sekarang lisan; portal pelanggan baru ada di Phase 8 | |

---

# 7. Ringkasan urutan

```
R1  Peran & akses            ← mulai sekarang, tak perlu menunggu jawaban apa pun
    └─ uji manual R1 → catatan Anda
R2  Halaman tiket per peran  ← butuh jawaban K1, K2
    └─ uji manual R2 → catatan Anda
R3  QC modul sendiri         ← butuh jawaban K3, K4 + jawaban pertanyaan QC
    └─ uji manual R3 → catatan Anda
R4  Bersih-bersih audit      ← butuh jawaban K5 (kecil, bisa kapan saja)
R5  Retur / tukar            ⏸️ setelah pilot menunjukkan bentuk nyatanya

Paralel, dijalankan Anda, tak perlu kode:
    · 6D.1  Test cetak fisik
    · B2.6  Onboarding stok asli + rekonsiliasi bersih
```
