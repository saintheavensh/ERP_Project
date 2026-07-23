# Phase 5 completion — audit & step-by-step plan (P7 onward)

> **Created 2026-07-24.** A codebase audit of what's genuinely done, what's half-built,
> and what needs fixing across FlowServ, plus the remaining Phase 5 work broken into
> **small, individually-revertable steps** (one commit per step). Same conventions as
> [README.md](./README.md): a task's `plan/*.md` file (if any) is authored when it starts and
> deleted on completion — durable evidence moves to `PHASES.md`. Mark done in README's
> Progress log with evidence.
>
> **Standing rule for every FE step below:** build/fix **mobile-first**. The app runs on
> the service floor and at a POS counter, not only a desk (see `specification/08-ui-ux.md`
> principle #3, broadened in P1.5). Every table gets a horizontal-scroll wrapper, every
> header row wraps, page padding is `p-4 md:p-6`. Verify each with a 375px Playwright pass
> (no page-level horizontal overflow) — the same bar P1.5–P6 held.

---

## Part 1 — Status audit (what the code actually is today)

### ✅ Fully done (built + tested + mobile-safe)
- **Auth / RBAC / audit / ledger foundations** — Hardening Track H11–H17, verified.
- **Ticket lifecycle** — intake → diagnosis → charges → quote → consume → invoice → close
  (e2e `intake-to-close.spec.ts`), **Kanban board** (P2), **detail polish** (P4).
- **Per-role dashboards** (P3), **Finance dashboard Simple/Accountant** (P5).
- **Inventory list + search/filter + batch history** (P6).
- **App shell** responsive drawer (P1.5). Tables already fixed: tickets, customers,
  inventory, POS history, purchasing invoices, brand-pricing.
- **POS checkout** flow (touch layout done in P1.5, `resp=11` on the page).

### 🟡 Partial — built but a documented piece was deliberately deferred
- **5.1 dashboards (P3)** — interactive widget framework (drag / resize / per-user
  persisted layout / admin widget catalog, WDG-002..006) deferred. Real dashboards ship.
- **5.3 ticket detail (P4)** — attachments / before-after photos deferred (PLT-009 is
  spec Phase 2; zero upload/storage infra exists).
- **Finance** — single-sided ledger by design; no Chart of Accounts / journal entries /
  P&L-with-debits (10-finance.md says this is intentional, Phase 2+).

### 🔧 Needs fix — built but broken or misleading on mobile / incomplete
- **Mobile table overflow (confirmed):** these render real multi-column tables with **no**
  `overflow-x-auto` wrapper, so they force whole-page horizontal scroll on a phone:
  - `finance/`: `LedgerTable.svelte`, `PayablesTable.svelte`, `ReceivablesTable.svelte`
  - `purchasing/`: `orders/`, `invoices/` list is OK, `receipts/`, `+page` (All Purchases),
    `[id]/`, `[id]/receive/`, `[id]/invoice/`, `new/`, `OrderLinesTable.svelte`,
    `ReceiveLines.svelte`
  - `inventory/`: `receive/`, `brands/`, `categories/`, `opname/`, `SuppliersTable.svelte`,
    `suppliers/[id]/`
  - `pos/`: `InvoiceDetailModal.svelte` (line-items table), `PricingSimulator.svelte`
  - Minor: `customers/[id]/`, `tickets/intake/` use `p-6` (not `p-4 md:p-6`) — low risk,
    fold in opportunistically.
  - *(False alarms, already safe: `finance/+page.svelte`'s P&L is a narrow 2-col table.)*

### ❌ Not built at all (remaining Phase 5 scope)
- **5.5 Product Catalog** — browse-by-category + supplier price comparison. Data exists
  (`itemBrandPricing`, `supplierBrands`) but no catalog view.
- **5.7 Global Search (PLT-007)** — nothing, FE or BE.
- **5.8 Technician Dashboard** — My Jobs done (P3); Quick Actions buildable; Calendar /
  Schedule has **no data model** (defer, Phase 8).
- **5.10 Settings** — page is a placeholder; backend is **read-only** (`/branches`,
  `/users`, `/settings/payment-methods` are all GET). Real CRUD is missing:
  create/edit branches, create/edit users (+**2A.1 register endpoint**, still absent),
  company profile. Printer config → Phase 6; RBAC matrix editor → Phase 7.

---

## Part 2 — The plan (ordered, each step = one revertable commit)

### P7 — Mobile responsive sweep  · FE only · size **M** · ✅ DONE 2026-07-24
Highest value / lowest risk, and directly the mobile-friendliness the whole app needs.
Purely additive Tailwind wrapping — every step trivially revertable. Pattern per table:
wrap in `<div class="overflow-x-auto">` nested inside the existing rounded container, add
`min-w-[Npx]` to the `<table>`, change header rows `justify-between` → `flex flex-wrap
gap-3 justify-between`, page padding `p-6` → `p-4 md:p-6`.

- [x] **P7.1** Finance tables — `LedgerTable`, `PayablesTable`, `ReceivablesTable`. (commit `b2a14f8`)
- [x] **P7.2** Purchasing list pages — `purchasing/+page` (All Purchases), `orders/`,
  `receipts/`, `invoices/`. (commit `c71d1e7`)
- [x] **P7.3** Purchasing detail/action — `[id]/`, `[id]/receive/`, `[id]/invoice/`, `new/`
  + `OrderLinesTable`, `OrderHeader`, `ReceiveLines`. (commit `3220c17`)
- [x] **P7.4** Inventory sub-pages — `receive/`, `brands/`, `categories/`, `opname/`
  (+ `OpnameFooter`), `suppliers/` (+ `SuppliersTable`). `suppliers/[id]/` audited, already
  fine. (commit `c0bee31`)
- [x] **P7.5** POS modals + misc — `InvoiceDetailModal` (2 tables + info grid + footer),
  `PricingSimulator` (batch table), `customers/[id]` + `tickets/intake` padding. (commit `59c3c86`)
- [x] **P7.6** `e2e/p7-mobile-sweep.spec.ts` — 7 tests (375px sweep of every page above +
  1280px confirm-unchanged), all passing. (commit `658ecb4`)

*Verification, all confirmed:* `svelte-check` 710 files 0 errors after every sub-step;
full e2e suite 37 tests green; `npm test` 179 backend unit passing (untouched, FE-only task).

### P8 — Global Search (5.7 / PLT-007) · BE + FE · size **M** · ✅ DONE 2026-07-24
- [x] **P8.1** BE `GET /v1/search?q=` — tenant-scoped `ILIKE '%q%'` across customers
  (name/phone), tickets (via joined customer name/phone + device brand/model/serial —
  tickets have no own free-text field), inventory (name/sku/universal code), suppliers
  (name/contact); capped at 5 per type, grouped in the response. Substring only —
  typo-tolerance explicitly deferred (noted, not silently dropped). `modules/search/
  service.ts` keeps `buildLikePattern()` pure and separate from the DB-touching
  `searchAll()`, 4 unit tests. (commit `1581786`)
- [x] **P8.2** FE `GlobalSearch.svelte` in the app-shell header — desktop: inline input +
  dropdown (centered, closes on outside click); mobile: icon that opens a full-screen
  overlay (no room for inline next to the hamburger at 375px). Debounced 250ms, 2-char
  minimum, each result links to its detail page. (commit `3b099f7`)
- [x] **P8.3** `e2e/p8-global-search.spec.ts` — 6 tests: customer/inventory/supplier
  lookups, sub-2-char hint, outside-click close, mobile overlay open/navigate/close.
  Caught a real bug pre-merge: the desktop dropdown was opening (hidden, but still in
  the DOM) even when the *mobile* input triggered the search, duplicating every result
  node. Fixed in the same commit. (commit `3b099f7`)

*Verification, all confirmed:* `svelte-check` 711 files 0 errors; full e2e suite 43 tests
green; `npm test` 183 backend unit passing (179 + 4 new).

### P9 — Settings pages (5.10) · BE + FE · size **L** (split hard)
Real CRUD is the bulk here. Each BE step is its own commit with a live-curl proof.
- **P9.1** BE branches CRUD — `POST /v1/branches`, `PATCH /v1/branches/:id`
  (RBAC-gated, audited). (1 commit)
- **P9.2** BE users — `POST /v1/users` (**closes 2A.1**, create user + role assignment,
  bcrypt), `PATCH /v1/users/:id` (status/role). (1 commit)
- **P9.3** BE company/tenant profile — `GET`/`PATCH /v1/settings/company`. (1 commit)
- **P9.4** FE settings shell — tabbed page (Company / Branches / Users & Roles / Payment
  Methods), mobile-first (tabs scroll horizontally, forms single-column). (1 commit)
- **P9.5** FE each tab wired to its endpoint, `p9-settings.spec.ts`. (1 commit)
- *Out of scope here:* Printer config (Phase 6), RBAC permission-matrix editor (Phase 7) —
  link to them as "coming in Phase 6/7" placeholders.

### P10 — Product Catalog (5.5 / SUP-009) · FE-mostly · size **M** · ✅ DONE 2026-07-24
- [x] **P10.1** BE — no new endpoint needed. `GET /v1/inventory/:id` gained
  `productSuppliers` (with `supplier`): the relation already existed
  (`relations.ts`) and was already seeded with real data, but had zero
  consumers — the audit in Part 1 missed this one because it doesn't show up
  as a broken UI, just a table nobody reads. (commit `cdb4668`)
- [x] **P10.2** FE `/inventory/catalog` — browse grouped by category, card grid
  (mobile 1-col → `sm:2` → `lg:3`), reusing the same list data `/inventory`
  already fetches. Search + category-select filter, linked from the sidebar
  and a new button on `/inventory`. (commit `1d4bf2c`)
- [x] **P10.3** FE `SupplierComparison.svelte` on the item detail page — supplier
  name, last price, "Utama" badge on the primary supplier, next to the
  existing `BrandPricing` table (brand comparison already existed there).
  `e2e/p10-catalog.spec.ts` — 6 tests. (commit `1d4bf2c`)

*Verification, all confirmed:* live curl (two suppliers, correct `isPrimary`/
`lastPrice`); `svelte-check` 717 files 0 errors; full e2e suite 49 tests green;
`npm test` 183 backend unit passing (untouched by P10.2/P10.3).

### P11 — Technician quick actions (5.8, buildable part) · FE · size **S**
- **P11.1** Add Quick-Action buttons to the Technician dashboard (from P3's My Jobs tile):
  jump straight to the next legal transition on an assigned ticket (reuse the board's
  `move()`/`targetsFor()` logic). Mobile-first tiles.
- **P11.2** `p11-technician-actions.spec.ts`.
- *Deferred:* Calendar / Schedule (TECH-013) — no scheduling data model exists; Phase 8.

### P12 — POS touch polish (5.6) · FE · size **S**
- **P12.1** Audit POS at 375px against "big buttons / touch targets" — bump tap-target
  sizes, spacing where thin. Mostly done in P1.5; this is a targeted polish pass, likely
  1 small commit. `p12-pos-touch.spec.ts` if anything material changes.

---

## Part 3 — Deferred, catalogued so they're not forgotten
| Item | Why deferred | Where it lands |
|---|---|---|
| Widget framework (drag/resize/persist/catalog) | P3 shipped real dashboards first | later Phase 5 or Phase 7 |
| Ticket attachments (photos) | PLT-009 spec Phase 2; no storage infra; local-vs-cloud is a deploy decision | own task, post-MVP |
| RBAC permission-matrix editor | PHASES.md 7.3 | Phase 7 |
| Printer config UI | needs the Python agent | Phase 6 |
| Technician calendar / commission | no scheduling/commission data model | Phase 8 |
| Real P&L / Chart of Accounts / journal | ledger single-sided by design | Phase 2+ |

## Suggested order
~~P7 (mobile sweep)~~ ✅ → ~~P8 (search)~~ ✅ → ~~P10 (catalog)~~ ✅ → **P11 (tech actions, next)** →
P12 (POS polish) → P9 (settings, largest). P9 last because it's the biggest and needs the
most new backend.
