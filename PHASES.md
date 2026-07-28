# FlowServ — Implementation Phases & Checklist

> **RULE: Work on ONE phase at a time. Do NOT skip or combine phases.**
> Before starting any work, check this file to know which phase is current.
> Mark items `[/]` when in progress, `[x]` when done.

> **⚠️ Corrected 2026-07-20.** This file previously claimed work that did not exist —
> seven tasks were marked `[x]` for code that was never written. It was rewritten from
> a verified code audit, and Phase 3.5 below fixed the defects that audit found. The
> audit's own scaffolding (`RECOVERY-PLAN.md`, `plan/`) has since been deleted; its
> durable conclusions live in this file. See the Definition of Done immediately below —
> that rule exists specifically to stop this from recurring.

---

## Current Phase: `Go-live Tahap B` — pilot readiness (see `plan/go-live-tahap-b-onward.md`)

> **⚠️ Updated 2026-07-28 — track PENYEDERHANAAN dibuka, dan ini yang paling penting
> di file ini sekarang.** Lihat **[`plan/go-live-penyederhanaan.md`](plan/go-live-penyederhanaan.md)**.
>
> Pemilik menghentikan pekerjaan template nota dengan dua kalimat yang mendiagnosis
> produk ini lebih tajam daripada audit mana pun:
>
> > *"aplikasi ini menjadi terlalu rumit untuk digunakan"*
> > *"saya ingin membuat aplikasi ini sefleksibel dan sedinamis mungkin tetapi malah
> > jadi lebih rumit untuk orang yang tidak mengerti teknologi, sedangkan pasar yang
> > akan datang adalah pasar yang hampir rata-rata kurang ahli mengoperasikan komputer."*
>
> **Akar masalahnya ada di file ini.** PHASES.md punya 12 fase dan **tidak satu pun
> tugasnya berbunyi "kurangi"** — tiap fase menambah modul, tak ada yang merapikan.
> Hasilnya terukur pada 2026-07-28: 34 halaman, 124 endpoint, 22 baris menu, 6 tab
> Setelan, 97 berkas `.svelte` (50 memuat teks UI bahasa Inggris), 10 kolom untuk
> menerima satu unit, dan **tiga layar berbeda yang sama-sama berarti "barang datang"**
> (`Goods Receipt (Gudang)`, `Receive Items (Warehouse)`, `Receive PO (Warehouse)`) —
> dua di antaranya benar-benar identik, sama-sama mengambil PO berstatus `ordered`.
>
> Prinsip yang mengikat track ini: **"atur sekali, lalu menghilang."** Fleksibilitas
> mesinnya tidak dikurangi sedikit pun (flow engine, template, RBAC utuh); yang
> dikurangi adalah **permukaan yang dilihat pemakai harian**.
>
> - [x] **S1 — Bahasa & istilah.** 27 judul halaman + teks UI di 51 berkas jadi satu
>       bahasa toko: `Goods Receipt`→Barang Masuk, `Accounts Payable`→Hutang ke Supplier,
>       `Finance Ledger`→Buku Kas, `New Service Intake`→Terima Unit, dst. Menutup utang
>       lama di Architecture Debt ("mix Indonesian and English — pick one"). Judul statis
>       `System Dashboard` di header dihapus: ia tertulis sama di 33 dari 34 halaman.
> - [x] **S2 — Sidebar diringkas: 22 baris → 6** (Beranda/Servis/Kasir/Stok/Pelanggan +
>       "Lainnya" yang **tertutup** secara default). Teknisi 3 baris, kasir 3 baris.
> - [x] **S3 — Enam layar pembelian → satu daftar bertab.** `/inventory/receive`,
>       `purchasing/receipts`, `purchasing/orders`, `purchasing/invoices` dihapus;
>       tujuannya diserap jadi **tombol aksi per baris** yang menyesuaikan keadaan PO
>       ("Terima Barang" saat menunggu, "Catat Nota" saat sudah diterima) — jadi tak
>       ada lagi yang perlu menebak harus membuka layar mana. Endpoint & aturan bisnis
>       tak disentuh.
> - [x] **S4 — Terima unit: 9 kolom → 7 terlihat.** Email & nomor seri dilipat ke
>       "Data tambahan (opsional)". Tak ada yang dihapus atau berhenti tersimpan.
>       **Koreksi:** percobaan pertama ikut melipat sandi/pola dengan alasan "pad
>       polanya memakan ruang" — keliru, `PasscodeField` default-nya mode PIN dan
>       hanya setinggi kolom biasa. Dikembalikan ke tampak; ketahuan dari 2 tes e2e
>       sandi/pola yang gagal, bukan dari membaca ulang kode.
>
> - [x] **S5 — Jenis tahap + aturan yang akhirnya ditegakkan.** Pemilik: *"yang ada
>       di benak saya malah nanti aplikasinya banyak bug karena alur penting terlalu
>       banyak di-tweak."* Tiga boolean bebas per tahap = 8 kombinasi (~260.000 bentuk
>       untuk alur 6 tahap); data yang benar-benar ada hanya memakai **5**. Kelimanya
>       diberi nama (Penerimaan/Pemeriksaan/Pengerjaan/Penagihan/Penutup) di
>       `modules/flow/stage-kinds.ts`; `stage_kind` jadi sumber tunggal dan ketiga
>       boolean **selalu diturunkan**, jadi klien tak punya cara mengirim kombinasi
>       di luar yang teruji.
>       **Temuan yang mengubah bentuk tugas ini:** ketiga kapabilitas itu ternyata
>       **tidak ditegakkan di mana pun di backend** — hanya dibaca frontend untuk
>       mengunci form. Kuncinya semu; satu panggilan API langsung menembusnya. Bentuk
>       cacat yang sama dengan yang dibereskan Track F. Ditutup dengan
>       `assertStageAllows()` di `addCharge` → **422** `CHARGES_NOT_ALLOWED_AT_STAGE`,
>       diverifikasi langsung via curl pada tiket nyata di tahap Intake.
>       **Gerbang serupa untuk penagihan sempat dipasang lalu DICABUT** setelah 2
>       tes e2e menabraknya dan ternyata tes-nya yang benar: menagih setelah
>       kuotasi disetujui tapi sebelum pengerjaan adalah urutan normal alur
>       "Ditunggu". Yang memblokir bukan kebijakan toko melainkan `allowsInvoicing`
>       hasil tebakan backfill — menegakkan tebakan sebagai kebijakan justru
>       menghasilkan kelas bug yang track ini ada untuk mencegahnya. Editor:
>       3 sakelar → 1 pilihan, daftar jenisnya dikirim server (`GET /v1/flows/:id`)
>       agar tak ada kamus kedua. 12 tes unit baru + tes e2e yang membuktikan API
>       menolak, bukan sekadar form terkunci.
>
> **Ditunda, bukan dibatalkan** (permintaan pemilik tepat sebelum track ini dibuka):
> editor tata letak nota yang bebas, jenis nota `nota_pengambilan` + `nota_garansi`,
> dan sakelar harga rincian-vs-total. Ketiganya **menambah hal yang harus diatur** —
> mengerjakannya saat itu berarti menambah ke tumpukan yang persis sedang dikeluhkan.
>
> **Temuan sampingan, belum diperbaiki:** `POST /v1/inventory/:id/receive`
> (terima stok manual tanpa PO) **tidak punya pemanggil di frontend sama sekali** —
> endpoint yatim, sudah begitu sebelum track ini. Bentuk cacat yang sama dengan yang
> Track F dulu bereskan. Dicatat di sini supaya tidak hilang lagi.

> **⚠️ Updated 2026-07-27.** Work is no longer tracked by the numbered phases alone —
> the go-live track (`plan/go-live-plan.md` → `plan/go-live-tahap-b-onward.md`) drives
> priority, and it pulls phase items in when the pilot actually needs them. Two things
> landed today on `go-live/tahap-b`, both from the owner walking the real flow:
>
> - **`plan/tahap-b-alur-pos-servis.md`** — POS cash tendering + change, auto-print
>   after checkout, and the service flow rebuilt around the shop's real sequence
>   (single branching template chosen *after* diagnosis, not at intake).
> - **Phase 7.1 (Flow Template Builder) is now `[x]`**, built out of order because the
>   flow rules had to become data before the pilot could configure them. See Phase 7 below.
>
> **Phase 6 (Printer) remains as recorded below: 6A–6C done, 6D.1 (physical print) is a
> hardware checklist for the owner to run.**

> **⚠️ Updated 2026-07-24 (later still).** **6B (frontend) is done** — Printer Settings
> tab (devices CRUD, read-only template list, assignment matrix) and the full Cetak flow
> (thermal preview, A4 print, agent-send with graceful offline fallback) wired into the
> real POS invoice detail modal. See the Phase 6 section below for full evidence. Next:
> **6C (Python agent)**, then 6D (verify/docs).
>
> **⚠️ Updated 2026-07-24 (later).** Phase 5 merged to `main` (fast-forward to `26f06f4`,
> then a docs commit `4fae57f`). **Phase 6 work started on `phase-6/printer`.** The plan
> is [`plan/phase-6-printer.md`](plan/phase-6-printer.md) — task breakdown 6A–6D, the
> shared-render-engine decision (D1), and the resolved scope decisions (Q1: no physical
> printer available, build test-covered without hardware via python-escpos's Dummy/File
> backend; Q2: MVP is POS receipt + A4 invoice, `label` deferred; Q3: Python 3.14.0
> confirmed available). **6A (the entire backend foundation — seed, pure render engine,
> config CRUD, render endpoint) is done and independently verified**, see the Phase 6
> section below for full evidence.
>
> **⚠️ Updated 2026-07-24.** **Phase 5 (Core UI Polish) is complete.** P9 (Settings
> CRUD — Company/Branches/Users & Roles, closing the long-open 2A.1 create-user
> endpoint) was the last remaining task; see the Phase 5 section below for the full
> per-task breakdown (P1.5 through P9, ~12 sub-tasks across BE+FE). The per-task
> `plan/P*.md` files for this phase were **deleted on completion**, same convention as
> the H-track and Track F — durable evidence lives in this file and in git history on
> `phase-5/core-ui`.
>
> **⚠️ Updated 2026-07-23.** The **Hardening Track (H0–H17) is complete and merged to
> `main`** (commits `d32e881`→`aa341c6`). It built most of Phases 3.5, 4.5, and the
> Phase 3 gaps between 2026-07-21 and 2026-07-23. The per-task `plan/H*.md` files were
> **deleted on completion** — their durable evidence lives in this file (Phases 3.5 /
> 4 / 4.5 / 3E) and in git history. **Inline `plan/H*.md` links below are historical; those
> files no longer exist.**
>
> **Same convention applies to every completed per-task file since** — `plan/F1..F8`,
> `plan/4C-*`, and `plan/P1..P6` were all deleted on completion (2026-07-24 cleanup);
> their evidence is in this file's checklist and in git. **Any `plan/…md` link below
> pointing at an `F*`/`4C`/`P1`–`P6` file is likewise historical.** The live plan index is
> **[`plan/README.md`](plan/README.md)**; the active Phase 5 detail is
> **[`plan/P7-plus-phase5-completion-plan.md`](plan/P7-plus-phase5-completion-plan.md)**.
>
> **Phase 3.5 (Stabilization)** completed 2026-07-20, merged to `main`; 3.5B.2 (row
> locking) was promoted `[/]` → `[x]` on 2026-07-21 after H9/H10 concurrency-tested it.
> **Phase 4.5 (Finance Ledger, RBAC, Audit, API Hardening)** = the H-track: 4.5A (H11),
> 4.5B (H12), 4.5C + 4.5D (H13); **H14** added customer payments; **H15** wired the full
> intake→close flow into an e2e test (both gaps later closed by **H17** + a Playwright
> walk); **H16** is the ongoing module-migration rule.
>
> **Track F (F1–F8) is complete** (2026-07-23, all same-day — see
> [`plan/README.md`](plan/README.md) Progress section for evidence links): fixed flows
> that were wired but "lied" — orphaned technician assignment, "My Jobs" showing all
> tickets, dead `cancelled` status, no item edit, unguarded PO delete, orphaned
> `warranty_records`, dead Create-Ticket button, stale spec headers.
>
> **Phase 4C is also complete** (2026-07-23): 4C.1 (margin config endpoints, merged in
> from `phase-4/purchasing-completion`) + 4C.2 (server-side price validation, see
> [`plan/P1-margin-enforcement.md`](plan/P1-margin-enforcement.md)). **This closes
> Phase 4 entirely.**
>
> **The continuation plan is [`plan/README.md`](plan/README.md).** Next: **Phase 5**
> (Core UI Polish) — read that file's Phase 5 table before starting; detailed `5.*.md`
> task files are authored when that phase actually starts, same convention as Track F.
>
> **Still open, unrelated to Phase 4:** 2A.1 (register endpoint → Phase 5.10), 3B.5
> (Kanban board → Phase 5.2).

---

## ⚠️ Definition of Done (MANDATORY)

A task may only be marked `[x]` when **one** of the following exists:

1. A passing automated test, **or**
2. A recorded API request + response showing the expected result, **or**
3. For frontend-only work, a screenshot or a written click-path that was actually walked

**"I wrote the code and it looked correct" is not done.** Every incorrect `[x]` found
in the 2026-07-20 audit was written in good faith by someone who had just finished
writing the code and had not run it end to end.

If you cannot produce evidence, mark the task `[/]` (in progress) and say what is
missing.

---

## Git Workflow (MANDATORY for all AI Agents)

- **Branch per phase:** `phase-1/project-setup`, `phase-2/flow-engine`, etc.
- **Commit after each task:** Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- **Merge to main** after a phase is fully verified
- **Before starting work:** Check current branch with `git branch`
- **Never commit to `main` directly** — always work in a phase branch

> **Branch debt — RESOLVED 2026-07-23 (again).** After the H-track merge above, `main`
> diverged a second time: `phase-4/purchasing-completion` picked up 4C.1, while a
> separate `track-f/honesty-fixes` branch (forked from the same H-track tip) did
> Track F (F1–F8) and later merged `phase-4/purchasing-completion` into itself before
> finishing 4C.2. Both were strict ancestors of `track-f/honesty-fixes` with zero
> unique commits of their own by the time Phase 4 closed, so `main` was fast-forwarded
> straight to `track-f/honesty-fixes`'s tip (`60306ce`) — a real merge was never
> needed. Both `phase-4/purchasing-completion` and `track-f/honesty-fixes` were then
> deleted (local + remote) since nothing in them exists outside `main`'s history now.
> **Phase 5 work starts on `phase-5/core-ui`, branched fresh from this `main`.**
>
> **Merged 2026-07-24.** `main` never diverged from `phase-5/core-ui` — every Phase 5
> commit (P1.5 through P9, 32 commits) landed there and nowhere else — so the merge to
> `main` was a clean fast-forward to `26f06f4`, no real merge commit needed.
> `phase-5/core-ui` is kept (not deleted) since it points at the same commit as `main`.
> **Phase 6 work should start on a fresh `phase-6/printer` branched from this `main`.**

---

## PHASE 0 — Documentation Consolidation ✅ COMPLETE
> **Goal:** Merge docs/ + books/ into specification/, create feature catalog, clean up project.

- [x] 0.0 Create `specification/coding-guidelines.md` (Coding Standards)
- [x] 0.1 Create `specification/` folder structure (12 core docs)
- [x] 0.2 Create `specification/features/` — Feature Catalog (14 docs)
- [x] 0.3 Create `specification/frameworks/` — Business Frameworks (5 docs)
- [x] 0.4 Add `DEPRECATED.md` to `docs/` and `books/`
- [x] 0.5 Update CLAUDE.md to point to `specification/`
- [x] 0.6 Delete `frontend/` folder
- [x] 0.7 Delete `backend/` folder
- [x] 0.8 Verify: all specification files exist

---

## PHASE 1 — Project Setup, Cleanup & Database ✅ COMPLETE
> **Goal:** Clean root, init git, setup monorepo (BE + FE), push schema to local PostgreSQL.

### 1A. Root Cleanup
- [x] 1A.1 Delete unused files: `ROADMAP.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- [x] 1A.2 Delete unused folders: `glossary/`, `templates/`, `scripts/`, `assets/`, `implementation plan/`
- [x] 1A.3 Delete old package files: `package.json`, `pnpm-lock.yaml`, `node_modules/`
- [x] 1A.4 Update `.gitignore` (node_modules, .env, dist, .drizzle, etc.)

### 1B. Git Initialization
- [x] 1B.1 Initialize git repo (or reinitialize if `.git` exists)
- [x] 1B.2 Create initial commit with current state
- [x] 1B.3 Create branch `phase-1/project-setup`

### 1C. Backend Setup (flowserv-api/)
- [x] 1C.1 Create `flowserv-api/` with `package.json`
- [x] 1C.2 Install dependencies: hono, @hono/node-server, drizzle-orm, pg, zod, drizzle-zod, dotenv, @hono/zod-validator
- [x] 1C.3 Install dev dependencies: typescript, tsx, vitest, drizzle-kit, @types/pg
- [x] 1C.4 Move `db/schema.ts` → `flowserv-api/src/db/schema.ts`
- [x] 1C.5 Move `drizzle.config.ts` → `flowserv-api/drizzle.config.ts`
- [x] 1C.6 Create `flowserv-api/src/db/connection.ts` (database connection)
- [x] 1C.7 Create `flowserv-api/src/lib/response.ts` (standardized API response helper)
- [x] 1C.8 Create `flowserv-api/src/middleware/error-handler.ts`
- [x] 1C.9 Create `flowserv-api/src/index.ts` (entry point + health check `/v1/health`)
- [x] 1C.10 Create `.env` with DATABASE_URL
- [x] 1C.11 Run `npx drizzle-kit push` — verify tables exist in PostgreSQL
- [x] 1C.12 Verify: `npm run dev` starts, `GET /v1/health` returns `{ data: { status: "ok" } }`

### 1D. Frontend Setup (flowserv-web/)
- [x] 1D.1 Create SvelteKit project in `flowserv-web/`
- [x] 1D.2 Install dependencies: tailwindcss, shadcn-svelte
- [x] 1D.3 Create `flowserv-web/src/lib/api/client.ts`
- [x] 1D.4 Create basic layout with sidebar placeholder
- [x] 1D.5 Create health check page that calls `/v1/health`
- [x] 1D.6 Verify: `npm run dev` starts, health check page shows "API Connected"

### 1E. Seed Data
- [x] 1E.1 Create `flowserv-api/src/db/seed.ts`
- [x] 1E.2 Add script to `package.json` (`"db:seed": "tsx src/db/seed.ts"`)
- [x] 1E.3 Write seed data for `roles` (Super Admin, Manager, Technician, Cashier)
- [x] 1E.4 Write seed data for one default `tenant`
- [x] 1E.5 Write seed data for one `user` (Super Admin) linked to Demo tenant —
      **this was a false positive until task 09 (2026-07-20).** The user existed but
      was never actually linked to the Super Admin role — no `user_role_assignments`
      row was ever inserted, so the seeded admin logged in as `'no-role'`. Genuinely
      true now.
- [x] 1E.6 Run `npm run db:seed` and verify data in database
- [x] 1E.7 Commit: "feat: phase 1E complete - seed data"

### 1F. Final Verification
- [x] 1F.1 Backend starts and connects to PostgreSQL
- [x] 1F.2 Frontend starts and health check passes
- [x] 1F.3 Verify all files follow strict typing rules (`no implicit any`)
- [x] 1F.4 Commit: "feat: phase 1 completed - system verification"
- [x] 1F.5 Merge `phase-1/project-setup` → `main` — was never done at the time;
      resolved 2026-07-20 by 3.5D.1, which merged all accumulated work to `main`.

---

## PHASE 2 — Auth + Flow Engine (BE + FE)
> **Goal:** Build authentication + the modular workflow engine. Display results in UI.
> **Read first:** specification/02-architecture.md, specification/03-rbac-roles.md
> **Branch:** `phase-2/auth-flow-engine`

### 2A. Authentication (BE + FE)
- [/] 2A.1 BE: Auth routes — login works; **register endpoint does not exist**
- [x] 2A.2 BE: Auth middleware (verify JWT, extract tenant_id)
- [x] 2A.3 FE: Login page (form → call API → store token)
- [x] 2A.4 FE: Protected layout (redirect to login if no token)
- [x] 2A.5 Verify: login works, protected pages redirect

### 2B. Flow Engine Core (BE)
- [x] 2B.1 Flow Template CRUD (read/write FlowTemplate + FlowNode from DB)
- [x] 2B.2 Transition validation engine — now enforced (Phase 3.5A.1/A.2). Verified
      live: `Intake → Diagnosis` returns 200; `Intake → Completion` returns 409
      `TRANSITION_NOT_ALLOWED`.
- [x] 2B.3 Stage history recording (TicketStageHistory — append-only)
- [x] 2B.4 Event emission on state change — `FlowEngine.executeTransition` performs the
      DB update and emits `TICKET_STAGE_CHANGED` on every successful transition. The
      finance ledger now subscribes (H11, `subscribeLedger()`), and other events were
      added across the H-track (`event-bus.ts`).
- [x] 2B.5 **Unit tests** — transition validation, invalid transitions, permission checks
      — done in 3.5C.3, now `flow-engine/__tests__/engine.test.ts` (moved in H16). The
      repo now has 126 unit + 20 e2e tests passing; `npm test` is green (was `exits 1`).

### 2C. Flow Engine Visualization (FE)
- [x] 2C.1 FE: Flow template list UI
- [x] 2C.2 FE: Flow detail view (visualize nodes and transitions)
- [x] 2C.3 Merge `phase-2/auth-flow-engine` → `main` — was never done at the time;
      resolved 2026-07-20 by 3.5D.1.
- [x] 2C.4 Git commit: `feat: phase 2 complete — auth + flow engine`

---

## PHASE 3 — Vertical Slice: One Complete Service Flow (BE + FE)
> **Goal:** Build ONE end-to-end flow with both API and UI.
> **Read first:** specification/features/02-service.md, specification/features/06-inventory.md
> **Branch:** `phase-3/vertical-slice`

### 3A. Customer & Device (BE + FE) ✅
- [x] 3A.1 BE: Customer CRUD endpoints
- [x] 3A.2 BE: Device (CustomerAsset) CRUD endpoints
- [x] 3A.3 FE: Customer list + create form
- [x] 3A.4 FE: Device list + create form

### 3B. Service Ticket (BE + FE)
- [x] 3B.1 BE: Create ticket (intake) — with Zod validation
- [x] 3B.2 BE: Transition ticket to next stage (uses Flow Engine) — now genuinely
      enforces the flow template's transition rules; see Phase 3.5A.1/A.2
- [x] 3B.3 BE: Get ticket detail + stage history
- [x] 3B.4 FE: Ticket creation form (select customer, device, complaint)
- [ ] 3B.5 FE: Ticket Kanban board (columns = flow nodes, drag-drop)
- [x] 3B.6 FE: Ticket detail page (timeline, current stage, actions)

### 3C. Inventory + FIFO (BE + FE)
- [x] 3C.1 BE: Inventory item CRUD
- [x] 3C.2 BE: Batch creation (goods receipt → FIFO batch)
- [x] 3C.3 BE: Parts reservation (soft-lock) — built in **H10**. `generateQuotation`
      reserves every part charge (`stock_levels.quantityReserved`), POS checkout
      rejects a sale that would dip into reserved stock (422 `INSUFFICIENT_SELLABLE`).
      See `plan/README.md` H10.
- [x] 3C.4 BE: Parts consumption from a ticket (hard deduction, FIFO order) — built in
      **H9**. `POST /v1/tickets/:id/charges/:chargeId/consume` runs shared `consumeStock()`
      (FIFO), writes `stock_movements` with `reference_type='ticket_consumption'`. See
      `plan/README.md` H9.
- [x] 3C.5 FE: Inventory list page (stock levels, alerts)
- [x] 3C.6 FE: Stock receipt form (add batch)

### 3D. POS + Finance (BE + FE)
- [x] 3D.1 BE: POS transaction + invoice generation
- [x] 3D.2 BE: Payment processing (partial/full) — built in **H14**. `customer_payments`
      table + `POST /v1/pos/invoices/:id/payments`; partial/deposit/settlement with
      `amountPaid` tracking, OVERPAYMENT/ALREADY_PAID guards. See `plan/README.md` H14.
- [x] 3D.3 BE: Finance ledger posting (COGS, revenue) — built in **H11**. Event-driven
      posting to `financeLedgerEntries` on POS checkout/void, ticket consumption, and
      supplier invoice/payment; the FIFO cost is no longer discarded. See `plan/README.md` H11.
- [x] 3D.4 FE: Simple POS page
- [x] 3D.5 FE: Payment form — built in **H14**. Pay modal on `InvoiceDetailModal.svelte`
      + new `/finance/receivables` page. See `plan/README.md` H14.
- [x] 3D.6 **Unit tests** — FIFO batch split, ledger accuracy, stock levels — built across
      **H4–H14** (`lib/__tests__/fifo.test.ts`, `modules/finance/__tests__/ledger.test.ts`,
      `lib/__tests__/stock-lifecycle.test.ts`, and more; 126 unit + 20 e2e passing).

### 3E. Verify Full Flow — delivered by **H15** (+ H17), see `plan/README.md`
- [x] 3E.1 Test full flow: Intake → Diagnosis → Approve → Reserve Part → Repair → Invoice → Pay → Close
      — automated integration test `src/__tests__/e2e-service-flow.test.ts` (21 tests) walks
      the whole path through the real HTTP routes against a dedicated `flowserv_test`
      database. Plus a real in-browser Playwright walk (`flowserv-web/e2e/intake-to-close.spec.ts`)
      of intake→close (H15 gap b, closed 2026-07-23).
- [x] 3E.2 Verify: stock decreased by exactly the consumed qty, ledger entries created,
      ticket closed (`status='closed'`, `closedAt` set), reconciliation clean, margin positive.
      Full-repair invoicing (parts+labor) via **H17** `POST /tickets/:id/invoice`, revenue = grandTotal.
- [x] 3E.3 Git commit — H15 on `phase-4/purchasing-completion` (`6543c07`); the two follow-up
      gaps closed by **H17** (`4c6471f`, service invoice from ticket) and the Playwright walk
      (`667cb53`).

> **Update 2026-07-23:** 3E was previously impossible (diagnosis, approval, reservation,
> ticket-linked consumption, ledger posting, and closure did not exist). Phases 3.5 and the
> Hardening Track (H9/H10/H11/H14) built all of them, **H15** wired them into one passing
> end-to-end test, and **H17** + the Playwright walk closed H15's two documented gaps
> (parts invoicing without double-deduct; the literal in-browser click-through). 3E is now
> fully `[x]`.

---

## PHASE 3.5 — Stabilization ✅ COMPLETE (2026-07-20)
> **Goal:** Fix the defects found in the 2026-07-20 audit. Make the checkboxes honest.
> **Branch:** all work landed on `phase-4/purchasing`, merged to `main` by 3.5D.1.
> **Rule:** No new features. Only fixes, tests, and the merge to main.
>
> **Outcome:** 9 tasks, 11 numbered bugs fixed, 37 tests added (from zero). The
> scaffolding that drove this phase (`RECOVERY-PLAN.md` and `plan/`) was deleted on
> completion — its durable output is this file, the Definition of Done above, and the
> Architecture Debt section below.

### 3.5A. P0 — Correctness & Security
- [x] 3.5A.1 Fix BUG-01: `if (!allowed.valid)` in `routes/tickets.ts`. Return **409**
      for invalid transition, **403** for permission failure, include the `reason`.
- [x] 3.5A.2 Fix BUG-02: validate `targetNodeId` belongs to the ticket's flow template;
      add `tenantId` filter to both queries in `FlowEngine.validateTransition`
- [x] 3.5A.3 Fix BUG-03: use the `allReceived` flag — set PO status to `partial` vs `received`.
      Also fixed the same bug's frontend surface: the receive page hard-blocked any
      status other than `'ordered'`, the orders list filtered `'partial'` out
      entirely, and the receive form defaulted to the full original quantity
      instead of what's still owed. All fixed together — see commit for task 04.
- [x] 3.5A.4 Fix BUG-04: increment `receivedQuantity` instead of overwriting. Also
      added an over-receipt guard (422-shaped, pending BusinessError from task 05).
- [x] 3.5A.5 Fix BUG-05: verify `lineId` belongs to the order and tenant before updating
- [x] 3.5A.6 Fix BUG-11: include role **name** in the JWT; fix the sidebar role check in
      `(app)/+layout.svelte` (currently compares a UUID to `'Super Admin'`, so real users
      see only "Dashboard")

### 3.5B. P1 — Data Integrity
- [x] 3.5B.1 Fix BUG-06: set `status='closed'` and `closedAt` when entering a terminal node.
      Detected structurally (a node with no outgoing `flowTransitions` rows), not by
      name, so it works for any flow template. Verified live: transitioned a real
      ticket to Completion, `GET /v1/tickets/:id` showed `status: "closed"` with a
      populated `closedAt`.
- [x] 3.5B.2 Fix BUG-07: add `SELECT ... FOR UPDATE` row locking on batch/level reads
      in POS checkout, purchasing receive, and opname (also applied to the manual
      inventory receive path, which had the same lost-update shape). **Now
      concurrency-tested** (was `[/]` "code-reviewed, not load-tested" until 2026-07-21):
      **H9** fired two simultaneous ticket-charge consumptions of the last unit — one
      200, one 409, exactly one `stock_movements` row; **H10** fired two simultaneous
      quotations reserving the last unit — one 201, one 422, loser rolled back cleanly.
      Both prove the `FOR UPDATE` locks serialize the race, not request ordering. See
      `plan/README.md` H9 & H10.
- [x] 3.5B.3 Fix BUG-08: stop swallowing POS errors — log them, and return **422**
      `INSUFFICIENT_STOCK` instead of a generic 500. Verified live: selling 1 unit of
      a zero-stock item now returns 422 with code `INSUFFICIENT_STOCK` (was a generic
      500 with no logged cause).
- [x] 3.5B.4 Fix BUG-09: extracted `calculateWac()` as the single implementation,
      previously duplicated three times (purchasing/invoices.ts, opname.ts, and
      missing entirely from inventory/receipts.ts, which is *why* it was
      inconsistent). The manual receive path now actually recalculates WAC.
- [x] 3.5B.5 Fix BUG-10: guard void so restored quantity cannot exceed
      `quantityReceived` (409 `VOID_CONFLICT`). Also added a second double-void guard
      checking `stockMovements` directly, not just `paymentStatus`. Verified live:
      voiding an invoice twice returns 409 `ALREADY_VOIDED` on the second attempt.
- [x] 3.5B.6 GAP-01: add `POST /v1/finance/payables/:id/payments` so supplier debt can
      actually be settled (completes 4A.3). Built as `modules/finance/{service,types}.ts`
      per coding-guidelines §6 — the first module in this shape, per the incremental
      retrofit rule in Architecture Debt below. Also added
      `GET /v1/finance/payables/:id` for payment history, and
      wired the previously-dead "Bayar" button in `PayablesTable.svelte` to a real modal.
      Discovered `supplier_payments` table + relations already existed in the schema
      and live DB (unused) — used it as-is rather than creating a duplicate table.
      Verified live end-to-end: partial payment (400k of 1M) → status `partial`;
      overpayment attempt (999999 against a 600k remaining balance) → 422
      `OVERPAYMENT`, balance untouched; completing payment (600k) → status `paid`;
      further payment attempt → 409 `ALREADY_PAID`; payment history via `GET /:id`
      shows both records newest-first; invoice correctly drops off the outstanding
      payables list once paid. 6 new tests (37 total).

### 3.5C. P1 — Testing Foundation
- [x] 3.5C.1 Add `vitest.config.ts` and fix the `test` script in `flowserv-api/package.json`
- [x] 3.5C.2 Extract `flow-engine` logic so it is testable without HTTP (start of decision D1)
- [x] 3.5C.3 **Tests:** transition validation — valid, invalid, missing permission, cross-tenant
- [x] 3.5C.4 **Tests:** FIFO batch splitting and consumption order (`lib/fifo.ts`,
      6 tests, including the 5@10k/5@12k split-across-two-batches case)
- [x] 3.5C.5 **Tests:** stock level arithmetic across receive → sell → void
      (`lib/__tests__/stock-lifecycle.test.ts`, including the BUG-10 guard case)
- [x] 3.5C.6 Verify `npm test` passes (31/31, re-confirmed after task 08 — backend untouched)

### 3.5E. Deployment Config & Seed Data
> Added 2026-07-20 after the audit found these while working on 3.5A. Both are
> prerequisites for later phases rather than defects in current behaviour.

- [x] 3.5E.1 Replace the 35 hardcoded `localhost:3001` URLs in **client-side** code
      (20 files under `lib/states/` and `*.svelte`) with an env-backed constant, and
      commit `.env.example` files. Server-side (`+page.server.ts`) stays as-is until
      Phase 11. Added `lib/api/config.ts` as the single definition; `lib/api/client.ts`
      now imports from it instead of recomputing it. Verified: grep for
      `localhost:3001` across `*.svelte.ts`/`*.svelte` is empty (44 server-side
      occurrences in 28 files untouched, as intended); `npm run check` 0 errors;
      SSR-rendered all touched pages (customers, inventory, POS, tickets, brands,
      categories, an item detail, a PO detail) with a real login cookie — all 200;
      confirmed via the dev server's transformed module that `API_BASE` resolves
      identically to the old hardcoded value under the current `.env`.
- [x] 3.5E.2 Fix `db/seed.ts`: assign the Super Admin role (no user currently gets
      *any* role), make the seed idempotent, switch to bcrypt. Then remove the
      `'no-role'` full-menu fallback in `(app)/+layout.svelte`.
      **Must be done before 4.5B** — RBAC cannot be tested while every user is
      `'no-role'`.
      Rewrote the seed as find-or-create throughout, so it was safe to run against
      the existing dev database (preserving all data accumulated across tasks 01–08)
      rather than wiping it. Verified: ran it twice — first run reused the existing
      tenant/branch/roles/user and added the one genuinely missing piece (the role
      assignment); second run created nothing (`SELECT COUNT(*)`: 1 tenant, 4 roles,
      1 assignment). Login now returns `roleName: "Super Admin"`. A freshly-hashed
      password starts with `$2b$` and is 60 chars (confirmed via bcryptjs directly),
      not the old 64-char SHA-256 hex — the existing admin's own hash was left
      untouched by the find-or-create, so it's still SHA-256 and still logs in via
      the legacy branch in `routes/auth.ts`, exactly as intended (that branch stays
      until Phase 11). Removed the `'no-role'` fallback in `+layout.svelte` and added
      a visible amber notice for unassigned users instead of a silent empty menu.
      SSR-verified with a real login cookie: full menu renders, badge reads
      `Super Admin`, no-role notice correctly absent.

### 3.5D. Branch Hygiene & Docs
- [x] 3.5D.1 Merge current work → `main` (resolves the orphaned 1F.5 and 2C.3)
- [x] 3.5D.2 Branch fresh from `main` for the next phase
- [x] 3.5D.3 Add implementation-status headers to all 14 `specification/features/*.md`
      (decision D4). Each now states what is actually built vs not, derived from the
      verified endpoint inventory — so the catalog stops reading as current scope.
- [x] 3.5D.4 Git commit: `fix: phase 3.5 complete — stabilization`

---

## PHASE 4 — Purchasing, Supplier Debts, & Margins ✅ COMPLETE (2026-07-23)
> **Goal:** Supplier Management, Purchasing (Costing), AP (Hutang), Dynamic Margin Pricing.
> **Branch:** `phase-4/purchasing` (4C.2 landed on `track-f/honesty-fixes`, which had
> already merged `phase-4/purchasing-completion` in — see Architecture Debt / branch notes).
> **Status:** genuinely complete — every item below is `[x]` with live-verified evidence,
> closing the "marked complete prematurely" problem this file used to flag.

### 4A. Supplier & Hutang (Accounts Payable)
- [x] 4A.1 BE: Create Supplier CRUD routes & schema
- [x] 4A.2 FE: Supplier Management page
- [x] 4A.3 BE: AP routes for tracking supplier debts — now supports recording
      payments and settling debt. See 3.5B.6.
- [x] 4A.4 FE: Manajemen Hutang Supplier page (with aging/tempo limits)

### 4B. Purchasing (PO & Costing)
- [x] 4B.1 BE: Purchase Order routes (receiving goods, updating stock_batches)
- [x] 4B.2 FE: Input Invoice/Costing page (Payment Method: Tunai, Transfer, Tempo)
- [x] 4B.3 BE: Auto-calculate `dueDate` based on Supplier's `paymentTermDays`
- [x] 4B.4 FE: Auto-fill due date when selecting 'Tempo'

> ⚠️ 4B.1 carries BUG-03, BUG-04, and BUG-05. Fixed in Phase 3.5.

### 4C. Dynamic Margin Pricing
> **Specced in detail: [`plan/4C-margin-config-and-validation.md`](plan/4C-margin-config-and-validation.md)** (closes 4C.1/4C.2/4C.5).
- [x] 4C.1 BE: Margin Config (Markup/GrossMargin, Target %) — **done 2026-07-23.**
      New pure `lib/margin.ts` (`resolveMarginConfig` item→category→default, `recommendedPrice`
      for both strategies, `grossMarginPct`/`markupPct`, `meetsTarget`, `validateTargetMargin`),
      25 unit tests. Config setters added: `PATCH /v1/categories/:id` (+ margin fields now
      accepted on category create) and `PATCH /v1/inventory/:id` (margin config + sellingPrice +
      light master fields) — both tenant-scoped, RBAC-gated (`catalog.manage` / `inventory.manage_items`),
      audited, and reject a `gross_margin` target ≥ 100 with 400 `VALIDATION_ERROR`. FE: category
      page now shows Margin Strategy / Target % columns and a real edit modal (the previously-dead
      "Edit" button) plus margin fields in the create modal. Verified live (Super Admin, curl):
      create-with-margin 201; PATCH category markup 35→gross_margin 40 200; gross_margin 100 → 400;
      non-existent id → 404; item PATCH markup 50%+price 200; item gross_margin 120 → 400; clear
      override (null,null) keeps price. `npm test` 162 passing (was 137, +25); `tsc` + `svelte-check`
      clean.
- [x] 4C.2 BE: Server-side price validation on every write site — **done 2026-07-23**,
      see [`plan/P1-margin-enforcement.md`](plan/P1-margin-enforcement.md). New pure
      `evaluatePriceAgainstMargin()` in `lib/margin.ts` (9 tests) + DB-touching
      `resolveItemMarginConfig()`/`assertPriceAllowed()` in `modules/inventory/service.ts`,
      wired into all four price-write sites: `PATCH /v1/inventory/:id`,
      `PUT /v1/inventory/:id/brands/:brandId` (the simulator's "Apply price"),
      `POST /v1/purchasing/orders/:id/invoice` (PO costing — WAC recalculation was
      reordered ahead of the price write so the check sees the just-updated cost),
      and `POST /v1/opname`. Below-cost is a hard 422 `PRICE_BELOW_COST` unless
      `allowBelowCost: true`; below-target-but-above-cost saves with a `marginWarning`
      in the response. "New stock arrives" half: `GET /v1/inventory` (+ `/:id`) now
      compute `marginStatus` on read from the live WAC — no schema/write-path change,
      so a price never silently drifts out of sync with what's on screen. Verified live
      (curl): PATCH below target → 200 + warning; PATCH below cost → 422, retried with
      `allowBelowCost` → 200; opname-received a unit at 2× cost with no price in the
      request → `GET` shows the unchanged price now `marginStatus: 'below_target'`;
      brand-price PUT same enforcement; PO invoice below new WAC → 422 + PO stays
      `'received'` (not `'completed'`), reconciliation clean throughout; valid PO
      invoice → 200 + `marginWarnings` array. `npm test` 179 unit (+9) + 21 e2e; `tsc` +
      `svelte-check` clean. Also fixed a latent bug found while wiring this: the
      pre-existing `targetMargin` format-validation on item PATCH resolved the
      effective strategy as `item ?? DEFAULT`, skipping the category fallback
      entirely — the new price check uses the correct item→category→default
      resolution instead.
- [x] 4C.3 FE: Show warning if new price changes drastically or modal > margin limit
- [x] 4C.4 FE: Inventory page enhancements (margin column, filter/sort by margin)
- [x] 4C.5 Git commit — closes Phase 4 entirely.

---

## PHASE 4.5 — Finance Ledger, RBAC & Audit ✅ COMPLETE (Hardening Track H11–H14)
> **Goal:** Build the three cross-cutting foundations that have schema tables but no code.
> **Read first:** specification/features/10-finance.md, specification/03-rbac-roles.md
> **Branch:** actually landed on `phase-4/purchasing-completion` (the H-track branch),
> not `phase-4.5/foundations` — the H-track absorbed this phase (see `plan/README.md`).
>
> **Why this phase exists:** the old Quick Reference table listed Phase 4 as
> "RBAC + Audit" while the phase body said Purchasing. Both fell into that gap. This
> gives them a home. These are MVP features (FIN-007, PLT-003, PLT-006) and everything
> downstream — dashboards, reports, the customer portal — depends on them.

### 4.5A. Finance Ledger (FIN-007, FIN-010)
> **Completed 2026-07-21 as [H11](plan/H11-finance-ledger.md)** — see `plan/README.md`
> Stage 4 for the full writeup (event wiring, live API run, backfill against a
> synthetic historical invoice, frontend SSR verification). Posted via the
> existing event bus (`services/event-bus.ts`), not inline in route handlers —
> `POS_SALE_COMPLETED`/`POS_SALE_VOIDED`/`TICKET_PART_CONSUMED`/
> `SUPPLIER_INVOICE_CREATED`/`SUPPLIER_PAYMENT_RECORDED`, each emitted after its
> owning transaction commits.
- [x] 4.5A.1 BE: Post COGS + revenue to `financeLedgerEntries` on POS checkout
      (the FIFO code already computes the cost — currently discarded)
- [x] 4.5A.2 BE: Post reversal entries on invoice void
- [x] 4.5A.3 BE: Post AP entries on supplier invoice creation and payment —
      posted as `entryType: 'adjustment'`, not a new type; `supplierInvoices`/
      `supplierPayments` remain the real source of truth for AP balance (no
      chart-of-accounts liability account built here, per the task's own
      "resist scope creep" instruction).
- [x] 4.5A.4 GAP-06: delete the dead `posTransactions` / `invoiceLines` schema, or migrate
      onto it — do not leave two competing POS models. Resolved by
      [H1](plan/H1-delete-dead-schema.md), not H11 — verified during H11 that
      neither table exists in `db/schema/pos.ts` anymore, only `posInvoices`/
      `posInvoiceLines`.
- [x] 4.5A.5 **Tests:** ledger accuracy — COGS matches consumed batch cost, entries balance.
      `npm test`: 100/100 passing (15 new: `modules/finance/__tests__/ledger.test.ts`,
      `lib/__tests__/ledger-reconciliation.test.ts`).
- [x] 4.5A.6 FE: simple ledger view (Simple Mode per DAS-004) — new
      `/finance/ledger` page, SSR-verified with a real login cookie.

### 4.5B. RBAC Enforcement (PLT-003) ✅ COMPLETE (2026-07-21, [H12](plan/H12-rbac.md))
> Report-only-first, three-stage rollout — see H12 for the full design and the
> lockout risk it exists to mitigate. `RBAC_MODE=enforce` is now live; the
> break-glass (`RBAC_MODE=report`, no code change) is documented in this file's
> top section and was itself tested, not just written.
- [x] 4.5B.1 BE: `middleware/rbac.ts` — `evaluateRbac()` is the pure decision
      (Super Admin bypass, granted-allow, enforce-deny, report-log-but-allow),
      `requirePermission(code)` is the thin DB-fetching wrapper around it,
      mirroring the `evaluateTransition`/`FlowEngine` split in
      `flow-engine/engine.ts` (moved there from `services/flow-engine.ts` in H16).
      Typed as Hono's `MiddlewareHandler` — a bare
      `(c: Context, next: Next)` signature silently collapsed route path-param
      typing in every file it was inlined into (`c.req.param()` degraded to
      `string | undefined`), which cascaded into ~24 spurious Drizzle
      "no overload matches" errors elsewhere in the same files. Caught by
      `npx tsc --noEmit` before commit, not left for review to find.
- [x] 4.5B.2 BE: `db/seed/01-core.ts` — catalog extended from the spec's 10
      actions to 20 coarse, resource-level codes (one per resource+action
      group, e.g. every ticket-charges mutation shares `ticket.manage_charges`)
      to actually cover the ~37 mutating handlers that existed with zero
      permission code. Idempotent (`onConflictDoNothing`, fixed UUIDs in
      `ids.ts`) per the existing seed pattern. Verified: re-running
      `npm run db:reset` produces the same 20 permissions / 19 Manager grants /
      4 Technician grants / 2 Cashier grants / 20 Super Admin grants every time.
- [x] 4.5B.3 BE: `requirePermission(code)` applied inline to all 37 mutating
      handlers across the 16 route files that have them. One handler
      (`POST /:id/transition` in `tickets.ts`) is deliberately left ungated at
      the route level — it's already gated by the flow engine's own
      per-target-node `requiredPermissionId` check, which varies per node and
      can't be expressed as one static route-level code; documented inline.
      Also populated `flow_nodes.requiredPermissionId` on the Diagnosis node
      (`ticket.diagnose`) — this is the first time `evaluateTransition`'s
      `PERMISSION_DENIED` branch has ever run against real data (previously
      0 of 5 nodes had it set, so the branch was unit-tested only). Verified
      live: Cashier → Intake→Diagnosis returns 403 `PERMISSION_DENIED`;
      Technician → same transition succeeds.
- [x] 4.5B.4 **Tests:** `middleware/__tests__/rbac.test.ts` — 4 tests on the
      pure `evaluateRbac` decision (grant allows in both modes, Super Admin
      bypasses with zero grants, report mode logs-but-allows, enforce mode
      blocks). `npm test`: 104/104 passing (100 pre-existing + 4 new).
      Tenant isolation verified live rather than as an automated test, matching
      how the codebase already treats this class of check (flow-engine's
      cross-template guard is pure-tested; cross-tenant HTTP behavior is not
      separately re-tested elsewhere either): second tenant's admin token
      requesting the first tenant's ticket returns 404 `NOT_FOUND`, not 403.
      Full report/enforce/break-glass verification (all via real login +
      curl against a locally reset DB, not just code review):
      - Report mode: 10 mutating calls across all 4 seeded roles: every
        legitimately-denied action logged `[RBAC] would deny: user=... role=...
        perm=... METHOD /path`; every legitimately-allowed action logged nothing.
      - Enforce mode: Cashier voiding a POS invoice → 403 `PERMISSION_DENIED`
        naming `pos.void_transaction`; Manager doing the same → passes the
        permission check through to a business-layer 404 `NOT_FOUND` (invoice
        doesn't exist); Cashier creating a supplier → 403 naming
        `supplier.manage`; Super Admin creating a supplier → 201, despite an
        empty grant set, proving the bypass doesn't depend on `role_permissions`
        contents.
      - Break-glass: restarted the server with `RBAC_MODE` unset (defaults to
        `'report'`) — the same previously-403'd Cashier action succeeded again,
        with no code change, confirming the documented recovery path actually
        works and isn't just a comment.

### 4.5C. Audit Log (PLT-006) ✅ COMPLETE (2026-07-21, [H13](plan/H13-api-hardening.md))
- [x] 4.5C.1 BE: `middleware/audit.ts` — runs `await next()` first, records only if
      `c.res.status < 400`, so a rolled-back mutation is never logged as having happened;
      `action` is an explicit `<entity>.<verb>`, `changes` is a per-route field allowlist
      (never a raw body dump). See `plan/README.md` H13.
- [x] 4.5C.2 BE: applied inline to all 37 mutating handlers across the 16 route files
      H12 catalogued. A replayed idempotent response is skipped (not double-logged).
- [x] 4.5C.3 FE/BE: `GET /v1/audit-logs` (`routes/audit-logs.ts`), gated by a new
      `audit.view` permission granted to no seeded role — only the Super Admin bypass
      reaches it (admin-only). Live-verified: Cashier/Manager 403, Super Admin 200.

### 4.5D. API Hardening ✅ COMPLETE (2026-07-21, [H13](plan/H13-api-hardening.md))
- [x] 4.5D.1 `lib/pagination.ts` — cursor pagination applied to `GET /v1/tickets`,
      `GET /v1/pos/invoices` (was hardcoded `limit: 100`), `GET /v1/inventory` (had no
      limit), and `GET /v1/audit-logs`. Found + fixed a real microsecond-precision cursor
      bug live (150-ticket walk, zero duplicates). See `plan/README.md` H13.
- [x] 4.5D.2 `lib/idempotency.ts` + `idempotency_keys` table; `Idempotency-Key` applied to
      `POST /v1/pos/invoices`, `POST /v1/tickets/:id/transition`,
      `POST /v1/tickets/:id/charges/:chargeId/consume`, and
      `POST /v1/finance/payables/:id/payments`. Concurrent-race tested live.
- [x] 4.5D.3 `BusinessError` class (`lib/errors.ts`) wired to the error handler — 409 and
      422 are returned throughout (INSUFFICIENT_STOCK, INSUFFICIENT_SELLABLE, OVERPAYMENT,
      CHARGE_LOCKED, VOID_CONFLICT, etc., all proven live across the H-track).
- [x] 4.5D.4 Git commit — landed as H13 on `phase-4/purchasing-completion` (commit `6d117f6`).

---

## PHASE 5 — Core UI Polish (FE) ✅ COMPLETE (2026-07-24)
> **Goal:** Build remaining essential UI screens and polish the experience.
> **Read first:** specification/08-ui-ux.md, specification/features/12-dashboard-reporting.md
> **Branch:** `phase-5/core-ui`
>
> **Status:** genuinely complete — P9 (Settings CRUD, 5.10) was the last remaining task;
> everything below is `[x]` or `[/]` with the deferral reason stated inline (widget
> framework, ticket attachments, technician Calendar/Schedule — each tracked in
> `plan/README.md`'s "Deferred / not built" table for the phase it actually belongs to,
> not silently dropped). Test baseline at close: **65 Playwright + 21 API e2e + 183
> backend unit**, all green; `svelte-check` 723 files 0 errors.

- [/] 5.1 Dashboard: Per-role default dashboards with widget layout — real-data half
      done 2026-07-23 as P3, see [`plan/P3-role-dashboards.md`](plan/P3-role-dashboards.md).
      `/` now shows live per-role widgets (Super Admin & Manager: open tickets by stage,
      low-stock alerts, AR/AP outstanding, today's sales; Technician: My Jobs; Cashier:
      today's sales + AR) computed server-side from existing endpoints, no new backend
      route. **Left `[/]` not `[x]`**: the interactive widget framework (WDG-002..006 —
      drag-and-drop repositioning, resize/collapse, per-user persisted layout,
      admin-controlled widget catalog) is deferred to a later task by explicit user
      decision — there was nothing to let users rearrange until this pass built the
      content. 5 Playwright tests (all 4 roles + mobile stacking), full e2e suite (17
      tests across P1.5/P2/P3) passing together; `svelte-check` 706 files 0 errors.
- [x] 5.2 Ticket Board: Kanban with status colors, filters (completes 3B.5) — done
      2026-07-23 as P2, see [`plan/P2-ticket-kanban-board.md`](plan/P2-ticket-kanban-board.md).
      Columns = flow nodes (`GET /v1/flows/:id`, ordered by `sequenceOrder`), cards =
      open tickets grouped by `currentNodeId`. Valid moves computed from
      `flowTransitions` edges, not column adjacency (the graph branches). Backend:
      `GET /v1/tickets` extended with `currentNodeId`/`flowTemplateId` plus `?status=`
      and `?flowTemplateId=` filters. Mobile-first: horizontal column scroll, tap-to-move
      panel is the one interaction every viewport shares; native HTML5 drag-and-drop is
      a desktop-only enhancement on top of the same `move()` call. 6 Playwright tests
      (mobile + desktop), all passing twice in a row with self-contained fixtures;
      live-verified 403 `PERMISSION_DENIED` (Cashier → Diagnosis) vs 200 (Super Admin);
      `npm test` 179 unit passing, `svelte-check` 703 files 0 errors.
- [/] 5.3 Ticket Detail: Timeline, cost breakdown, attachments — timeline +
      cost breakdown done 2026-07-23 as P4, see
      [`plan/P4-ticket-detail-polish.md`](plan/P4-ticket-detail-polish.md).
      Timeline now shows the actor name per stage (backend `GET /v1/tickets/:id`
      history query gained a `leftJoin` on `users`); cost breakdown upgraded from
      a plain text row to `StatCard` tiles (Pendapatan/Modal/Margin), plus the
      previously-fetched-but-never-shown `consumed` total now renders. The whole
      detail page went from zero responsive classes to a mobile-first stack
      (workspace above timeline below `lg`, unchanged side-by-side above it).
      **Left `[/]` not `[x]`**: attachments (before/after photos) explicitly
      deferred — no schema/upload/storage infra exists anywhere, and the spec
      itself marks PLT-009 Phase 2 (🟡), not MVP; storage strategy is a real
      decision for its own task, not something to bolt into a polish pass. 4
      new Playwright tests; full suite (21 tests across P1.5/P2/P3/P4 +
      intake-to-close + F7) passing together; `npm test` 179 unit passing;
      `svelte-check` 706 files 0 errors.
- [x] 5.4 Inventory Dashboard: Stock levels, low-stock alerts, batch history — done
      2026-07-23 as P6, see [`plan/P6-inventory-dashboard-gaps.md`](plan/P6-inventory-dashboard-gaps.md).
      Not a new page — stock levels + low-stock badges already existed on `/inventory`,
      and P3 already had a low-stock tile; the real gaps were narrow. Added: search +
      "Stok Menipis" filter on `/inventory` (client-side, full list already fetched);
      P3's dashboard tile now deep-links to `/inventory?lowStock=true` (previously went
      to a generic unfiltered page despite implying otherwise); batch history
      (`StockBatches.svelte`, INV-004) now shows supplier name, branch, received date,
      and quantity received — all already returned by the API, just unrendered before
      this. Frontend-only change. 5 new Playwright tests; full suite (30 tests) passing
      together; `svelte-check` 710 files 0 errors.
- [x] 5.5 Product Catalog: Browse by category, supplier price comparison — done
      2026-07-24 as P10, see [`plan/P7-plus-phase5-completion-plan.md`](plan/P7-plus-phase5-completion-plan.md).
      No new list endpoint: `GET /v1/inventory/:id` gained `productSuppliers`
      (with `supplier`) — the item↔supplier price-comparison relation already
      existed in the schema, was already seeded with real data ("supaya
      katalog & batch tidak saling bertentangan" — the seed comment itself
      anticipated this feature), but had zero routes or FE reading it, the
      same orphaned-data shape as the `warranty_records` table F6 deleted.
      New `/inventory/catalog`: browse-by-category card grid over the same
      list data the main table already fetches (category, brandPricing,
      totalAvailable), client-side search + category filter, linked from the
      sidebar and a new button on `/inventory`. Item detail page gained a
      `SupplierComparison.svelte` section next to the existing `BrandPricing`
      table — supplier name, last price, an "Utama" badge on the primary
      supplier — so brand and supplier price comparisons are both visible
      without leaving the page. 6 new Playwright tests (grouping, search,
      category filter, supplier-comparison content, list↔catalog cross-link,
      mobile no-overflow). Live-verified via curl: an item with two suppliers
      returns both with correct `isPrimary`/`lastPrice`. Full suite: 49
      Playwright + 183 backend unit passing; `svelte-check` 717 files 0 errors.
- [x] 5.6 POS/Cashier Screen: Touch-friendly, big buttons — done 2026-07-24 as
      P12, see [`plan/P7-plus-phase5-completion-plan.md`](plan/P7-plus-phase5-completion-plan.md).
      Most of "touch-friendly" already landed in P1.5 (stacked mobile layout,
      no fixed-width cart overflow); this targeted 375px audit over what P1.5
      didn't check found two real problems, not just polish: `CartSidebar.svelte`'s
      qty +/- stepper buttons were `px-2 py-1` (~24x22px, well under any
      touch-target guideline) — bumped to 40x40px with `aria-label`s.
      `DraftsModal.svelte`'s "Lanjutkan Pembayaran" and delete buttons were
      `opacity-0 group-hover:opacity-100` — a pattern that **never fires on a
      touchscreen** (no `:hover` state), making both buttons genuinely
      unreachable on the exact device this screen is built for, not merely
      small. Made them always-visible and bumped the delete button to 40x40px.
      5 new Playwright tests, including one that specifically asserts
      `toHaveCSS('opacity', '1')` rather than `toBeVisible()` — Playwright's
      visibility check does not treat `opacity: 0` as hidden, so a naive
      visibility assertion would have passed against the buggy code and missed
      the regression entirely. Full suite: 58 Playwright + 183 backend unit
      passing; `svelte-check` 717 files 0 errors.
- [x] 5.7 Global Search: grouped results — done 2026-07-24 as P8, see
      [`plan/P7-plus-phase5-completion-plan.md`](plan/P7-plus-phase5-completion-plan.md).
      New `GET /v1/search?q=` (`modules/search/service.ts`): tenant-scoped `ILIKE`
      across customers (name/phone), tickets (via joined customer name/phone +
      device brand/model/serial — tickets have no own free-text field), inventory
      items (name/sku/universal code), suppliers (name/contact); capped at 5 per
      type, grouped in the response. Substring match only — real typo-tolerance
      (fuzzy/trigram) explicitly deferred, noted so it isn't mistaken for scope
      creep later. FE: `GlobalSearch.svelte` in the app-shell header — desktop
      gets an inline input + dropdown, mobile (no room next to the hamburger at
      375px) gets an icon that opens a full-screen overlay; both debounced
      250ms, 2-char minimum, each result linking straight to its detail page.
      A bug where the hidden desktop dropdown silently duplicated the mobile
      overlay's results in the DOM (both driven by one shared `results` state)
      was caught by the e2e suite itself, not manual testing, and fixed before
      landing. 4 new backend unit tests (pure `buildLikePattern` helper) + 6
      new Playwright tests (customer/inventory/supplier lookups, sub-2-char
      hint, outside-click close, mobile overlay open/navigate/close). Live-
      verified via curl: case-insensitive match, cross-type grouping, 401
      without auth, empty results under the 2-char minimum. Full suite: 43
      Playwright + 183 backend unit passing; `svelte-check` 711 files 0 errors.
- [/] 5.8 Technician Dashboard: My Jobs (P3) + Quick Actions (P11) done; Calendar/Schedule
      deferred — done 2026-07-24, see [`plan/P7-plus-phase5-completion-plan.md`](plan/P7-plus-phase5-completion-plan.md).
      The "Tugas Saya" list on the Technician dashboard now shows quick-action
      buttons per ticket, computed server-side from the same fromNodeId
      edge-filter the Kanban board's `targetsFor()` already uses (per distinct
      `flowTemplateId` among the technician's assigned tickets, not hardcoded to
      one template) — so advancing a ticket doesn't require opening
      `/tickets/board`. Tapping a button calls the same `POST /:id/transition`
      the board's `move()` uses, then `invalidateAll()` refreshes in place. No
      backend change: `GET /v1/tickets` already returned `currentNodeId` +
      `flowTemplateId` (P2), and `GET /v1/flows/:id` already returned the node/
      transition graph. **Left `[/]` not `[x]`**: Calendar/Schedule (TECH-013)
      stays deferred — no scheduling data model exists anywhere in the schema,
      per the existing Part 3 deferred-items table; building one is a Phase 8
      decision, not something to improvise here. 4 new Playwright tests
      (forked-transition shows both buttons, clicking one moves the ticket and
      updates its badge — verified via a follow-up `GET`, a role without the
      widget never sees quick actions, mobile buttons wrap without overflow).
      Full suite: 53 Playwright + 183 backend unit passing; `svelte-check` 717
      files 0 errors.
- [x] 5.9 Finance Dashboard: Simple Mode + Accountant Mode toggle — done
      2026-07-23 as P5, see [`plan/P5-finance-dashboard.md`](plan/P5-finance-dashboard.md).
      New `/finance` landing page (didn't exist before), `?mode=simple|accountant`
      toggle, both reading the same single-sided ledger — no Chart of Accounts,
      per `10-finance.md`'s own scope note. Simple Mode: plain-language `StatCard`
      tiles (Today's Income, Est. Profit This Month, AR/AP outstanding).
      Accountant Mode: a revenue/COGS/gross-profit P&L table for the month, linking
      out to the existing raw ledger page. New backend `GET /v1/finance/ledger/summary`
      (SQL-side date-range sum by `entryType`, deliberately excluding `adjustment`
      rows — those are AP/AR cash movement, not income/expense) so period totals
      are correct beyond the raw ledger endpoint's 200-row cap. Live-verified with a
      real POS-adjacent invoice (labor-only ticket invoice, pure revenue no COGS):
      summary endpoint returned exactly the posted amount. Explicitly not built:
      Chart of Accounts, journal entries, job-costing, Excel/PDF export, multi-branch
      consolidation, cash/bank balance (no such tracking exists in this app) — all
      Phase-2-flavored per spec. 4 new Playwright tests; full suite (25 tests) passing
      together; `npm test` 179 unit passing; `svelte-check` 710 files 0 errors.
- [x] 5.10 Settings pages: Company, Branches, Users & Roles — done 2026-07-24 as
      P9, see [`plan/P7-plus-phase5-completion-plan.md`](plan/P7-plus-phase5-completion-plan.md).
      The largest remaining Phase 5 task, split BE-then-FE across 4 commits:
      **P9.1** `POST`/`PATCH /v1/branches`; **P9.2** `POST /v1/users` (closes
      **2A.1**, absent since Phase 2), `PATCH /v1/users/:id` (status/role),
      `GET /v1/roles`, `GET /v1/users/list` — plus two things that had to be
      built for status/role management to be real rather than write-only:
      login now actually checks `users.status` (previously nothing read it
      back), and a last-active-Super-Admin guard rejects a status/role change
      that would leave the tenant with zero admins (`422 LAST_SUPER_ADMIN`),
      matching the RBAC break-glass doc's philosophy of preventing a lockout
      rather than just documenting recovery from one; **P9.3**
      `GET`/`PATCH /v1/settings/company`, scoped to what the schema actually
      has (`tenants.name`) rather than inventing logo/address/contact columns
      — the same restraint F6 showed deleting the speculative
      `warranty_records` table. All three gated by new admin-only permissions
      (`branch.manage`, `user.manage`, `settings.manage_company`, none granted
      to Manager). Found and fixed a real bug along the way: Drizzle wraps a
      `db.transaction()` failure in a `DrizzleQueryError`, so `err.code` on a
      unique-constraint violation is `undefined` — the real `PostgresError`
      is at `err.cause.code`. The same latent bug exists in a few pre-existing
      `23505`/`23503` checks elsewhere (not fixed — out of scope for this
      task, tracked in `plan/README.md`'s floating gaps). **P9.4/P9.5**
      replaced the `/settings` placeholder with a tabbed shell (Company /
      Branches / Pengguna & Peran / Metode Pembayaran), the same `?tab=`
      URL-param pattern as the finance dashboard's `?mode=`, mobile-first
      (tabs scroll horizontally, forms single-column). Payment Methods is
      deliberately read-only — there is no create/edit endpoint for that
      resource, so showing edit controls would be the exact "looks wired,
      does nothing" bug Track F existed to fix. Printer config and the RBAC
      permission-matrix editor stay out of scope (Phase 6 / Phase 7
      respectively, as the plan always scoped them). Live-verified via curl
      throughout (branch CRUD, duplicate-email 409, invalid-role 400, status
      change blocking login, last-admin guard) plus 7 new Playwright tests
      (company edit persists across reload, branch create+edit, user
      create-then-deactivate verified via a real login attempt going 200 →
      401 `ACCOUNT_INACTIVE`, payment methods render zero Edit buttons, tab
      switching, mobile no-overflow across all four tabs, horizontal tab
      scroll). Full suite: **65 Playwright + 183 backend unit passing**;
      `svelte-check` 723 files 0 errors.
- [x] **P7 (cross-cutting, not numbered above)** Mobile responsive sweep — done
      2026-07-24, see [`plan/P7-plus-phase5-completion-plan.md`](plan/P7-plus-phase5-completion-plan.md).
      A codebase audit found every table this session hadn't already touched
      (P1.5/P2/P4/P6) — finance (Ledger/Payables/Receivables), purchasing (all list +
      detail/receive/invoice/new pages, `OrderLinesTable`), inventory sub-pages
      (receive/brands/categories/opname/suppliers), and two POS/inventory modals
      (`InvoiceDetailModal`, `PricingSimulator`) — rendered a bare `<table>` with no
      `overflow-x-auto` wrapper, forcing whole-page horizontal scroll on a phone.
      Fixed all of them (6 commits, one per logical group, each independently
      revertable) + made every touched header row `flex-wrap`. New
      `e2e/p7-mobile-sweep.spec.ts` (7 tests, 375px + 1280px) verifies no page
      exceeds viewport width; full suite 37 tests passing; `npm test` 179 unit
      passing; `svelte-check` 710 files 0 errors.
- [x] 5.11 Git commit — closes Phase 5 entirely. P9 (5.10) was the last
      remaining task; every other Phase 5 item above is `[x]` or `[/]` with
      the deliberate-deferral reason stated inline (widget framework,
      attachments, Calendar/Schedule — all tracked in `plan/README.md`'s
      "Deferred / not built" table for their proper phase). See git log on
      `phase-5/core-ui` for the full commit sequence (P1.5 through P9).

---

## PHASE 6 — Printer Integration (Python)
> **Goal:** Build local thermal printer agent.
> **Read first:** specification/09-printer-integration.md,
> [`plan/phase-6-printer.md`](plan/phase-6-printer.md) (task breakdown 6A–6D, the shared-
> render-engine decision D1, and the resolved Q1–Q3 scope decisions).
> **Branch:** `phase-6/printer`
>
> **Status (2026-07-24): 6A + 6B + 6C are done.** Zero physical printer is available in
> this environment (plan Q1) — everything below is built and verified without hardware
> (Dummy/File `python-escpos` backends + a packaged `printer-agent.exe` that answers
> `/health` and `/print`); the real ESC/POS print is a checklist deferred to 6D.1. Q2
> scoped this phase's MVP to the POS receipt + A4 invoice only; `label` has seed data
> but no print trigger yet. **Only 6D.1 (physical print, hardware-dependent, user-run)
> and the final merge to `main` remain.**

- [x] 6A.1 Seed: `printer.manage` permission (admin-only, not granted to Manager) +
      3 devices / 4 templates / 3 assignments, deliberately asymmetric across branches
      (Cabang has no `invoice_a4` assignment) to exercise the fallback path 6A.4 needed.
      Verified: `npm run db:reset` twice — idempotent; direct DB query confirmed row
      shapes and that the permission is granted only to Super Admin.
- [x] 6A.2 Pure render engine (`modules/printer/render.ts`, decision D1): `buildDocumentData()`
      is the one place `layoutConfig` is read (shared by both paper mechanisms);
      `renderThermalBlocks()` turns it into a flat `ThermalBlock[]` for 58/80mm with
      `padRow()`/`truncate()` doing all column alignment server-side — row/total blocks
      carry an already-padded single string, so neither the Python agent (6C) nor the
      preview component (6B) ever recomputes alignment. 15 unit tests (width-fit on
      every emitted block, long-name truncation, the "detail increases with paper size"
      data-inclusion table, conditional footer). `npx vitest run`: 198/198 (was 183).
- [x] 6A.3 Config CRUD (`routes/printer.ts` + `modules/printer/service.ts`, mounted at
      `/v1/printer`, admin-only). `upsertAssignment()` validates three real constraints,
      not just existence: device belongs to the assignment's branch, template's
      `documentType` matches the slot, and device `paperSize` matches template
      `paperSize` (the one that actually breaks physical output if wrong). Verified live
      (curl, `RBAC_MODE=enforce`): Manager → 403; Super Admin → 200/201 CRUD; cross-tenant
      branch → 404; invalid enum → 400; all three assignment-mismatch guards → 422 with
      the specific code; upsert updates the existing `(branchId, documentType)` row
      rather than duplicating it.
- [x] 6A.4 Render endpoint (`routes/print.ts` + `modules/printer/document.ts`,
      `GET /v1/print/documents/:documentType/:id?paperSize=`, `requireAuth` only —
      **not** admin-gated, since printing your own sale isn't a printer-admin action).
      Fetches the real `pos_invoice` (+lines, customer, branch, tenant, linked ticket's
      technician), resolves branch assignment → tenant default → `PAPER_SIZE_REQUIRED`
      if genuinely ambiguous (`receipt` with no assignment and no explicit size).
      `technicianName` is the only "ticket info" field wired — `service_tickets` has no
      complaint/diagnosis columns in this schema, a real already-known gap, not invented
      here. Verified live end-to-end against a real POS invoice from the actual checkout
      API (not a fixture): branch-assignment resolution (Pusat 80mm, Cabang 58mm),
      Cabang's missing `invoice_a4` assignment falling back to the tenant default
      (`assignment: null`), an explicit `?paperSize=` override producing the same
      fallback shape, 400 on `label`, 404 on a missing/cross-tenant invoice, 400
      `PAPER_SIZE_REQUIRED` on a freshly-created branch with zero assignments, and exact
      48-char/32-char block-width verification. Dev DB reset to clean seed state
      afterward. `npx tsc --noEmit` clean throughout 6A; `npx vitest run`: 198/198.
- [x] 6B.1 FE: Printer Settings tab (`PrinterTab.svelte`, fifth tab on the P9 shell,
      `?tab=printers`). Devices: full CRUD, mirrors `BranchesTab`'s established pattern.
      Templates: read-only list — editing `layoutConfig`'s 12 boolean flags is
      deliberately deferred to the WYSIWYG template builder PHASES.md already scopes to
      Phase 7.2, not a gap. Assignment matrix: rows = branches, columns = document
      types; the assign modal filters the template dropdown to the slot's `documentType`
      and (once a device is picked) that device's `paperSize`, so the client can never
      submit a combination 6A.3 would reject with `PAPER_SIZE_MISMATCH` —
      correct-by-construction. 5 new Playwright tests (seeded-data render, the real
      Cabang seed asymmetry — receipt assigned, `invoice_a4` "Belum diatur", device
      create+edit, the full "Belum diatur → configured" flow, mobile no-overflow); two
      `data-testid`s added after the tests caught real strict-mode ambiguity (a
      template's name / a device's name each render in two places on the page).
      `npx svelte-check`: 0 errors. No regression on the 7 pre-existing `p9-settings`
      tests despite editing the shared `+page.svelte`/`+page.server.ts`.
- [x] 6B.2–6B.4 FE: Cetak flow — built together (`ThermalPreview.svelte`,
      `A4Invoice.svelte`, `PrintButton.svelte`), since a preview component with no real
      caller isn't independently meaningful under this file's Definition of Done.
      `PrintButton` fetches `GET /v1/print/documents/:documentType/:id` (letting the
      backend resolve the branch's real assignment) and shows whichever preview matches
      the resolved `paperSize` — `ThermalPreview` renders the real `ThermalBlock[]`
      verbatim in a monospace box at the exact 32/48-char width (no layout decision in
      the FE, per D1); `A4Invoice` renders `data` directly as HTML with print-scoped CSS
      (`#print-area` + a `visibility` trick) so `window.print()` prints only the
      invoice, not the whole SPA page — the on-screen preview IS the exact markup sent
      to print, per the spec's WYSIWYG rule. Thermal's "Kirim ke Printer" POSTs to a
      fixed `127.0.0.1:9100` (`lib/api/printer-agent.ts`, the port 6C's Flask agent
      must bind to); since the agent doesn't exist yet, a failed/refused POST degrades
      to a clear "printer agent tidak terdeteksi" message instead of hanging, per the
      plan's R2 risk mitigation. Wired into `InvoiceDetailModal.svelte`'s footer as
      "Cetak Struk" / "Cetak Invoice A4" — every `pos_invoice` (walk-in or
      ticket-linked via H17) surfaces there already. 5 new Playwright tests against
      real invoices created through the actual checkout API: correct resolved
      paperSize + real content on the thermal preview; A4 shows its layout and never
      renders thermal blocks; the agent-offline message actually appears; `window.print()`
      is actually invoked (spied via `page.addInitScript`, asserted with `expect.poll`);
      mobile no-overflow. Full Playwright suite (**75 tests**, all specs) passing,
      including the pre-existing P7 sweep's "POS invoice detail modal does not
      overflow" check — confirms the two new buttons don't regress that modal.
      `npx svelte-check`: 0 errors. `npx vitest run`: 198/198 (backend untouched).
- [x] 6C Python agent (`printer-agent/`, separate from `flowserv-api` per spec rule 1) —
      **done 2026-07-24.** `printer_agent.py` (Flask, binds `127.0.0.1:9100` only —
      matches `PRINTER_AGENT_URL` in `flowserv-web/src/lib/api/printer-agent.ts`):
      `GET /health`, `POST /print`. `escpos_translator.py`: pure `blocks_to_escpos()`,
      one branch per `ThermalBlock` type (`text`/`line`/`row`/`total`/`cut`), no layout
      decisions (mirrors D1 — the TS render engine is the only place alignment happens).
      `connection.py`: factory building a real `python-escpos` `Usb`/`Network`/`Serial`
      instance, or `Dummy`/`File` with zero hardware, from a per-machine `config.json`
      (git-ignored; `config.example.json` documents all 5 modes) — defaults to `dummy`
      when no config exists, so the whole feature demos with no printer anywhere.
      33 pytest tests (23 at initial 6C, +10 for 6C.5 below): `test_translator.py` (byte-level against `Dummy` — asserts the
      actual ESC/POS protocol bytes: `ESC E` bold, `ESC a` align, `GS V` cut, exact
      32/48-char line width, unknown block type raises rather than silently dropping a
      line), `test_connection.py` (mode selection incl. mocked Usb/Network/Serial ctors),
      `test_agent.py` (Flask endpoint incl. 400s on bad payload, CORS preflight).
      Live-verified beyond the test suite: ran the real Flask process, `curl`'d
      `/health` → 200 and `/print` with a real block document → `{"status":"printed"}`;
      switched `config.json` to `file` mode and inspected the raw output bytes
      (`\x1bE\x01...\x1dV\x00`) to confirm the byte stream a real printer would receive.
      **6C.4 PyInstaller packaging**: `python -m PyInstaller --onefile --name
      printer-agent --collect-data escpos printer_agent.py` → `dist/printer-agent.exe`.
      Found and fixed a real packaging bug: without `--collect-data escpos`, the exe
      answers `/health` but every `/print` fails (`python-escpos` loads a bundled
      `capabilities.json` data file PyInstaller doesn't auto-detect) — documented in
      `printer-agent/README.md` so it isn't rediscovered. Verified: ran the built exe
      standalone (no Python on the invoking shell needed), `/health` → 200, `/print` →
      `{"status":"printed"}`. `printer-agent/README.md` documents install, all 6
      connection modes, hardware-free testing, the physical-print checklist (6D.1), and
      the packaging command with the `--collect-data` gotcha.
- [x] 6C.5 Windows printer scan-and-pick — **added 2026-07-24** after a direct request:
      typing a USB vendor/product ID or IP address by hand is unfriendly, and most
      receipt printers already register themselves as an installed Windows printer
      queue once their driver is set up. New `win32` connection mode (`connection.py`'s
      `build_printer()`, via `python-escpos`'s `Win32Raw` — raw ESC/POS through the
      Windows print spooler, no direct USB/serial wiring). `connection.py`'s
      `scan_windows_printers()` enumerates installed queues via `pywin32`
      (`win32print.EnumPrinters`), flagging a `recommended` hint (driver-name keyword
      match or a non-virtual port) — never filtering, always showing everything so the
      user's pick stays explicit. Two new agent endpoints: `GET /printers` (scan,
      read-only) and `GET`/`POST /config` (read/persist the local connection choice —
      `POST` validates by actually building the printer instance before writing, so a
      typo surfaces immediately, not on the next real print). Frontend:
      `PrinterScanPicker.svelte`, shown in `PrinterTab.svelte`'s add/edit device modals
      only when `connectionType === 'win32'` — "Pindai Printer di Komputer Ini" lists
      real installed printers, clicking one fills `connectionAddress` (and the device
      name if still empty) and POSTs the pick to the agent's `/config` so the very next
      print already uses it, no separate config-file step. `CONNECTION_TYPES` in
      `flowserv-api/src/modules/printer/types.ts` extended with `'win32'` (additive,
      no exhaustive switch anywhere depended on the old 4-value set).
      Found and fixed a real bug while wiring this: `connection.py`'s `usb` branch
      passed `timeout` as `Usb()`'s 3rd *positional* argument, which is actually
      `usb_args` (a dict) — silently harmless at the default `timeout=0` (falsy, so
      `usb_args or {}` masked it) but would raise `'int' object does not support item
      assignment` the moment a non-zero timeout was configured. Fixed to pass
      `timeout=` by keyword; the test asserting the old (wrong) positional shape was
      rewritten to assert against the real `Usb` signature instead of a fake that
      happened to match the bug.
      10 new pytest tests (33 total): win32 mode construction, scan sorting/flagging
      (mocked `win32print`, incl. the `ImportError` non-Windows path →
      `PrinterScanUnavailableError` → 501), config save/load round-trip, `/printers`
      and `/config` endpoint behavior. Live-verified beyond pytest, on this actual
      Windows machine: `GET /printers` returned a real installed "POS-80" printer
      (`recommended: true`, `isDefault: true`) alongside PDF/Fax/OneNote queues
      (`recommended: false`); `POST /config` with `{mode:"win32", win32:
      {printerName:"POS-80"}}` → `{"status":"saved"}`; a subsequent `POST /print` with
      that config actually spooled to "POS-80" and returned `{"status":"printed"}`
      with no job left stuck in the Windows print queue afterward. `npx tsc --noEmit`
      + `npx svelte-check`: 0 errors. `npx vitest run`: 198/198 (backend untouched
      beyond the additive enum value).
- [x] 6C.6 Per-printer test print — **added 2026-07-24**, requested to answer "is this
      printer actually integrated correctly?" without needing a real invoice. New
      `POST /test-print` (`build_test_print_blocks()` in `escpos_translator.py`, plus a
      new `pad_row()` helper mirroring `render.ts`'s column alignment) prints a generic
      diagnostic receipt — exercises every block type a real receipt uses — through
      whichever printer `config.json` currently points at. FE: a "Test Cetak" link in
      `PrinterScanPicker.svelte` right after picking a printer, and a "Test Cetak"
      button per row in `PrinterTab.svelte`'s devices table (any time, not just at
      setup), both gated to non-A4 devices since A4 never touches the agent (spec
      rule 2). 9 new pytest tests (42 total): `pad_row`/`build_test_print_blocks` unit
      tests (3), `/test-print` endpoint behavior — success, bad paperSize, connection
      failure → 502 (4), plus 2 regression tests for the `_resolve_base_dir()` bug
      below. `npx svelte-check`: 0 errors.
      **Found and fixed a real bug while verifying this end-to-end via the packaged
      exe (not just pytest):** `connection.py`'s `CONFIG_PATH` was computed from
      `__file__`'s directory — inside a PyInstaller `--onefile` exe, `__file__`
      resolves to a path *inside* the fresh temp directory the exe extracts itself
      into on every launch (and deletes on exit), not next to the real `.exe`. This
      meant `config.json` (the whole reason the agent has a config file — persisting
      the cashier's printer choice) silently reset to `dummy` on every single run of
      the packaged exe, and every `POST /config` write vanished the moment the process
      exited — invisible when testing via `python printer_agent.py` directly (where
      `__file__` is correct), only surfacing when testing the actual shipped artifact.
      Fixed with `_resolve_base_dir()`: checks `sys.frozen` (PyInstaller's signal for
      "running from a bundle") and resolves next to `sys.executable` instead in that
      case. Verified live: copied `config.json` next to `dist/printer-agent.exe`,
      confirmed `GET /config` from the running exe correctly returned the persisted
      `win32`/"POS-80" choice (not `dummy`), and `POST /test-print` against it returned
      `{"status":"printed","mode":"win32"}`. Rebuilt and redeployed the running agent
      with the fix. `printer-agent/README.md`'s packaging section now states plainly:
      `config.json` must live in the same folder as `printer-agent.exe`, wherever it's
      moved to (Desktop, Startup folder, etc.).
- [/] 6D Verify + docs — **partial.** Backend (33 pytest) + this repo's existing 198
      backend unit + Playwright all still green (agent is a fully separate process;
      nothing pre-existing in `flowserv-api`/`flowserv-web` broke). **Left `[/]` not
      `[x]`**: 6D.1's physical print test is explicitly hardware-dependent (plan Q1) —
      no printer exists in this environment, so it stays a checklist in
      `printer-agent/README.md` for the user to run once real hardware is available,
      not a silent `[x]`. The `config.json` → `file` mode gives byte-level output to
      inspect without hardware, and the win32/"POS-80" live test above proves the
      spooler path end-to-end, but "the printer actually cuts paper" can only be
      confirmed on a physical device.
- [ ] 6.6 Git commit + merge `phase-6/printer` → `main` once 6D.1 (physical print,
      user-run) closes out the phase.

---

## PHASE 7 — Builder UIs
> **Goal:** Build configuration UIs that make FlowServ unique.
> **Branch:** `phase-7/builders`

- [x] 7.1 Flow Template Builder: Visual editor for nodes + transitions — **done
      2026-07-27 on `go-live/tahap-b`**, out of phase order, because the owner's
      real service flow made it a prerequisite rather than a nicety: see
      [`plan/tahap-b-alur-pos-servis.md`](plan/tahap-b-alur-pos-servis.md) R6/R7.
      **What made it meaningful was R6, not the editor itself.** Before that,
      every flow rule (when parts may be added, when payment is allowed, which
      document prints where) lived in frontend code, so a "builder" could only
      rearrange boxes without changing behaviour. R6 moved those rules into
      `flow_nodes` as per-stage columns — `allowsCharges`, `requiresDiagnosis`,
      `allowsInvoicing`, `autoPrintDocuments`, `description` — and every gate now
      reads them. Editing a template genuinely changes how the app works.
      BE: `PUT /v1/flows/:id/design` saves the whole design atomically (a
      part-applied redesign could leave a live flow with two start stages),
      `POST /v1/flows`, new admin-only `flow.manage`. Pure `validateFlowDesign()`
      + 8 unit tests: exactly one start stage, at least one terminal, no
      unreachable stage, no unknown/self transition. Deleting a stage still
      referenced by a ticket or its history returns **422 `NODE_IN_USE`** naming
      the stages (verified live) instead of a foreign-key 500. FE `/settings/flow`:
      drag to reorder (native HTML5, same idiom as the P2 Kanban — no new
      dependency; arrow buttons for touch), per-stage description shown to staff
      on the ticket page, three capability switches, print-document checkboxes,
      and "lanjut ke" checkboxes for branching. 6 Playwright tests, including one
      that turns off a capability in the template and proves the ticket page locks
      the matching form — the actual claim being made. Closed a latent bug on the
      way: `TicketWorkspace.svelte` had rendered `currentNode.description` since
      Phase 3 with no such column ever existing, so it was always blank.
      > **Reworked later the same day (2026-07-27) after the owner used it.** Two
      > things were wrong, both about *where* and *how*, not about what it saved:
      > it lived under Setelan ("bila di setting akan lebih ribet dan juga tidak
      > efisien"), and it edited the flow as a **list of rows** when the thing
      > being edited is a graph ("editnya itu seperti diagram dari mana kemana,
      > jangan perbaris"). It also offered far more freedom than the shop wants:
      > "untuk alur intinya urutannya tidak bisa diubah — konfigurasinya hanya
      > menambahkan QC kemudian melewati tahap print awal."
      >
      > The editor now lives at **`/flows/:id`** (the read-only diagram page that
      > already existed there since Phase 2C is now the editor; `/settings/flow`
      > is deleted and the Setelan tab is a link, not a second place to configure
      > the same thing). It draws the real graph — stages positioned by longest
      > path from the start stage, so the Ditunggu/Unit Disimpan branch renders
      > side by side, with SVG arrows for every transition. Reordering rows is
      > gone entirely; what's left is: drag a stage from the palette onto the
      > **+** on an arrow to insert it, ✕ to detach it (the flow reconnects
      > around it), and click a stage to edit its description / capabilities /
      > auto-print documents.
      >
      > **New `flow_nodes.isCore`** is what makes the lock real rather than a
      > disabled button: server-controlled (never accepted from the payload, so
      > stages created in the editor are always optional and always removable),
      > seeded true for the backbone and false for QC Awal / QC Akhir. New pure
      > `validateCoreIntegrity()` + 8 unit tests enforces three rules — a core
      > stage can't be removed, core stages can't be reordered, and every
      > core→core transition must still be reachable (through added stages, but
      > not rerouted to a different core stage). Verified live via curl against
      > the real API: reorder → 422 `CORE_STAGE_REORDERED`, delete → 422
      > `CORE_STAGE_REMOVED`, reroute → 422 `CORE_PATH_BROKEN`, while detaching
      > QC and inserting a new stage both return 200 and come back `isCore:false`.
      >
      > Two real bugs were found by running it, not by reading it: (1) the
      > `SELECT` behind the core-order comparison had **no `ORDER BY`**, so the
      > "expected" order was whatever Postgres returned and a perfectly legal
      > insert was rejected — fixed, and `validateCoreIntegrity` now sorts by
      > `sequenceOrder` itself so no caller can reintroduce it (regression test
      > feeds it a deliberately shuffled list); (2) the "siap dipasang" hint
      > appeared only *during* a drag, which **shifted the diagram down by one
      > line and moved the drop target out from under the cursor** — native
      > drag-and-drop never completed. It is now always rendered (empty when
      > idle). 9 Playwright tests (up from 6), including both the drag path and
      > the tap path, detach-reconnects-the-graph, save-and-reload, and mobile
      > horizontal scroll without page overflow. `/flows` list also got its dead
      > "Create Template" button wired to the `POST /v1/flows` that already existed.
      >
      > **Follow-up the same day, both from the owner using it:** creating a
      > template produced an *empty* flow — no stages, therefore no arrows,
      > therefore nowhere to insert anything: a dead end. New
      > `modules/flow/backbone.ts` defines `CORE_BACKBONE` (Intake → Diagnosis →
      > {Ditunggu | Unit Disimpan} → Pengerjaan → Selesai, plus the
      > Diagnosis → Selesai "no repair needed" branch), and `createFlowTemplate`
      > now writes it transactionally with `isCore: true`, so a new service flow
      > opens ready to configure. The seed takes its core stage names and
      > descriptions from the same constant so the two can't drift in wording;
      > capabilities stay written out in the seed, deliberately, because the
      > seeded flow has QC Akhir installed (invoicing lives there) while a fresh
      > flow has no QC yet (invoicing lives on Pengerjaan — putting it only on
      > the terminal stage would mean billing after the ticket already closed).
      > Two unit tests guard the constant itself: it must satisfy
      > `validateFlowDesign`, and it must allow invoicing at a non-terminal stage.
      > Also added **`DELETE /v1/flows/:id`** (admin-only, audited) with two
      > specific refusals instead of a foreign-key 500 — `TEMPLATE_IS_DEFAULT`
      > (every new ticket uses it) and `TEMPLATE_IN_USE` (a ticket or its history
      > still points at its stages) — surfaced as a confirm dialog on the editor
      > page. Verified live: new template returns 6 stages / 7 transitions;
      > delete-while-used → 422 `TEMPLATE_IN_USE`; delete-default → 422
      > `TEMPLATE_IS_DEFAULT`; Manager → 403 `PERMISSION_DENIED`. 11 Playwright
      > tests now (up from 9); full suite **131 passing**, backend **236**.
      >
      > **Per-stage checklists (QC), added 2026-07-28** after the owner asked for
      > QC "rows" to be editable. Clarified first which rows they meant — the
      > items checked *inside* a QC stage, not the number of QC stages. The
      > definition lives in `flow_nodes.checklist_items` (jsonb `[{id,label}]`),
      > edited in the diagram's stage panel and saved atomically with the rest of
      > the design, exactly like `autoPrintDocuments`; answers live in a new
      > `ticket_checklist_results` table keyed unique on (ticket, stage, item) so
      > re-saving updates rather than stacking. Two decisions follow from QC being
      > *evidence for the customer*: the item's `label` is copied onto the answer
      > when saved (rewording an item later cannot change what an old ticket's
      > evidence says), and answers whose item was deleted from the template are
      > still shown, flagged "tidak lagi diperiksa", rather than silently
      > dropped — both covered by the 10 `mergeChecklist` unit tests. New
      > `ticket.qc` permission (Technician + Manager, not Cashier); an unknown
      > item is a 409 `CHECKLIST_ITEM_UNKNOWN` telling the user to reload, not a
      > silent discard. Verified live: technician saves 2/4 recorded under their
      > name, re-save 4/4 stays 4 rows, cashier 403, unknown item 409, and after
      > the ticket moves to Pengerjaan the active checklist is null while the
      > evidence still reads "QC Awal 4/4". 4 new Playwright tests; full suite
      > **136 passing**, backend **242**. **Not done, stated plainly:** QC results
      > are not yet printed on the receipt/A4 — that touches the shared print
      > render engine and belongs in its own task.
- [x] 7.2 Printer Template Builder: WYSIWYG editor + preview — **done 2026-07-28
      on `go-live/tahap-b`**, requested directly by the owner ("buat template
      notanya, bisa diedit dan pilih templatenya, dan sediakan previewnya —
      usahakan previewnya sama dengan kenyataannya").
      **The last clause is the whole design constraint.** The only way to
      guarantee it is to not write a second render path: new
      `modules/printer/sample.ts` calls the *same* builders production printing
      calls — `buildDocumentData` + `renderThermalBlocks` for receipt/A4,
      `buildLabelBlocks`/`buildTandaTerimaBlocks` for label/tanda_terima (which
      deliberately bypass the money-receipt shape, see 6A) — and only the data
      differs, a fixed `SAMPLE_INVOICE_BUNDLE`/`SAMPLE_TICKET_BUNDLE`. The
      sample is deliberately "full" (two line items, a discount, cash tendered
      + change, cashier and technician names) because a bland sample makes some
      toggles change nothing on screen, which is worse than no preview at all.
      The lead unit test asserts `renderTemplatePreview(...) === renderThermalBlocks(buildDocumentData(...))`
      block-for-block, so anyone who later forks a preview-only renderer breaks
      the build. 8 new unit tests total (paper-width fit, per-flag effect,
      A4-emits-no-blocks, label never printing "TOTAL Rp0", label-asked-for-A4
      falling back to small paper, and a guard on the sample's own richness).
      BE: `POST /v1/printer/templates/preview` takes the **layoutConfig itself**
      rather than a template id — that is what lets the owner see an unsaved
      switch — plus `DELETE /v1/printer/templates/:id` refusing with 422
      `TEMPLATE_IN_USE` and naming the branches still assigned to it, instead of
      a foreign-key 500. Both admin-only (`printer.manage`) and audited.
      FE: `TemplateEditor.svelte` — a 250ms-debounced live preview rendered by
      the very same `ThermalPreview`/`A4Invoice` components used to print real
      invoices, next to the switches. Switches are filtered per document type
      and paper size (a logo toggle on a 58mm receipt would be a dead control,
      the same class of bug Track F existed to fix). Templates table gained
      Edit / Duplikat / Hapus plus a Buat Template dialog; creating or
      duplicating opens the editor immediately, since a fresh template always
      needs configuring. 6 Playwright tests, including one asserting no rendered
      line exceeds 48 characters and one proving A4 never renders thermal
      blocks. Tests that mutate a template create their own via the API rather
      than editing the seeded one — the first run of this spec failed exactly
      because a mid-test failure left the shared seed template dirty. Full
      suite: **142 Playwright + 250 backend unit passing**; `tsc` +
      `svelte-check` (745 files) 0 errors.
- [ ] 7.3 RBAC Management UI: Visual permission matrix (depends on 4.5B)
- [ ] 7.4 Git commit: `feat: phase 7 complete — builder UIs`

---

## PHASE 8 — Business Module Expansion
> **Goal:** Implement remaining MVP features per domain.
> **Read first:** specification/features/00-feature-catalog.md (filter MVP ✅)
> **Branch:** `phase-8/modules`

- [ ] 8.1 Customer Management (profile, duplicate detection, history)
- [ ] 8.2 Device Management (identification, compatibility, status)
- [ ] 8.3 Supplier Management (profile, categories, pricing)
- [ ] 8.4 Purchasing (PO, goods receiving, returns)
- [ ] 8.5 Sales (walk-in, returns, discounts)
- [ ] 8.6 Service Billing (quotation, deposit, invoice, refund)
- [ ] 8.7 Warranty (templates, activation, claims)
- [ ] 8.8 Technician (skills, performance, commission)
- [ ] 8.9 Finance (AR, COA, journal, P&L) — builds on 4.5A
- [ ] 8.10 Dashboard Alerts (service, inventory, finance, warranty)
- [ ] 8.11 Customer Portal (magic link, approve/reject quote)
- [ ] 8.12 Git commit: `feat: phase 8 complete — all MVP modules`

---

## PHASE 9 — Testing & Local Network Deployment
> **Goal:** Comprehensive testing and deploy to local network (LAN/WiFi).
> **Branch:** `phase-9/testing`

- [ ] 9.1 Integration tests: Full flow end-to-end
- [ ] 9.2 Permission matrix: Test all role/action combinations
- [ ] 9.3 Multi-tenant: Verify data isolation
- [ ] 9.4 Performance: API response time
- [ ] 9.5 UX review: Mobile responsiveness, touch targets
- [ ] 9.6 Real-time: WebSocket updates working
- [ ] 9.7 Local network: Configure server to listen on 0.0.0.0
- [ ] 9.8 Test from other devices on same WiFi (phone, tablet, other PC)
- [ ] 9.9 Create startup script (one-click start for backend + frontend + database)
- [ ] 9.10 Git commit: `feat: phase 9 complete — tested and running on local network`

---

## PHASE 10 — Production Use (1 Shop)
> **Goal:** Use the app daily in your real shop. Fix issues as they arise.

- [ ] 10.1 Onboard real data (customers, inventory, suppliers)
- [ ] 10.2 Train staff on the application
- [ ] 10.3 Daily use for 2-4 weeks
- [ ] 10.4 Collect feedback & fix bugs
- [ ] 10.5 Database backup strategy (daily pg_dump)

---

## PHASE 11 — VPS Deployment (Future)
> **Goal:** Deploy to VPS when ready to serve multiple clients.
> **Only start when Phase 10 is stable and you want to expand.**

- [ ] 11.1 Provision VPS (DigitalOcean/Hetzner/etc.)
- [ ] 11.2 Setup PostgreSQL on VPS (or managed DB)
- [ ] 11.3 Setup Nginx reverse proxy + HTTPS (Let's Encrypt)
- [ ] 11.4 CI/CD pipeline (GitHub Actions → auto deploy)
- [ ] 11.5 Domain setup (flowserv.yourdomain.com)
- [ ] 11.6 Backup strategy (automated daily)
- [ ] 11.7 Monitoring & alerting

> **Before VPS:** replace the hardcoded `JWT_SECRET` fallback in `middleware/auth.ts`
> with a required env var that throws on startup if missing, and remove the legacy
> unsalted SHA-256 password path in `routes/auth.ts`.

---

## PHASE 12 — Phase 2 Features (Post-MVP)
> **Goal:** Implement 🟡 Phase 2 features based on real usage feedback.
> Only start after PHASE 10 is stable.

- [ ] 12.1 Multi-warehouse / multi-location stock
- [ ] 12.2 Stock Opname (scheduled audit)
- [ ] 12.3 WhatsApp Business API integration
- [ ] 12.4 Payment gateway (QRIS, cards)
- [ ] 12.5 SSO / enterprise login
- [ ] 12.6 Advanced finance (Balance Sheet, Cash Flow, Tax, Period Closing)
- [ ] 12.7 Supplier performance tracking
- [ ] 12.8 AI-assisted diagnosis suggestion
- [ ] 12.9 Advanced reporting & analytics
- [ ] 12.10 Webhook for external integrations
- [ ] 12.11 Platform Super Admin Dashboard (for managing multiple tenants)

---

## Architecture Debt (read before refactoring)

The backend does **not** follow the module structure in
`specification/coding-guidelines.md` §2. Most business logic still lives inline in
HTTP route handlers, which is why so little of it was testable.

Phase 3.5 began the correction: `modules/finance/` is the first module in the
specified shape, and the pure decision functions extracted along the way
(`flow-engine/engine.ts`'s `evaluateTransition`, `lib/fifo.ts`, `lib/wac.ts`,
`routes/purchasing/order-status.ts`) are what the tests actually exercise. The
Hardening Track (H7/H9/H11/H16) continued it: `modules/tickets/`,
`modules/inventory/`, `flow-engine/` are now in the specified shape.

**Decision: retrofit incrementally, never big-bang.** (Restated as standing rule
[H16](plan/H16-module-migration.md).)

When you touch a module for a fix or a feature, extract its `service.ts` *then*,
with a test. Do **not** refactor modules you are not otherwise changing. A
whole-codebase restructure with zero tests is the fastest way to break a working
application.

Other known debt, to be addressed as modules are touched:
- `drizzle-zod` is installed but never used; Zod schemas are hand-written (§4)
- ~~`services/flow-engine.ts` should be `flow-engine/{engine,types,events}.ts`~~ —
  **done in H16** (`flow-engine/engine.ts` + `flow-engine/types.ts`; no `events.ts`,
  the event bus is cross-cutting and stays in `services/event-bus.ts`).
- ~~Two schema files violate kebab-case naming: `payment_methods__settings_.ts`,
  `relations__untuk_relational_query_api_drizzle.ts`~~ — **renamed in H16** to
  `payment-methods.ts` and `relations.ts`.
- `catch (err: any)` (~36 sites) → `catch (err: unknown)` + a shared `toBusinessError()`
  helper — **still open** (H16 scoped it as future per-module work).
- Comments and error strings mix Indonesian and English — pick one for user-facing text

**Decision (2026-07-21, H4): `stock_levels` is deliberately a cache, not the source of
truth.** The source of truth for physical stock is `SUM(stock_batches.quantity_remaining)`.
`stock_levels.quantityAvailable` is a denormalized read cache kept in sync by every route
that touches stock, and it is the only place `quantityReserved` can live — that value
cannot be derived from batches, and H10 (stock reservation) needs it. Option B (drop the
cache, derive everything from a view over `stock_batches`) was considered and rejected for
that reason. What makes the cache safe now, that it was not before H4:
- `stock_levels` carries a `(tenant_id, inventory_item_id, branch_id)` unique constraint —
  a duplicate row (the failure mode that let `findFirst` silently return the wrong one) is
  now rejected by the database, not just prevented by row locking.
- Creating an inventory item auto-creates its `stock_levels` row (quantity 0) for every
  branch of the tenant, so a newly created item can never hit the `STOCK_LEVEL_MISSING`
  422 path in POS just because the cache row was never made.
- `GET /v1/inventory/reconciliation` (backed by the pure `reconcileStockLevels()` in
  `lib/reconciliation.ts`, covered by 5 unit tests) compares the cache against the batch
  sum per item/branch and reports any drift. Run it periodically, or after suspecting a
  bug in a stock-mutating route — a non-empty `drift` array means a code path updated one
  side without the other.
Revisit this decision (toward Option B) only if reconciliation keeps finding real drift
despite the constraint — that would mean something is writing to `stock_levels` without
going through the paths this task audited.

**Decision (2026-07-23, F6): deleted the orphaned `warranty_records` table** rather than
keep it as a speculative forward-declaration. It existed in `db/schema/tickets.ts` with no
route, service, or seed ever reading or writing it — the same dead-schema smell H1 cleaned
up for `pos_transactions`/`invoice_lines`. Warranty (WAR-001..006) is entirely unbuilt and
scoped to Phase 8; when that phase starts, design the table together with the feature
instead of trying to guess its shape now. See `specification/features/11-warranty.md`.

---

## Deprecated Documentation (DO NOT use as reference)

- `docs/` and `books/` — superseded archives. `specification/` is the single source of truth.

> **Removed 2026-07-20:** `legacy/`, `my-saas-app/`, and `pos_sederhana-main/` were
> example applications unrelated to FlowServ and have been deleted from the repo.
> Earlier task files and commit messages reference them as "folders to ignore" —
> that guidance is obsolete; they simply no longer exist.

---

## Quick Reference

> Corrected 2026-07-20 — this table previously contradicted the phase bodies
> (it listed Phase 4 as "RBAC + Audit" while the body said Purchasing, which is
> how both features ended up with schema tables and no code).

| Phase | Focus | Depends On |
|-------|-------|-----------|
| 0 | Documentation | — |
| 1 | Project Setup + DB + Cleanup + Git | Phase 0 |
| 2 | Auth + Flow Engine (BE+FE) | Phase 1 |
| 3 | Vertical Slice (BE+FE) | Phase 2 |
| **3.5** | **Stabilization — bug fixes + first tests** | Phase 3 |
| 4 | Purchasing, Supplier Debts, Margins | Phase 3.5 |
| **4.5** | **Finance Ledger, RBAC, Audit** | Phase 4 |
| 5 | Core UI Polish | Phase 4.5 |
| 6 | Printer Agent | Phase 5 |
| 7 | Builder UIs | Phase 5 + 6 |
| 8 | Module Expansion | Phase 5 |
| 9 | Testing + Local Network | Phase 8 |
| 10 | Production Use (1 Shop) | Phase 9 |
| 11 | VPS Deployment | Phase 10 |
| 12 | Post-MVP Features | Phase 10 |
