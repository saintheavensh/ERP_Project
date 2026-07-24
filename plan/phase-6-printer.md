# Phase 6 — Printer Integration (plan)

> **Status (2026-07-24): 6A done.** Backend foundation (seed, pure render engine, config
> CRUD, render endpoint) is built and independently verified live, with zero printer
> hardware and zero FE — see `PHASES.md`'s Phase 6 section and this file's Progress log
> below for full evidence. Branch: `phase-6/printer`. Next: 6B (FE).
> **Read first:** [`specification/09-printer-integration.md`](../specification/09-printer-integration.md).
> **Convention:** this file lives only while Phase 6 is active. On completion it is deleted;
> durable evidence moves to `PHASES.md` + git (same as every `H*`/`F*`/`P*` file before it).

---

## 1. What already exists vs. what's greenfield

**Exists (verified 2026-07-24):**
- Schema tables — [`db/schema/printer.ts`](../flowserv-api/src/db/schema/printer.ts):
  `printer_devices`, `printer_templates`, `printer_assignments`. Relations **already wired**
  in `relations.ts` (device→branch/assignments, template→assignments, assignment→branch/device/template).
- The data a receipt renders from: `pos_invoices` + `pos_invoice_lines` (+ `customers`,
  `serviceTickets`, ticket charges for service docs). `GET /v1/pos/invoices` list endpoint exists.

**Greenfield (nothing exists):**
- No printer routes, no printer router mounted in `app.ts`, no `modules/printer/`.
- No seed rows for any `printer_*` table.
- No print code anywhere in `flowserv-web` (no `window.print`, no "Cetak" button, no preview).
- No Python agent, no `printer-agent/` directory.
- No `printer.*` RBAC permission in the seed catalog.

So this phase builds the whole feature from the tables outward.

---

## 2. The one architectural decision that governs everything

The spec's hardest rule (rule 3): **the render code used for PREVIEW and for ACTUAL PRINT
must be a single shared module — never duplicated.** And rule 1: thermal ESC/POS logic
must NOT live in the Hono backend — it stays in the separate Python agent.

These two rules only reconcile one way, so this plan commits to it:

> **Decision D1 — the backend renders a paper-agnostic "block document"; nobody else does layout.**
>
> A pure TS function `renderDocument(documentType, paperSize, layoutConfig, data)` produces an
> ordered list of **styled blocks** — already wrapped/aligned to the target character width
> (32 chars for 58mm, 48 for 80mm) — e.g.:
> ```jsonc
> [
>   { "type": "text",  "value": "TOKO SERVIS JAYA", "align": "center", "bold": true },
>   { "type": "line" },                                    // full-width dashes
>   { "type": "row",   "left": "LCD iPhone 11", "right": "1x  350.000" },
>   { "type": "total", "left": "TOTAL", "right": "350.000" },
>   { "type": "qr",    "value": "INV-20260724-001" }
> ]
> ```
> - **Preview** (browser, thermal): renders these blocks verbatim in a monospace box — WYSIWYG,
>   because the width is already baked in by the backend.
> - **Python agent** (thermal): does *no layout* — it only translates each block to the matching
>   `python-escpos` call (`p.set(align=..., bold=...)`, `p.text(...)`, `p.qr(...)`). Mechanical only.
> - **A4**: a *separate* render path (browser HTML + print CSS) fed by the *same* fetched `data`,
>   sent to `window.print()`. A4 never touches blocks or the agent (spec rule 2).
>
> This satisfies rule 3 (one layout implementation, in TS) and rule 1 (Python does zero layout,
> only ESC/POS emission). It mirrors the existing `evaluateTransition`/`FlowEngine` split: a pure
> decision function the tests exercise, with the side-effecting shell around it.

`layout_config` stays pure display config (which fields, order, bold/align) — **never** transaction
values (spec's "Template: Separate from Data"). Values are always re-fetched at render time.

---

## 3. Task breakdown

Each task ships BE+FE together where it has a UI surface, and is `[x]` only with the evidence
type listed (Definition of Done). Granular so each commit is independently revertable.

### 6A — Backend: config API + render engine (the foundation)

- **6A.1 — Seed + RBAC permission.** Add `printer.manage` to the seed catalog
  ([`db/seed/01-core.ts`](../flowserv-api/src/db/seed/01-core.ts) + `ids.ts`), admin-only
  (matching `audit.view`/`branch.manage` — NOT granted to Manager). Seed a default device
  (`os_printer`/A4 + one `80mm` thermal), the default templates (`receipt` 58/80mm +
  `invoice_a4`; also the `label` garansi template — defined per Q2, just no print trigger yet),
  and assignments for the demo tenant, in a new `db/seed/08-printer.ts`.
  *DoD: `npm run db:reset` twice → identical rows (idempotent, fixed UUIDs).*

- **6A.2 — Render engine (pure).** `modules/printer/render.ts` — `renderDocument()` per D1,
  plus width-aware helpers (`truncate`, `padRow(left,right,width)`, `formatMoney`). No HTTP,
  no DB. **This is the shared module; it is what the tests exercise.**
  *DoD: unit tests — 32- vs 48-char row alignment, long-name truncation, totals, the
  "detail increases with paper size" table (58 header-only vs 80 +cashier vs A4 +ticket info).*

- **6A.3 — Config CRUD routes.** `modules/printer/{routes,service,types}.ts` (the specified
  3-file module shape) — CRUD for devices, templates, assignments. All `requirePermission('printer.manage')`,
  `auditMiddleware`, tenant-scoped, standard envelope. Assignment upsert respects the existing
  `(branch_id, document_type)` unique constraint. Mount `printerRouter` in `app.ts`.
  *DoD: recorded curl for each verb incl. 403 for a non-admin and the unique-constraint 409.*

- **6A.4 — Render endpoint.** `GET /v1/print/documents/:documentType/:id?paperSize=` — fetches the
  real invoice/ticket data, resolves the branch's assigned template (falls back to the tenant
  default template for that type+size), runs `renderDocument()`, returns `{ blocks, meta }` for
  thermal OR the structured data for A4. Tenant-scoped; 404 if the document isn't the tenant's.
  *DoD: curl returns correct blocks for a seeded invoice; cross-tenant id → 404.*

### 6B — Frontend: preview + trigger (SvelteKit)

- **6B.1 — Printer Settings tab.** Extend the P9 tabbed `/settings` shell with a "Printer" tab
  (`?tab=printers`): device list + add/edit modal, template list, and the assignment matrix
  (per `document_type` → device + template). Reuses the exact modal/`?tab=` idiom from P9's
  `BranchesTab`/`UsersTab`. Mobile-first (`overflow-x-auto`, single-column forms).
  *DoD: Playwright — device create+edit, assignment set, mobile no-overflow.*

- **6B.2 — Thermal preview.** `ThermalPreview.svelte` — monospace box, exact char width, driven
  by 6A.4's blocks. Used both in the settings template view and next to the print button.
  *DoD: Playwright — preview width matches paperSize (32/48), verbatim block rendering.*

- **6B.3 — A4 render + `window.print()`.** `A4Invoice.svelte` (full letterhead layout) + a
  print stylesheet; the on-screen preview IS the printed HTML (spec's A4 WYSIWYG rule).
  *DoD: Playwright — print CSS present, `window.print` invoked (spy), A4-proportioned container.*

- **6B.4 — "Cetak" button.** On the POS invoice detail (`InvoiceDetailModal`) and the ticket
  detail page: one button that routes by the assigned device — thermal → POST to the agent
  (6C), A4 → `window.print()`. Graceful "agent not running" message if the localhost POST fails.
  *DoD: Playwright — button present, A4 path invokes print; thermal path shows the agent-offline
  message when no agent is running (the CI/default case).*

### 6C — Python agent (thermal only, localhost)

New top-level `printer-agent/` directory (a separate service, per spec rule 1 — NOT inside `flowserv-api`).

- **6C.1 — Flask `POST /print`.** Binds `127.0.0.1` only (spec: "must never accept connections
  from outside the cashier's computer"). Body = the block document from 6A.4 + target device
  connection info. `GET /health` for the FE to detect "agent running".
  *DoD: `POST /print` with a sample block doc returns 200; bind verified localhost-only.*

- **6C.2 — Block→ESC/POS translator.** Pure function `blocks_to_escpos(printer, blocks)` — one
  branch per block type (`text`/`line`/`row`/`total`/`qr`/`cut`). No layout decisions (D1).
  *DoD: pytest against `python-escpos`'s `Dummy` backend — asserts the emitted byte sequence for
  each block type. (Dummy backend = testable with **no physical printer**.)*

- **6C.3 — Connection handling.** usb/network/serial selection from the device config; the
  agent's own config file records which physical printer it drives.
  *DoD: unit test for the connection-factory selection; `Dummy`/`File` fallback documented.*

- **6C.4 — PyInstaller packaging.** `pyinstaller --onefile printer_agent.py` + a short
  `printer-agent/README.md` (install, auto-start on boot, first-run device registration).
  *DoD: a built `--onefile` artifact runs and answers `GET /health`.*

### 6D — Verify + docs

- **6D.1 — Physical print test (spec 6.4).** ⚠️ hardware-dependent — see Risk R1. Plan: the agent
  is fully testable via the `Dummy`/`File` python-escpos backend (byte-level assertions, no
  hardware); the **real** physical print on a 58/80mm printer is a checklist **you** run, since
  I have no printer attached. I provide the checklist + a `File` backend that writes the raw
  ESC/POS bytes to a file you can inspect.
- **6D.2 — e2e sweep.** Full Playwright + backend unit + agent pytest all green together.
- **6D.3 — Docs + commit.** Update `PHASES.md` (6.1–6.6 → `[x]`/`[/]` with evidence) and
  `plan/README.md`; delete this file; commit; branch-merge to `main` when the phase closes.

---

## 4. Decisions (resolved 2026-07-24)

- **Q1 — Physical printer → NONE.** Build against python-escpos's `Dummy`/`File` backend so the
  agent is fully test-covered at the byte level with **no hardware**. The real physical print is a
  checklist the user runs later (6D.1); it is not a silent `[x]`. Nothing in 6A/6B/6C is blocked.
- **Q2 — MVP scope → POS thermal receipt + A4 invoice first.** Prove the whole pipeline with two
  doc types (`receipt` 58/80mm + `invoice_a4`). The `label` (garansi) template is still *defined*
  in the seed but its print **trigger** is deferred — adding it later is a one-line button. This
  keeps the provable slice small.
- **Q3 — Python → AVAILABLE.** `python`/`py` = Python **3.14.0** on this machine, so 6C (Flask
  agent) + 6C.4 (PyInstaller) can be built here. (Note: 3.14 is new — if `python-escpos`/PyInstaller
  wheels lag, pin a compatible interpreter in `printer-agent/`; not expected to block.)

## 5. Suggested order

`6A.1 → 6A.2 → 6A.3 → 6A.4` (backend foundation, all testable without any printer) →
`6B.1 → 6B.2 → 6B.3 → 6B.4` (config UI + preview + A4 print, still no agent needed) →
`6C.1 → 6C.2 → 6C.3 → 6C.4` (Python agent) → `6D`.

This front-loads everything hardware-independent, so the only thing gated on a physical printer
(or on Python being available) is the tail — 6C/6D. If Q1/Q3 are "no", 6A+6B still deliver a
complete, verifiable config-and-A4-print feature.

## 6. Risks

- **R1 — hardware dependency.** Real ESC/POS output can only be *fully* validated on a physical
  printer. Mitigation: `Dummy`/`File` backend gives byte-level test coverage with no hardware;
  the physical step is an explicit user checklist (6D.1), not a silent `[x]`.
- **R2 — cross-origin to the agent.** The browser POSTs to `http://127.0.0.1:<port>` (the agent),
  a different origin from the app. Mitigation: the agent sets permissive CORS for localhost only,
  and the FE degrades gracefully when the agent is offline (6B.4).
- **R3 — width formatting bugs.** Off-by-one column alignment is the classic thermal bug.
  Mitigation: 6A.2 is a *pure* function with explicit 32/48-char alignment tests — the reason
  layout lives in tested TS, not in the Python agent.

## 7. Progress log

- [x] **6A.1** Seed + `printer.manage` permission — 2026-07-24, commit `8233bb7`. 3 devices
      (Pusat 80mm+A4, Cabang 58mm), 4 templates (receipt 58/80mm, invoice_a4, label),
      3 assignments deliberately asymmetric (Cabang has no `invoice_a4` row, to exercise
      6A.4's tenant-default fallback against real seed data). `npm run db:reset` run twice —
      idempotent. Direct DB query confirmed shapes + that the permission is Super-Admin-only.
      `npx vitest run`: 183/183 (unchanged).
- [x] **6A.2** Pure render engine — 2026-07-24, commit `610bd02`. `modules/printer/render.ts`:
      `buildDocumentData()` (the one place `layoutConfig` is read) + `renderThermalBlocks()`
      (all column alignment via `padRow()`/`truncate()`, producing already-padded block
      strings so nothing downstream recomputes alignment). Revised `ThermalBlock`'s row/total
      shape from 6A.1's draft (`left`/`right` → single padded `value`) to actually satisfy
      "one shared render module." 15 unit tests. `npx vitest run`: 198/198 (+15).
- [x] **6A.3** Config CRUD — 2026-07-24, commit `f27d70b`. `routes/printer.ts` +
      `modules/printer/service.ts`, mounted at `/v1/printer`, admin-only. `upsertAssignment()`
      validates device-branch, template-documentType, and device/template paperSize match —
      real constraints, not just existence checks. Verified live (curl against a running dev
      server in `RBAC_MODE=enforce`): Manager → 403; Super Admin → 200 list/201 create/200
      update; cross-tenant branch → 404; invalid `connectionType` → 400 (Zod); all three
      assignment mismatch guards → 422 with the specific code; upsert updates the existing
      `(branchId, documentType)` row rather than duplicating it. Dev DB reset to clean seed
      state afterward. `npx vitest run`: 198/198, no regression.
- [x] **6A.4** Render endpoint — 2026-07-24, commit `257aaf0`. `routes/print.ts` +
      `modules/printer/document.ts`, `GET /v1/print/documents/:documentType/:id?paperSize=`,
      `requireAuth` only (not admin-gated — printing your own sale isn't a printer-admin
      action). Rejects `label` (`DOCUMENT_TYPE_NOT_SUPPORTED`, no data source wired yet).
      Found along the way: `service_tickets` has no complaint/diagnosis columns in this
      schema (a real, already-known gap) — scoped `DocumentData.extra` down to just
      `technicianName`, the one field with a real relation, rather than inventing the rest.
      Verified live end-to-end against a **real POS invoice created through the actual
      checkout API** (not a fixture): Pusat receipt → its real 80mm assignment; Cabang
      receipt → its real 58mm assignment; Cabang `invoice_a4` (no assignment exists) →
      tenant-default A4 fallback with `assignment: null`; explicit `?paperSize=58mm` on
      Pusat (whose real assignment is 80mm) → same fallback shape; `label` → 400; missing
      invoice → 404; cross-tenant invoice → 404; a freshly-created branch with zero printer
      assignments → 400 `PAPER_SIZE_REQUIRED`; exact block-width check — every 80mm
      row/total block is precisely 48 characters. Dev DB reset to clean seed state
      afterward. `npx tsc --noEmit` clean throughout 6A. `npx vitest run`: 198/198.

**6A is complete — the entire backend foundation, verified without any printer hardware or
frontend, per Q1.** Next: 6B (Settings UI).
