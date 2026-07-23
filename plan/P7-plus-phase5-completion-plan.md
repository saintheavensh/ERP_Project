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

### P7 — Mobile responsive sweep  · FE only · size **M** · **do first**
Highest value / lowest risk, and directly the mobile-friendliness the whole app needs.
Purely additive Tailwind wrapping — every step trivially revertable. Pattern per table:
wrap in `<div class="overflow-x-auto">` nested inside the existing rounded container, add
`min-w-[Npx]` to the `<table>`, change header rows `justify-between` → `flex flex-wrap
gap-3 justify-between`, page padding `p-6` → `p-4 md:p-6`.

- **P7.1** Finance tables — `LedgerTable`, `PayablesTable`, `ReceivablesTable`. (1 commit)
- **P7.2** Purchasing list pages — `purchasing/+page` (All Purchases), `orders/`,
  `receipts/`. (1 commit)
- **P7.3** Purchasing detail/action — `[id]/`, `[id]/receive/`, `[id]/invoice/`, `new/`
  + `OrderLinesTable`, `ReceiveLines`. (1 commit)
- **P7.4** Inventory sub-pages — `receive/`, `brands/`, `categories/`, `opname/`,
  `SuppliersTable`, `suppliers/[id]/`. (1 commit)
- **P7.5** POS modals + misc — `InvoiceDetailModal` table, `PricingSimulator` table,
  `customers/[id]` + `tickets/intake` padding. (1 commit)
- **P7.6** One Playwright spec `p7-mobile-sweep.spec.ts` visiting each fixed page at 375px
  asserting `documentElement.scrollWidth <= 376`. (1 commit)

*Verification:* `svelte-check` 0 errors; the p7 spec + full suite green.

### P8 — Global Search (5.7 / PLT-007) · BE + FE · size **M**
- **P8.1** BE `GET /v1/search?q=` — tenant-scoped `ILIKE '%q%'` union across customers
  (name/phone), tickets (id/customer), inventory (name/sku), suppliers (name); capped,
  grouped by type in the response. (Substring first; real typo-tolerance is optional /
  Phase-2 — note it, don't block on it.) + unit test on the pure query-builder.
- **P8.2** FE search box in the app-shell header — **mobile: a search icon that expands**
  to a full-width overlay input; desktop: inline. Grouped dropdown results, each linking to
  its detail page.
- **P8.3** `p8-global-search.spec.ts` — type a known customer/SKU, see grouped results,
  click through; mobile overlay opens/closes.

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

### P10 — Product Catalog (5.5 / SUP-009) · FE-mostly · size **M**
- **P10.1** BE (only if needed) — a supplier-price-comparison read endpoint, or confirm
  the existing item + `itemBrandPricing` + `supplierBrands` data is enough client-side.
- **P10.2** FE `/inventory/catalog` — browse grouped by category, card grid (mobile:
  1-col → `sm:2` → `lg:3`), each card linking to the item detail.
- **P10.3** FE price-comparison view per item (brands/suppliers side by side) +
  `p10-catalog.spec.ts`.

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
**P7 (mobile sweep) → P8 (search) → P10 (catalog) → P11 (tech actions) → P12 (POS polish)
→ P9 (settings, largest).** P7 first because it makes everything already built usable on a
phone; P9 last because it's the biggest and needs the most new backend.
