# FlowServ — Plan Index (master roadmap)

> **The single source for what is done, in progress, and not yet built.** `PHASES.md`
> holds the authoritative per-task evidence; this file is the map over it. If the two ever
> disagree, `PHASES.md` wins.
>
> **Convention (important):** a per-task `plan/*.md` file exists only while its task is
> active. **On completion the file is deleted** — its durable evidence moves to `PHASES.md`
> and lives forever in git history. This is how the Hardening Track (`H*.md`), Track F
> (`F*.md`), and Phase 4C/5 task files were all handled. So: an inline `plan/…md` link in
> `PHASES.md` pointing at a file that no longer exists is **expected** — it's a historical
> marker, not a broken reference. Only *active* plans keep their files.
>
> **AI agent?** `CARA-PROMPT.md` has ready-to-use prompt templates + the "no done without
> evidence" guardrail.

---

## Current focus

**Phase 5 — Core UI Polish is complete** (2026-07-24), on branch `phase-5/core-ui`.
P9 (Settings CRUD) was the last remaining task. Its detail plan (`P7-plus-phase5-completion-plan.md`,
which covered P7 through P9) has been **deleted on completion**, per this file's own
convention — see the Progress log below for the full per-step evidence and commit hashes.

**Now on Phase 6 (Printer Integration)**, branch `phase-6/printer`. Plan:
**[`plan/phase-6-printer.md`](./phase-6-printer.md)** (task breakdown 6A–6D, decision D1, and
the resolved Q1–Q3 scope decisions — no physical printer available, build test-covered without
hardware; MVP is POS receipt + A4 invoice; Python 3.14.3 confirmed available). **6A + 6B + 6C
are done**: the entire backend foundation (seed, pure render engine, config CRUD, render
endpoint), the entire frontend (Printer Settings tab with devices/templates/assignment matrix, a
thermal preview, an A4 `window.print()` path, and a "Cetak" flow), and now the Python agent
itself (`printer-agent/` — Flask `/health` + `/print`, a pure block→ESC/POS translator, a
connection factory for Usb/Network/Serial/File/Dummy, and a working PyInstaller `--onefile`
build). 198 backend unit + 75 Playwright + 23 agent pytest, all passing. Next: **6D.1**, the
physical print checklist — hardware-dependent, the user runs it — then merge to `main`.

---

## Status at a glance

### ✅ Done — built, tested, merged/verified (evidence in `PHASES.md` + git)
- **Foundations** — Hardening Track H0–H17 (auth, RBAC enforce/report, audit log, event-bus
  finance ledger, idempotency, pagination, BusinessError, seed/reset). Phases 3.5 / 4.5 / 3E.
- **Track F (F1–F8)** — made the dishonest flows honest: technician-assignment UI, "My Jobs"
  filter, ticket cancellation (real `cancelled` + reservation release), inventory item edit,
  PO delete guard, `warranty_records` deletion, live Create-Ticket button, spec-header refresh.
- **Phase 4 / 4C** — purchasing, supplier AP, dynamic margin config **and** server-side price
  enforcement (below-cost 422 / below-target warn).
- **Phase 5 so far:**
  - **P1.5** mobile app-shell (off-canvas drawer) + worst-offender table fixes.
  - **P2** ticket Kanban board (columns = flow nodes, tap-to-move + desktop drag), mobile-first.
  - **P3** per-role dashboards (Super Admin/Manager/Technician/Cashier) — *real-data half.*
  - **P4** ticket detail polish (timeline actor, cost-breakdown tiles, mobile layout) — *core half.*
  - **P5** finance dashboard Simple/Accountant toggle + `GET /v1/finance/ledger/summary`.
  - **P6** inventory search/low-stock filter + batch-history enrichment.
  - **P7** mobile responsive sweep — every remaining table (finance, purchasing,
    inventory sub-pages, 2 modals) that still forced page-wide horizontal scroll on a
    phone, fixed across 6 individually-revertable commits.
  - **P8** global search — `GET /v1/search?q=` (substring, grouped, tenant-scoped)
    + `GlobalSearch.svelte` in the app-shell header (desktop inline dropdown, mobile
    full-screen overlay).
  - **P10** product catalog — `/inventory/catalog` browse-by-category card grid +
    supplier price comparison on the item detail page (surfaced the previously-orphaned
    `productSuppliers` relation, no new list endpoint needed).
  - **P11** technician quick actions — the Technician dashboard's "Tugas Saya" list now
    shows per-ticket transition buttons (reuses the Kanban board's edge-filter logic),
    no backend change needed.
  - **P12** POS touch polish — found and fixed two real touch-target bugs (a `px-2 py-1`
    qty stepper, and drafts-modal buttons that were `opacity-0 group-hover:opacity-100`
    and therefore unreachable on any touchscreen), not just a sizing pass.
  - **P9** Settings CRUD — closes Phase 5. Real branch/user/company CRUD (`branch.manage`/
    `user.manage`/`settings.manage_company`, admin-only), closes **2A.1** (create-user,
    open since Phase 2), makes `users.status` actually block login, and adds a
    last-active-Super-Admin lockout guard. Tabbed `/settings` shell replaces the old
    placeholder; Payment Methods stays read-only (no create/edit endpoint exists for it).

  Test baseline: **183 backend unit + 21 API e2e + 65 Playwright browser specs**, all green.
  `svelte-check` 723 files 0 errors.
- **Phase 6 so far — 6A + 6B + 6C**: `printer.manage` permission + seed data (3 devices/4
  templates/3 assignments, deliberately asymmetric across branches); the pure render
  engine (`modules/printer/render.ts` — D1's shared layout logic, 15 unit tests); config
  CRUD (`/v1/printer/devices|templates|assignments`, admin-only, with real
  paperSize/documentType/branch mismatch validation); the render endpoint
  (`/v1/print/documents/:documentType/:id?paperSize=`, resolves branch assignment →
  tenant default → `PAPER_SIZE_REQUIRED` if ambiguous) — all verified live against a
  real POS invoice from the actual checkout API. **Frontend (6B)**: a fifth Settings
  tab (`PrinterTab.svelte` — devices CRUD, read-only template list, an assignment
  matrix that filters templates by the picked device's paperSize so mismatches can't
  even be submitted); the Cetak flow (`ThermalPreview`/`A4Invoice`/`PrintButton`,
  wired into `InvoiceDetailModal` as "Cetak Struk"/"Cetak Invoice A4") — thermal
  preview renders the real blocks verbatim, A4's print CSS makes the on-screen preview
  the exact thing `window.print()` sends. **Python agent (6C)**: new top-level
  `printer-agent/` (Flask, `127.0.0.1:9100` only) — `escpos_translator.py` is the pure
  block→ESC/POS mapper (no layout, per D1), `connection.py` is a factory building a
  real `Usb`/`Network`/`Serial` printer or a hardware-free `Dummy`/`File` one from a
  per-machine `config.json`. 23 pytest tests (byte-level ESC/POS assertions against
  `Dummy`, mocked connection-factory selection, Flask endpoint behavior). Packaged with
  PyInstaller (`--collect-data escpos` — a real bundling bug found and documented) into
  a working `printer-agent.exe`; live-verified running standalone, answering
  `/health` and `/print` with no Python install. The "Cetak" button's agent-send path,
  built in 6B before the agent existed, needs zero FE changes now that 6C is real. All
  built without any printer hardware. Test baseline: **198 backend unit + 75
  Playwright + 23 agent pytest**, all green. `npx tsc --noEmit` + `npx svelte-check`
  clean. Only 6D.1 (physical print, hardware-dependent, user-run) remains before
  merging this phase to `main`.

### ⏳ Deferred / not built — tracked so nothing is forgotten
| Item | Why | Lands in |
|---|---|---|
| Dashboard **widget framework** (drag/resize/persist/admin catalog, WDG-002..006) | P3 shipped real dashboards first | later Phase 5 or Phase 7 |
| Ticket **attachments** (before/after photos, PLT-009) | spec Phase 2; no upload/storage infra; local-vs-cloud is a deploy decision | own task, post-MVP |
| Technician **calendar / schedule / commission** (TECH-011/013) | no scheduling/commission data model | Phase 8 |
| **RBAC** branch + multi-role in JWT; permission-driven sidebar | hardcoded role checks today | Phase 7, alongside the RBAC management UI |
| Real **P&L / Chart of Accounts / journal** (double-entry) | ledger single-sided by design | Phase 2+ / Phase 8 |
| **RBAC management UI** (permission matrix, custom roles) | | Phase 7.3 |
| **Printer** physical print checklist (6D.1) | 6A+6B+6C are all done and hardware-free tested; only a real ESC/POS printer can prove the last mile | Phase 6, user-run |
| Printer **label/garansi** print trigger | template seeded, no button anywhere calls it (Q2 scope) | later, when warranty (Phase 8) lands |
| Printer **template WYSIWYG editor** (edit `layoutConfig`'s flags in the UI) | 6B.1 shipped devices/assignments; template layout editing was always meant for the builder | Phase 7.2 |
| Settings: **Operational** (flow defaults, QC checklists, approval thresholds), **Financial** (currency/tax/fiscal year), **Document & Printing**, **Notification** (SET-004/005/006/007) | P9 scoped to Company/Branches/Users+Roles only, per the plan | Printing→Phase 6; rest→Phase 8 as their owning feature lands |

### Floating gaps (fold into whichever task touches them)
- ~~**2A.1 register / create-user endpoint**~~ — ✅ closed by **P9.2** (2026-07-24).
- **`err.code === '23505'` inside `db.transaction()`** — Drizzle wraps a transaction
  failure in a `DrizzleQueryError`; the real `PostgresError` (with `.code`) ends up at
  `err.cause.code`, not `err.code`. P9.2 fixed this for the new user-create route
  (checks both). The same latent bug still exists in `inventory/items.ts` (POST + DELETE),
  `suppliers.ts`, and `brands.ts` — each has a `23505`/`23503` check that silently never
  matches when the insert/delete runs inside `db.transaction()`, falling through to a
  generic error instead of the intended 409/404. Found 2026-07-24, not fixed everywhere
  (out of scope for P9) — fix each `err.cause?.code` alongside `err.code` next time one
  of those routes is touched.
- **H16 module migration** — when you touch a not-yet-migrated module (`modules/pos/`,
  `modules/purchasing/`), extract its `service.ts` + a test *then*. Never a refactor branch.
- **`catch (err: any)` sweep** (~36 sites) → `catch (err: unknown)` + shared `toBusinessError()`.
- **drizzle-zod adoption** (0 imports) — coding-guidelines §4 wants generated Zod schemas.

---

## Definition of Done (applies to every task)

> A task is `[x]` only with **a passing automated test**, **a recorded API request +
> response**, or **for frontend work, a click-path actually walked** (Playwright is installed,
> `flowserv-web/e2e/`). "I wrote the code and it looked correct" is **not** done.

---

## Later phases (roadmap — detailed task files authored when reached)

### Phase 6 — Printer Integration (Python)
Flask `POST /print` agent + python-escpos + per-paper-size templates (58/80mm) + printer CRUD
over the existing `printer_*` schema tables + settings UI + PyInstaller packaging. Zero code today.

### Phase 7 — Builder UIs
Flow Template Builder (upgrade read-only `/flows/[id]` to a node/transition editor), Printer
Template Builder (WYSIWYG, depends on Phase 6), **RBAC Management UI** (visual permission matrix
+ custom roles; builds on the Settings > Users tab and `GET /v1/roles` from 5.10 / P9.2).

### Phase 8 — Business Module Expansion *(remaining MVP, rough value order)*
- **Customer portal + magic-link approval** (SVC-007/CUST-009) — fixes the faked-approval flow · L
- **Service refund** (SBL-005 — consumes the dead `finance.approve_refund` permission) · M
- **Sales returns** (SAL-005 — void ≠ return) · L
- **Discount thresholds + approval** (SAL-006 — a cashier can currently zero out any sale) · M
- **Service categories + labor pricing** (CAT-001) · M
- **Stock adjustment / supplier + customer returns** (INV-008/009/010; opname is add-only) · M each
- **Stock-movement read endpoint** (INV-005 — written but never viewable) · M
- **Customer/device service history** + duplicate detection (CUST-005/008, DEV-005) · M
- **Warranty lifecycle** (WAR-001..006 — table was deleted in F6; design with the feature) · L
- **Technician skills + assignment recommendation** (TECH-002/003) · L
- **Expense + Cash management** (FIN-005/002 — without these any "profit" overstates margin) · M/L
- **Chart of Accounts / Journal / double-entry** (FIN-007/008/009 — **design decision needed**) · L

### Phase 9–11 — Testing, LAN, Production, VPS
- **9:** integration tests beyond the happy path, permission-matrix tests, multi-tenant isolation,
  `0.0.0.0` binding, one-click launcher, realtime WebSocket (PLT-013 — declared, not wired).
- **10:** real-shop onboarding, daily use, `pg_dump` backup strategy.
- **11 — pre-VPS security debt** (confirmed live): make `JWT_SECRET` throw-on-missing
  (`middleware/auth.ts`), remove the legacy SHA-256 password branch (`routes/auth.ts`), env-back
  the ~50 server-side `localhost:3001` URLs. *Pull the `JWT_SECRET` throw forward — one line,
  zero-risk if `.env` already sets it.*

---

## Progress log

**Track F** — ✅ COMPLETE 2026-07-23 (F1–F8). Evidence: `PHASES.md` Phase 3E/4 + git.
**Phase 4C** — ✅ COMPLETE 2026-07-23 (4C.1 config, 4C.2 enforcement). Closes Phase 4.

**Phase 5** (branch `phase-5/core-ui`):
- [x] P1.5 Mobile shell — 2026-07-23
- [x] P2 Ticket Kanban (3B.5 / 5.2) — 2026-07-23
- [/] P3 Role dashboards (5.1) — 2026-07-23 · real-data half done; widget framework deferred
- [/] P4 Ticket detail polish (5.3) — 2026-07-23 · core done; attachments deferred
- [x] P5 Finance dashboard modes (5.9→built as DAS-004) — 2026-07-23
- [x] P6 Inventory search + batch history (5.4) — 2026-07-23
- [x] P7 Mobile responsive sweep — 2026-07-24, see [P7-plus plan](./P7-plus-phase5-completion-plan.md)
      P7.1-P7.6, 6 commits. New `e2e/p7-mobile-sweep.spec.ts` (7 tests). Full suite 37 tests green.
- [x] P8 Global Search (5.7) — 2026-07-24, see [P7-plus plan](./P7-plus-phase5-completion-plan.md)
      P8.1-P8.3, 2 commits. `GET /v1/search`, `GlobalSearch.svelte`, `e2e/p8-global-search.spec.ts`
      (6 tests). Full suite 43 tests green.
- [x] P10 Product Catalog (5.5) — 2026-07-24, see [P7-plus plan](./P7-plus-phase5-completion-plan.md)
      P10.1-P10.3, 2 commits. `productSuppliers` surfaced on item detail, `/inventory/catalog`,
      `SupplierComparison.svelte`, `e2e/p10-catalog.spec.ts` (6 tests). Full suite 49 tests green.
- [x] P11 Technician quick actions (5.8) — 2026-07-24, see [P7-plus plan](./P7-plus-phase5-completion-plan.md)
      1 commit. Per-ticket transition buttons on the Technician dashboard, reusing the board's
      edge-filter logic server-side; no backend change. `e2e/p11-technician-actions.spec.ts`
      (4 tests). Full suite 53 tests green. Calendar/schedule (TECH-013) stays deferred.
- [x] P12 POS touch polish (5.6) — 2026-07-24, see [P7-plus plan](./P7-plus-phase5-completion-plan.md)
      1 commit. Fixed two real touch-target bugs: undersized qty stepper buttons, and
      drafts-modal action buttons hidden by `group-hover` (never fires on touch — a
      functional bug, not a sizing nit). `e2e/p12-pos-touch.spec.ts` (5 tests, including
      an `opacity` CSS check `toBeVisible()` alone would have missed). Full suite 58 tests green.
- [x] P9 Settings CRUD (5.10, incl. 2A.1) — 2026-07-24, see [P7-plus plan](./P7-plus-phase5-completion-plan.md)
      **closes Phase 5.** P9.1-P9.5, 4 commits. Real branch/user/company CRUD, admin-only
      permissions, login now checks `users.status`, last-Super-Admin lockout guard, tabbed
      `/settings` shell. `e2e/p9-settings.spec.ts` (7 tests). Full suite 65 tests green.

**Phase 5 is complete**, merged to `main` (fast-forward `26f06f4`, docs commit `4fae57f`).

**Phase 6** (branch `phase-6/printer`), plan: [`plan/phase-6-printer.md`](./phase-6-printer.md):
- [x] 6A.1 Seed: `printer.manage` permission + device/template/assignment rows — 2026-07-24.
      3 devices, 4 templates (incl. deferred `label`), 3 assignments deliberately asymmetric
      across branches (Cabang has no `invoice_a4` assignment, for 6A.4's fallback path).
      `npm run db:reset` twice — idempotent. `npx vitest run`: 183/183 (unchanged).
- [x] 6A.2 Pure render engine (`modules/printer/render.ts`) — 2026-07-24. `buildDocumentData()`
      + `renderThermalBlocks()` per decision D1 — the one place layout/alignment happens, shared
      by preview and the future Python agent. 15 unit tests. `npx vitest run`: 198/198 (+15).
- [x] 6A.3 Config CRUD (`routes/printer.ts` + `modules/printer/service.ts`) — 2026-07-24.
      `/v1/printer/devices|templates|assignments`, admin-only. `upsertAssignment()` validates
      device-branch, template-documentType, and device/template paperSize match. Verified live
      (curl, enforce mode): 403/200/201/422×3/404/400 all confirmed against real requests.
- [x] 6A.4 Render endpoint (`routes/print.ts` + `modules/printer/document.ts`) — 2026-07-24.
      `GET /v1/print/documents/:documentType/:id?paperSize=`, `requireAuth` only. Verified live
      end-to-end against a real POS invoice from the actual checkout API: branch-assignment
      resolution, the Cabang fallback path, `?paperSize=` override, 400/404/422 error paths,
      exact 48/32-char block-width checks. `npx tsc --noEmit` clean throughout 6A.

**6A (entire backend foundation) is done.**
- [x] 6B.1 Printer Settings tab (`PrinterTab.svelte`) — 2026-07-24, commit `99467ae`.
      Devices CRUD, read-only template list (WYSIWYG editor deferred to Phase 7.2 by
      design), assignment matrix that filters templates by the picked device's
      paperSize so a mismatch can't even be submitted. 5 Playwright tests, incl. one
      against the real Cabang seed asymmetry. No regression on 7 pre-existing
      `p9-settings` tests. `svelte-check`: 0 errors.
- [x] 6B.2-6B.4 Cetak flow (`ThermalPreview`/`A4Invoice`/`PrintButton.svelte`) —
      2026-07-24, commit `d4f52ed`. Built together — a preview component needs a real
      caller to be verifiable. Wired into `InvoiceDetailModal` as "Cetak Struk"/"Cetak
      Invoice A4". A4's print CSS makes the preview literally what `window.print()`
      sends; thermal's agent-send already handles 6C not existing yet (graceful
      offline message). 5 Playwright tests against real checkout-API invoices,
      including a spied `window.print()` call. **Full suite: 75 Playwright tests
      green** (every spec, zero regression). `svelte-check`: 0 errors.

**6A + 6B are done — the entire backend and frontend, with zero printer hardware.**
- [x] 6C.1 Flask `POST /print` + `GET /health` (`printer-agent/printer_agent.py`) —
      2026-07-24. Binds `127.0.0.1:9100` only. 7 pytest tests (`test_agent.py`: health,
      valid print, 3 bad-payload 400s, CORS preflight). Live-verified with the real
      process running (not just the test client): `/health` → 200, `/print` with a
      real block document → `{"status":"printed"}`, bad payloads → 400.
- [x] 6C.2 Block→ESC/POS translator (`escpos_translator.py`) — 2026-07-24. Pure
      `blocks_to_escpos()`, one branch per block type, raises on an unrecognized type
      instead of dropping it silently. 9 pytest tests against `python-escpos`'s `Dummy`
      backend, asserting real ESC/POS protocol bytes (bold/align/cut) and exact
      32/48-char width.
- [x] 6C.3 Connection handling (`connection.py`) — 2026-07-24. Factory for
      `Usb`/`Network`/`Serial`/`File`/`Dummy` from a per-machine, git-ignored
      `config.json` (defaults to `dummy` with none present). 7 pytest tests (mocked
      Usb/Network/Serial constructors). Live-verified: `file` mode wrote real
      inspectable ESC/POS bytes.
- [x] 6C.4 PyInstaller packaging — 2026-07-24. `--onefile --collect-data escpos` →
      working `printer-agent.exe`; found and documented a real bug (`capabilities.json`
      not bundled without `--collect-data`). Verified: the built exe alone (no Python)
      answers `/health` and `/print`.

**6A + 6B + 6C are done — 198 backend unit + 75 Playwright + 23 agent pytest, all
green.** Only **6D.1** remains: the physical print checklist in
`printer-agent/README.md` (hardware-dependent — the user runs this with a real 58/80mm
printer), then close out `plan/phase-6-printer.md` and merge `phase-6/printer` → `main`.
