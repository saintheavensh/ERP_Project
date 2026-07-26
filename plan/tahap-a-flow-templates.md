# Tahap A — 2 Flow Template Servis (Ditunggu/Disimpan) + Field Sandi/Pola

> **Status: SELESAI 2026-07-24.** Semua task §4 `[x]` dengan bukti live + Playwright
> (lihat Progress log). go-live gap Tier-1 #2
> ([`plan/go-live-plan.md`](go-live-plan.md)). Branch `go-live/tahap-a`. Acara utama
> Tahap A — paling berat, paling inti, dan (per catatan pemilik sendiri) paling mahal
> untuk diperbaiki kalau desainnya salah. Node design dikonfirmasi ke pemilik sebelum
> implementasi (lihat §1).

---

## 1. Desain node (dikonfirmasi pemilik, opsi "lebih detail")

Audit kode sebelum desain menemukan: `flow-engine/engine.ts`, halaman detail tiket
(`ticket.detail.svelte.ts` `availableTransitions`), dan Kanban board (`/tickets/board`)
**sudah 100% generik** — tidak satu pun membaca nama node untuk logika (hanya untuk
label tampilan). Kanban board bahkan **sudah punya** picker `?flowTemplateId=` (P2
Decision 1, dibangun sebelum kebutuhan ini muncul). Artinya menambah template baru
dengan struktur node berbeda **tidak butuh perubahan FE apa pun** di luar seed data —
persis seperti dugaan `go-live-plan.md`: "Fondasinya sudah ada; yang belum =
mengonfigurasi dua template ini."

**Ditunggu** (7 node, template BARU — `Standard Repair` lama TIDAK disentuh, lihat §2):
```
Intake → Diagnosis → Menunggu Persetujuan → QC Awal → Pengerjaan → QC Akhir → Selesai
                            └──────────────────────────────────────┘
                            shortcut: Menunggu Persetujuan → Selesai
                            (tidak ada kerusakan / tidak perlu bongkar)
```

**Disimpan** (8 node — sama seperti Ditunggu + 1 node `Unit Disimpan` setelah Diagnosis):
```
Intake → Diagnosis → Unit Disimpan → Menunggu Persetujuan → QC Awal → Pengerjaan → QC Akhir → Selesai
                                            └──────────────────────────────────────┘
                                            shortcut sama seperti Ditunggu
```

Rasional per bagian:
- **Menunggu Persetujuan dipertahankan di kedua alur** (bukan dihapus meski draft
  preview awal sempat menyiratkan itu) — ini bukan sekadar label, ini node tempat
  `POST /:id/quotation` (`generateQuotation`) benar-benar berjalan: charge
  `estimated→approved`, stock direservasi (H10). Menghapusnya akan merusak fitur
  billing yang sudah ada.
- **Unit Disimpan** hanya beda struktural Disimpan vs Ditunggu — sesuai wawancara
  pemilik: "Ternyata beda diagnosa & perlu waktu → disarankan disimpan." Di titik ini
  kelak nota tanda-terima dicetak (pemicu cetak = task terpisah, Tier-1 #3 — TIDAK
  dibangun di sini).
- **QC Awal / QC Akhir** ditambahkan di KEDUA alur per pilihan pemilik — placeholder
  struktural saja (tanpa checklist form, sesuai `go-live-plan.md` §7J: "boleh manual
  dulu, cukup ada status"). Tidak ada `requiredPermissionId` di node baru manapun,
  kecuali Diagnosis (mengikuti persis pola `Standard Repair` yang sudah ada).
- **Shortcut Menunggu Persetujuan → Selesai** ditambahkan di kedua template, meniru
  transisi `transApprovalToCompletion` yang sudah ada di `Standard Repair` (menutup
  tiket tanpa perlu bongkar — mis. ternyata tidak ada kerusakan).

## 2. Keputusan: `Standard Repair` (template lama) tidak disentuh sama sekali

`Standard Repair` (`IDS.flowTemplate`) dipakai oleh ID node/transition tetap di
`e2e-service-flow.test.ts`, `p2-ticket-kanban.spec.ts`, `intake-to-close.spec.ts`, dan
`flow-engine/__tests__/engine.test.ts`. Merestrukturnya (menyisipkan node QC) akan
merusak semua itu. Jadi: **dua template BARU ditambahkan sebagai row baru**,
`Standard Repair` tetap ada persis seperti sekarang (isDefault tetap true — ini
penting: kalau template baru ikut `isDefault: true`, urutan `templates.find(t =>
t.isDefault)` jadi tidak deterministik karena `GET /v1/flows` sebelumnya tanpa
`ORDER BY`. Fix: (a) template baru **tidak** diberi `isDefault: true`, (b)
`routes/flow.ts` `GET /` ditambah `.orderBy(flowTemplates.createdAt)` untuk
determinisme, (c) `intake-to-close.spec.ts` yang sebelumnya memilih dropdown via
`{ index: 1 }` ("option index 1 is the first real workflow") diperbaiki memilih via
label — rapuh terhadap penambahan template, terlepas dari perbaikan (b)).

## 3. Field sandi/pola

`service_tickets.devicePasscode` (text, nullable) — dicatat di intake (opsional),
ditampilkan di kotak "Device Info" ticket detail, bisa diedit kapan saja lewat
`PATCH /v1/tickets/:id/device-passcode` (endpoint baru, kecil, sengaja tidak
menambah permission baru — reuse `ticket.create`, aktor yang sama dengan yang
melakukan intake). Diletakkan di level TIKET (bukan `customer_assets`) karena
sandi/pola bisa berubah antar kunjungan servis, bukan properti permanen device.

## 4. Task breakdown

- [x] BE: `db/schema/tickets.ts` — `devicePasscode` column.
- [x] BE: `db/seed/ids.ts` — UUID untuk 2 template + 15 node + 15 transisi baru.
- [x] BE: `db/seed/04-flows.ts` — insert template/node/transisi baru, `Standard Repair`
      tidak diubah.
- [x] BE: `routes/flow.ts` — `orderBy(createdAt)` pada `GET /`.
- [x] BE: `routes/tickets.ts` — intake schema terima `devicePasscode` opsional,
      simpan di insert; endpoint baru `PATCH /:id/device-passcode`.
- [x] BE: `modules/tickets/service.ts` — `updateDevicePasscode()`.
- [x] FE: `ticket.intake.svelte.ts` + `IntakeForm.svelte` — field Sandi/Pola opsional.
      Sambil di sana, perbaiki bug kosmetik lama: dropdown flow template merender
      `{t.name} - {t.description}` padahal `flowTemplates` tak punya kolom `description`
      (selalu tampil "- undefined") — dihapus.
- [x] FE: `ticket.detail.svelte.ts` + `TicketWorkspace.svelte` — tampilkan + edit
      sandi/pola di Device Info box.
- [x] Fix: `intake-to-close.spec.ts` pilih template flow via label, bukan index —
      wajib karena sekarang ada 3 template, bukan cuma 1.
- [x] Fix: `p2-ticket-kanban.spec.ts` — assertion lama "dropdown hidden karena cuma
      1 template" sudah tidak valid (P2's `templates.length > 1` switcher kini
      benar-benar tampil); ditulis ulang jadi assertion positif (dropdown muncul,
      berisi ke-3 template, default tetap Standard Repair).
- [x] Test baru: `tahap-a-flow-templates.spec.ts` — intake dgn template Disimpan
      berjalan lewat node "Unit Disimpan"; shortcut Menunggu Persetujuan→Selesai di
      Ditunggu; sandi/pola round-trip (isi di intake → tampil di detail → edit
      tersimpan → kosong tampil "-").
- [x] Verifikasi: `db:reset`, `tsc` (bersih), `svelte-check` (729 file, 0 error),
      `vitest` 198/198, **Playwright 90/90 (full suite)**. Live curl: `GET /v1/flows`
      urutan deterministik (Standard Repair dulu, isDefault=true; 2 baru
      isDefault=false); intake Disimpan + devicePasscode="9999" tersimpan &
      terbaca; PATCH clear→null berhasil.
- [x] Commit + update `go-live-plan.md` gap Tier-1 #2.

## Progress log

- [x] **Seluruh task di atas** — 2026-07-24, satu commit di `go-live/tahap-a`.
      Temuan penting selama audit-sebelum-kode: flow engine (`evaluateTransition`),
      halaman detail tiket (`availableTransitions`), dan Kanban board sudah 100%
      generik atas nama node — jadi menambah 2 template baru (15 node, 15 transisi)
      TIDAK butuh perubahan FE struktural apa pun, murni seed data. Risiko regresi
      yang ditemukan & diperbaiki: (1) `GET /v1/flows` tanpa `ORDER BY` membuat
      dropdown intake berpotensi tak deterministik begitu ada >1 baris — ditambah
      `orderBy(createdAt)`; (2) `intake-to-close.spec.ts` memilih dropdown via
      `{index: 1}` — rapuh begitu ada template lain, diganti pilih via label; (3)
      `p2-ticket-kanban.spec.ts` punya tes yang secara eksplisit mengasumsikan
      "cuma 1 template" (menyembunyikan switcher) — ditulis ulang jadi assertion
      positif karena switcher-nya memang didesain untuk kasus ini (P2 Decision 1).
      `Standard Repair` (dipakai ID node/transition-nya oleh banyak test lama)
      tidak disentuh sama sekali — tetap `isDefault: true` satu-satunya, sehingga
      resolusi default Kanban board tidak terpengaruh oleh baris baru.

## 5. Di luar scope (task terpisah, dicatat agar tak dikira lupa)
- Pemicu cetak (label saat diagnosa, nota tanda-terima di Unit Disimpan, nota
  selesai) — go-live gap Tier-1 #3, task terpisah.
- Change order (konfirmasi ulang harga di tengah pengerjaan) — Tier-1 #5.
- QC checklist form sungguhan (foto, cek nyala, dll) — Tier-3, Phase 8.
- "Ditunggu berubah jadi disimpan" mid-ticket (ganti template di tengah jalan) — future,
  per `go-live-plan.md` §2 catatan arsitektur.
