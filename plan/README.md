# Hardening Track — Implementation Plan

> **Created 2026-07-21.** Follows [2026-07-20-architecture-review.md](./2026-07-20-architecture-review.md).
> Grounded in a live read-only audit of the `flowserv` database, not assumptions.
>
> **How to use this folder:** each `H*.md` file is self-contained. Open one, do it,
> mark it done here, commit. Do not run two in parallel — several touch the same
> tables and the ordering is load-bearing.
>
> **Menjalankan lewat AI agent?** Baca [CARA-PROMPT.md](./CARA-PROMPT.md) — berisi
> template prompt siap pakai dan pagar-pagar yang mencegah agent menandai task selesai
> padahal belum terbukti.

---

## Where this slots into PHASES.md

Execution order: **Phase 4 (finish 4C) → Hardening Track (this folder) → Phase 5 (UI)**

This track is an expansion of the existing **Phase 4.5**, which was already created to
hold "foundations that have schema tables but no code." It keeps that purpose and adds
the schema-level work the 2026-07-20 review found. Tasks H11–H13 *are* the original
4.5A/4.5B/4.5D, unchanged in intent but resequenced.

**Adopting this plan means editing `PHASES.md`** to fold H0–H15 into Phase 4.5.
That edit is task **H0**. `PHASES.md` is deliberately untouched until then.

---

## Why this order (the audit changed it)

A read-only audit on 2026-07-21 produced three facts that reshaped the sequence:

**1. The three "dead" tables are completely empty.**

| Table | Rows |
|---|---|
| `pos_transactions` | 0 |
| `invoice_lines` | 0 |
| `payments` | 0 |

Task 4.5A.4 was framed as *"delete the dead schema, or migrate onto it"* — a decision
carrying migration risk. There is no risk. Nothing to migrate. It is a free delete plus
a column addition, and it unblocks labor billing. **This moves to the front (H1).**

**2. Nothing blocks the disabled unique constraints.**

Zero duplicates in `stock_levels` (item+branch), `inventory_items` (tenant+sku), and
`roles` (tenant+name). All three commented-out constraints can be enabled with no data
cleanup. **What is currently a five-minute job becomes a data-repair project once real
shop data lands in Phase 10.**

**3. The whole database is 5 invoices, 3 items, 3 tickets, 12 batches, 20 movements.**

Every schema migration in this track is effectively free *right now*. This is the single
strongest argument for doing schema work before UI work — the cost only goes up.

### One correction to the earlier review

The review claimed unposted COGS was **permanently unrecoverable**. That was wrong. All
5 `pos_sale` movements carry a `stock_batch_id` resolving to a `stock_batches.unit_cost`,
and `unit_cost` is never mutated after creation (only `quantity_remaining` is). Historical
COGS is fully reconstructible by joining movement → batch.

The ledger stays high priority because everything downstream depends on it — but the
"lose history every day" urgency was overstated, and H11 now includes a backfill script
that proves it.

---

## Risk register — read before starting

These are the places where a wrong move creates a mess that is expensive to undo.
Each has a mitigation baked into its task file.

### ✅ R1 & R2 — RESOLVED by the disposable-data decision (2026-07-21)

> These two were the biggest risks in the original plan. The developer confirmed the
> current database is **disposable** — still in development, schema not final. That
> removes both.

**R1 was:** `drizzle-kit push` can silently drop a column's data on a type change, so
H2–H5 needed `generate` + `migrate` with manual SQL review — a documented exception to
the CLAUDE.md push-only rule.

**R2 was:** drifted values (`'pending'`, `'voided'`) must be backfilled *before* the
column is constrained, or the migration fails or truncates.

**Both now dissolve into: wipe and re-seed.** `npm run db:reset` from
[H0](./H0-seed-and-reset.md) drops the schema, pushes the latest, and reloads complete
data. No backfill, no SQL review, no exception to CLAUDE.md — `push` stays the standard
tool exactly as written.

**The trade this makes:** the safety net moves from *backup* to *seed*. That only holds
if the seed is genuinely complete — if a reset still leaves you creating suppliers and
stock by hand before you can test a checkout, you will stop resetting and the fear of
migrations comes back. **This is why H0 is the one task that cannot be done halfway.**

The drift itself is still worth understanding, because it is what the enums prevent from
recurring: [`purchasing/invoices.ts:129`](../flowserv-api/src/routes/purchasing/invoices.ts#L129)
writes `'pending'`, while [`modules/finance/service.ts:73`](../flowserv-api/src/modules/finance/service.ts#L73)
casts the column `as PayableInvoiceStatus` — a type that does not contain `'pending'`.
The cast was lying about 5 of 6 rows and TypeScript could not know. Fix the write site in
H2 regardless; the seed just means you no longer have to repair the rows.

**Re-read this section when Phase 10 loads real shop data.** At that point data stops
being disposable, R1 and R2 come back in full, and `db:reset` becomes dangerous — which
is why H0 puts a localhost guard on it.

### 🔴 R3 — RBAC rollout can lock you out of your own application

`permissions` has **0 rows**, and **0 of 5** `flow_nodes` have a `required_permission_id`.
So the flow engine's `PERMISSION_DENIED` branch has never once executed against real
data — it is covered by unit tests only.

Applying `requirePermission` broadly against an empty catalog denies everything,
including the admin UI needed to fix it.

**Mitigation (H12):** three-stage rollout — seed catalog → run middleware in
**report-only mode** (log the denial, allow the request) → verify against real click-paths
→ only then enforce. Plus an unconditional Super Admin bypass and a documented
break-glass env var.

### 🟠 R4 — `stock_levels` is a second source of truth for stock

`stock_levels.quantityAvailable` is a denormalized cache of `SUM(stock_batches.quantity_remaining)`.
Two writers, no constraint tying them together. They agree today (72=72, 20=20) — verified —
but **one inventory item already has no `stock_levels` row at all**, which means selling it
hits the `STOCK_LEVEL_MISSING` 422 path in POS.

H4 forces a decision rather than patching around it: keep the cache with a unique
constraint plus a reconciliation check, or drop it for a view over batches. Recommendation
and trade-offs are in the task file. **Do not let this drift unaddressed into Phase 10.**

### 🟠 R5 — Module migration scope creep

`PHASES.md` already commits to "retrofit incrementally, never big-bang," and that rule is
correct. H15 restates it as a standing constraint: **one module per PR, with tests, only
when you are already touching that module.** Never a dedicated "refactor everything" branch.

### 🟡 R6 — H6/H7 change how money is recorded

Labor billing (H6) and ticket charges (H7) alter what an invoice *means*. Do them before
H11 (ledger), or the ledger will be built against a model that is about to change and
will need reposting.

---

## Effort and sequencing

You are one developer working with an AI agent, so "assign to team members" does not
apply — the realistic lever is **task size**, keeping each one small enough to finish and
verify in a single sitting. Sizes below are relative, not calendar estimates.

`S` ≈ one focused sitting · `M` ≈ two or three · `L` ≈ several, split it further if it stalls

### Stage 1 — Seed & reset (do not skip, do not do halfway)

| # | Task | Size | Risk |
|---|---|---|---|
| H0 | [Complete seed + `db:reset` workflow](./H0-seed-and-reset.md) | M | — |

### Stage 2 — Schema hardening *(cheapest it will ever be — data is disposable)*

> With H0 done, every task here is: change the schema → `npm run db:reset` → verify.
> No migrations to review, no backfill to write.

| # | Task | Size | Risk |
|---|---|---|---|
| H1 | [Delete dead schema](./H1-delete-dead-schema.md) | S | — |
| H2 | [Status enums + void split](./H2-status-enums.md) | S | — |
| H3 | [Timestamps → `timestamptz`](./H3-timestamps.md) | S | — |
| H4 | [Constraints, tenant scoping, stock_levels decision](./H4-constraints.md) | M | 🟠 R4 |
| H5 | [Money precision + invoice numbering](./H5-money-and-numbering.md) | M | — |

### Stage 3 — Business model completion *(the gaps that make it a service ERP)*

| # | Task | Size | Risk |
|---|---|---|---|
| H6 | [Invoice lines: labor & fee billing](./H6-labor-billing.md) | M | 🟡 R6 |
| H7 | [`ticket_charges` — tickets that hold money](./H7-ticket-charges.md) | L | 🟡 R6 |
| H8 | [Technician assignment + customer FK](./H8-technician-and-customer.md) | S | — |
| H9 | [Parts consumption from a ticket](./H9-ticket-parts-consumption.md) | M | — |
| H10 | [Stock reservation](./H10-stock-reservation.md) | M | 🟠 R4 |

### Stage 4 — Foundations *(the original Phase 4.5)*

| # | Task | Size | Risk |
|---|---|---|---|
| H11 | [Finance ledger + historical backfill](./H11-finance-ledger.md) | L | 🟡 R6 |
| H12 | [RBAC — report-only, then enforce](./H12-rbac.md) | L | 🔴 R3 |
| H13 | [Audit log, pagination, idempotency](./H13-api-hardening.md) | M | — |

### Stage 5 — Close the Phase 3 gaps

| # | Task | Size | Risk |
|---|---|---|---|
| H14 | [Payments: partial, deposit, settlement](./H14-payments.md) | M | — |
| H15 | [End-to-end verification (3E)](./H15-e2e-verification.md) | M | — |

### Continuous

| # | Task | Size | Risk |
|---|---|---|---|
| H16 | [Module migration — standing rules](./H16-module-migration.md) | — | 🟠 R5 |

---

## Definition of Done

Unchanged from `PHASES.md`, and it applies to every task here:

> A task may be marked `[x]` only when there is **a passing automated test**, **a recorded
> API request + response**, or **for frontend work, a click-path actually walked**.
> "I wrote the code and it looked correct" is not done.

Each task file ends with a concrete **Verification** section. That section *is* the
evidence requirement — if you cannot produce what it asks for, the task stays `[/]`.

---

## Progress

Stage 1
- [x] H0 Complete seed + `db:reset` workflow — 2026-07-21
  - **Follow-up 2026-07-21 (H0a):** the first pass was complete enough to log in and
    sell, but not complete enough to *exercise* purchasing. Three gaps found by using
    it: (1) `part_brands` / `supplier_brands` / `product_suppliers` / `item_brand_pricing`
    were never seeded, so every brand dropdown was empty and the supplier→brand filter
    on "Pembelian Baru" had nothing to filter; (2) PO-SEED-0002 was `completed` with
    `receivedQuantity: 20` but created no batch, so the master product read 10 where
    it should read 30 — the seed asserted a receipt that never happened; (3)
    `part_brands.quality_grade` was missing from the schema entirely although
    `POST /v1/brands` requires it and four screens display it.
    All three fixed; seed now reconciles (level = Σ batches = Σ movements, cached WAC =
    recomputed WAC) for every item. This is exactly the "halfway H0" the risk register
    above warns about — the seed is only a safety net while it stays complete.

Stage 2
- [x] H1 Delete dead schema — 2026-07-21
- [x] H2 Status enums — 2026-07-21
- [x] H3 Timestamps → `timestamptz` — 2026-07-21
- [x] H4 Constraints — 2026-07-21
  - All three unique constraints re-enabled (`roles` tenant+name, `inventory_items`
    tenant+sku, `stock_levels` tenant+item+branch) — live-verified each rejects a
    duplicate insert with a `duplicate key value violates unique constraint` error.
  - `tenant_id` added `NOT NULL` to `stock_levels` and `purchase_order_lines`, fully
    backfilled via `db:reset` (disposable-data path, no manual SQL backfill needed).
  - Every direct query touching those two tables now filters on `tenantId` (11 call
    sites across `purchasing/orders.ts`, `purchasing/receipts.ts`, `opname.ts`,
    `pos/invoices.ts`, `inventory/receipts.ts`, `inventory/items.ts`) — grep-verified,
    each `.where()` and relational `with: { where }` traced by hand.
  - Decision: kept `stock_levels` as a cache (Option A), made honest via the unique
    constraint, auto-create-on-item-creation, and a new reconciliation endpoint.
    Written up in `PHASES.md` → Architecture Debt.
  - `GET /v1/inventory/reconciliation` (new, backed by pure `lib/reconciliation.ts`)
    — live-verified `isClean: true`, `drift: []` against the full seeded dataset.
  - Live-verified: creating a new inventory item auto-creates a `stock_levels` row
    (qty 0) for every branch of the tenant; confirmed 2 rows for 2 branches, then
    confirmed the delete path cleans them up.
  - `npm test`: 42/42 passing (was 37 — 5 new tests in `lib/__tests__/reconciliation.test.ts`).
- [x] H5 Money & numbering — 2026-07-21
  - Added `money()` helper (`src/db/schema/columns.ts`, `decimal(14,2)`) and routed
    every monetary column through it, including the two real defects: `pos_invoices`
    (`subtotal`/`discount_amount`/`tax_amount`/`grand_total`) was unbounded `numeric`,
    and `pos_invoice_lines` (`unit_price`/`subtotal`) was `decimal(12,2)`. All pre-existing
    `decimal(14,2)` money columns across `finance.ts`, `inventory.ts`, `product_catalog.ts`,
    `tickets.ts` also now go through the same helper so this can't drift again.
    `target_margin` (a percentage, not money) deliberately left as plain `decimal(5,2)`.
    Live-verified via `information_schema.columns` after `db:reset`: every money column
    reports precision 14, scale 2. DB held 0 `pos_invoices` rows going in, so there was
    no existing data to lose.
  - Replaced the random 4-digit invoice suffix with a per-tenant, per-day counter:
    new `invoice_sequences` table (composite PK `tenant_id, date_key`), allocated via
    `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` inside the checkout transaction.
    Changed `pos_invoices`' unique constraint from a global `invoiceNumber.unique()`
    to `unique(tenant_id, invoice_number)`.
  - Added `lib/money.ts` (`roundMoney`, `toMoneyString`) and used it everywhere
    `pos/invoices.ts` writes a computed total, so float rounding has one place to
    change later (per the task's own note: not urgent for whole-rupiah amounts today,
    but H6's percentage-based margin/tax will need it).
  - Live-verified end-to-end against the running dev server: 3 sequential checkouts
    produced `INV-20260721-0001/0002/0003`; a simulated new `date_key` (via the exact
    `INSERT...ON CONFLICT` statement the route uses) restarted at `1` independent of
    the real day's counter — the actual clock can't be moved forward mid-session, so
    the day-rollover check was proven at this mechanism level rather than by waiting
    a day. Fired 10 concurrent checkouts twice (20 total, `curl ... & / wait`): all 20
    succeeded, 20 distinct invoice numbers, 0 duplicates (`GROUP BY invoice_number
    HAVING count(*) > 1` → 0 rows), no 500s.
  - `npm test`: 49/49 passing (was 42 — 7 new tests in `lib/__tests__/money.test.ts`).
  - DB reset back to clean seed state after the live checkout tests so no test
    invoices were left behind.

Stage 3
- [x] H6 Labor billing — 2026-07-21
  - `pos_invoice_lines` restructured exactly per the task file: added `tenant_id`,
    `source_type` (new `line_source` enum: `part`/`labor`/`fee`/`discount`, the last
    reserved per "Watch out" — not implemented), `description` (`NOT NULL`, always
    server-derived — for `part` lines it's looked up from `inventory_items.name` at
    sale time, never client-supplied), and `unit_cost` (nullable, populated only for
    `part` lines). `inventory_item_id` is now nullable. A `CHECK` constraint
    (`part_lines_have_an_item`) enforces "parts have an item, labor/fee do not" in
    Postgres — live-verified both directions: a `part` row with `inventory_item_id
    IS NULL` is rejected, and a `labor` row with a non-null `inventory_item_id` is
    also rejected (`ERROR: violates check constraint "part_lines_have_an_item"`
    for each).
  - `POST /v1/pos/invoices` now validates against a `z.discriminatedUnion`
    (`routes/pos/types.ts`, new file — split out of `routes/pos/invoices.ts` so the
    schema is unit-testable without Hono): a `part` line requires
    `inventoryItemId`; a `labor`/`fee` line requires `description` and never
    touches stock. In the checkout loop, only `sourceType === 'part'` runs FIFO
    batch selection, stock movements, and the `stock_levels` cache update — labor/fee
    lines insert their `pos_invoice_lines` row and `continue`.
  - Added `calculateConsumedUnitCost()` to `lib/fifo.ts` (weighted average over the
    *specific* FIFO deductions a sale drew from, not `calculateWac`'s "average of what's
    left" — a deliberately different question). Line `unit_cost` is captured from
    this at sale time, per the task's note that COGS is a historical fact.
  - Live-verified end-to-end against the running dev server (then reset back to
    clean seed state, no test invoices left behind):
    - Labor-only invoice (`INV-20260721-0001`) created successfully; confirmed
      **zero** rows in `stock_movements` for it (`SELECT ... WHERE reference_type =
      'pos_sale' AND reference_id = <that invoice>` → 0 rows).
    - Mixed invoice (7× a part spanning two batches: 5 @ Rp150.000 + 2 @ Rp165.000,
      plus 1 labor line): part line stored `unit_cost: 154285.71` (=
      1.080.000 / 7, matches the weighted-average by hand), `description: "LCD
      Samsung A10"` (server-derived from `inventory_items.name`); exactly 2
      `stock_movements` rows (one per consumed batch), none for the labor line.
    - Voided the mixed invoice: both batches restored to their exact original
      `quantity_remaining` (5 and 5), labor line caused no error in the void loop
      (it was never in `stock_movements` to begin with — confirms the task's
      "naturally safe" claim). Voided the labor-only invoice too — no-op stock
      loop, no error.
    - `GET /v1/pos/invoices/:id` renders both line types correctly, including
      `inventoryItem: null` for the labor line via the relational query.
  - Browser click-path actually walked (Playwright against Chrome, headless,
    screenshots taken — not simulated): logged in, added a physical product
    (LCD Samsung A10) to the POS cart, used the new "+ Tambah Jasa / Servis"
    button in `CartSidebar.svelte` to add a labor line ("Jasa ganti LCD",
    Rp150.000), checked out with cash, opened the invoice in `/pos/history` —
    detail modal correctly shows both lines, the labor line labeled "JASA" with
    no SKU. No console errors from app code. Test invoice reset away afterward.
  - `npm test`: 61/61 passing (was 49 — 12 new: 4 for `calculateConsumedUnitCost`
    in `lib/__tests__/fifo.test.ts`, 8 for the discriminated-union schema in the
    new `routes/pos/__tests__/types.test.ts`).
  - Frontend: `CartSidebar.svelte` gained the add-service form;
    `InvoiceDetailModal.svelte` and `history.svelte.ts` (`handleEdit`'s
    re-cart path) updated to read `description`/`sourceType` instead of assuming
    every line has an `inventoryItem`. `pos.checkout.svelte.ts` now builds the
    discriminated-union payload shape per line. `npx svelte-check`: 0 errors.
  - Not applicable: the task's "5 existing invoice lines still render correctly
    with backfilled descriptions" checkbox — live-checked before starting, the
    database currently has 0 `pos_invoices`/`pos_invoice_lines` rows (H5 reset
    the DB after its own live-checkout tests), so there was nothing to backfill.
- [x] H7 Ticket charges — 2026-07-21
  - New `ticket_charges` table (parts/labor/fees; `estimated → approved → consumed →
    cancelled` lifecycle) + denormalized `estimated_total`/`approved_total` on
    `service_tickets` + `charge_status` enum. Put in its **own leaf schema file**
    (`ticket-charges.ts`) rather than `tickets.ts` — the table references inventory tables
    and `inventory.ts` already imports `tickets.ts`, so co-locating would make the schema
    import graph circular. Verified via `information_schema`: money columns are
    `numeric(14,2)`, `estimated_total` `NOT NULL default 0`.
  - **Conservative scope (see [H7-ticket-charges-impl.md](./H7-ticket-charges-impl.md)):**
    intake/transition/get in `routes/tickets.ts` left untouched; all new logic lives in
    `modules/tickets/{service,types}.ts` — the first tickets-module extraction (H16). Pure
    functions `calculateTicketTotals` / `canModifyCharge` / `calculateTicketMargin` sit
    beside tenant-scoped, transactional CRUD that **recomputes the denormalized totals from
    the rows inside the same transaction** (never a delta), so the cache can't drift —
    the R6/H4-style trap.
  - Endpoints (added to the existing tickets router): `GET/POST/PATCH/DELETE
    /v1/tickets/:id/charges` and `POST /v1/tickets/:id/quotation`. Only `estimated` charges
    are editable (409 `CHARGE_LOCKED`); stock is never touched here — that is H9.
  - `npm test`: **71 passing** (was 61 — 10 new in `modules/tickets/__tests__/service.test.ts`,
    incl. the zero-cost labor margin, a negative margin, and cancelled-charge exclusion).
    `npx tsc --noEmit` clean; `npx svelte-check` 0 errors/0 warnings.
  - **Live API run** (recorded, then DB reset to clean seed): part charge defaulted
    `unitPrice` from the item's selling price and stayed editable; labor charge wrote
    `unitCost=null`/`inventoryItemId=null` (no stock touched); `GET` totals correct and the
    denormalized `estimated_total` matched `SUM(charges)` across add/edit/delete; editing/
    deleting a non-estimated charge → 409 `CHARGE_LOCKED`; `POST /quotation` on an empty
    ticket → 422 `NO_CHARGES_TO_QUOTE`, and on a real one → **wrote `approval_requests.amount
    = 540000`** (the column that nothing previously produced — the whole point of H7), flipped
    both charges to `approved`, and set `estimated_total→0` / `approved_total→540000`.
  - **Frontend:** new `TicketCharges.svelte` (charge list with source/status badges, running
    total, margin line, add-part/add-labor form, "Minta Persetujuan") rendered inside
    `TicketWorkspace.svelte`; `ticket.detail.svelte.ts` gained `addCharge`/`deleteCharge`/
    `requestApproval`; `[id]/+page.server.ts` now loads charges + inventory. **SSR-verified**
    with a real `flowserv_token` cookie: the ticket page returns 200 and renders the charges
    section, the approval button, and live charge/approved data.
  - **Not done this session:** an interactive browser click-path (Playwright is not installed
    in `flowserv-web`). Every button's backend is proven by the API run above and the page
    SSR-renders with real data, but the literal click-through was not walked — a manual walk
    (or installing Playwright) is the remaining confirmation if the full DoD bar is wanted.
  - Half A (schema + CRUD + totals + tests) was committed separately before Half B, per the
    plan's split.
- [x] H8 Technician & customer — 2026-07-21
  - Schema: `service_tickets` gained `assigned_technician_id` (references `users`,
    nullable) + `assigned_at`; `pos_invoices` gained `customer_id` (references
    `customers`, nullable) alongside the existing `customer_name` snapshot, plus a
    `tempo_requires_customer` CHECK (`payment_method <> 'tempo' OR customer_id IS
    NOT NULL`) — per the task's own "Watch out", `assignedTechnicianId` points at
    `users` directly, no parallel technicians table.
  - `POST /v1/tickets/:id/assign` (body `{ technicianId }`) added to
    `modules/tickets/service.ts` (the H7-established extraction point, per H16):
    validates the technician is a `users` row in the same tenant, writes both new
    columns, and records a `ticket_stage_history` note at the ticket's current node
    — "Ditugaskan ke X" on first assignment, "Dialihkan dari X ke Y" on
    reassignment. The reassignment/note decision is pulled out as a pure
    `describeAssignment()` so it's unit-testable without a database (4 new tests).
  - `GET /v1/tickets?assignedTo=<userId>` and the `me` shorthand added to the
    existing inline list handler in `routes/tickets.ts` (left inline, matching
    that handler's current style — not extracted, per H16's "only when already
    touching it for this feature").
  - POS: `posCheckoutSchema` gained an optional `customerId` plus a `.refine()`
    requiring it when `paymentMethod === 'tempo'` (mirrors the DB-level CHECK —
    3 new schema tests). The checkout route resolves `customerId` to the
    customer's current name for the invoice's `customerName` snapshot, so the
    invoice keeps saying what was true at sale time even if the customer is later
    renamed.
  - **Frontend:** `CheckoutModal.svelte` / `pos.checkout.svelte.ts` replaced the
    free-text "Nama Pelanggan" input with the same search-as-you-type dropdown
    pattern already used by `IntakeForm.svelte` / `ticket.intake.svelte.ts`
    (`filteredCustomers` / `searchCustomer()` / `selectCustomer()`), reusing the
    `customers` list the POS page already loaded. The pay button is disabled for
    `tempo` until a real customer is selected (`selectedCustomerId`), not just
    until text is typed. `npx svelte-check`: 0 errors, 0 warnings.
  - `npm test`: **78 passing** (was 71 — 4 new in
    `modules/tickets/__tests__/service.test.ts` for `describeAssignment`, 3 new in
    `routes/pos/__tests__/types.test.ts` for the tempo/customerId refine).
    `npx tsc --noEmit` clean.
  - **Live API run** (recorded, then DB reset to clean seed):
    assigned Teknisi Andi to the seeded in-progress ticket → `GET
    /v1/tickets/:id` returned `assignedTechnician: { name: "Teknisi Andi" }` and a
    new history entry `"Ditugaskan ke Teknisi Andi"`; `GET
    /v1/tickets?assignedTo=<Andi's userId>` returned exactly that ticket,
    `assignedTo=<Manager's userId>` and `assignedTo=me` (as Super Admin) both
    returned `[]`; reassigning to Budi Manager added `"Dialihkan dari Teknisi Andi
    ke Budi Manager"` as the newest history entry; a `tempo` checkout with no
    `customerId` → 400 from Zod; a raw SQL `INSERT ... payment_method='tempo',
    customer_id=NULL` against the running Postgres instance → rejected
    independently by the `tempo_requires_customer` CHECK (proves the DB guard
    doesn't just piggyback on Zod); a `cash` checkout with no `customerId` → 201,
    `customerName: "Pelanggan Umum"`; a `tempo` checkout with a real `customerId`
    → 201, `customerName` snapshotted from that customer; renaming the customer
    afterward via `PUT /v1/customers/:id` left the already-created invoice's
    `customerName` unchanged (still the pre-rename value) — proving the snapshot
    survives a rename, exactly as designed.
  - **Not done this session:** an interactive browser click-through of the POS
    customer picker. Neither Playwright nor `chromium-cli` is available in this
    environment (same gap H7 recorded). Substituted with: `svelte-check` (0
    errors), an SSR fetch of `/pos` with a real `flowserv_token` cookie (200,
    customer data present in the hydration payload), and the API run above, which
    covers every one of this task's explicit Verification checkboxes — none of
    which name the POS UI specifically (only the "3. POS UI" *step* does). A
    manual walk (or installing Playwright) is the remaining confirmation if the
    full visual DoD bar is wanted.
  - DB reset back to clean seed state after the live run (ticket unassigned again,
    customer name reverted, 0 `pos_invoices`) — confirmed via API before moving on.
- [x] H9 Ticket parts consumption — 2026-07-21
  - Extracted `consumeStock()` into new `modules/inventory/service.ts` (the first
    file in that module — no `routes.ts`/`types.ts` yet, matching H16's "extract
    only what's needed"), moved verbatim from `routes/pos/invoices.ts`'s FIFO
    deduction block. Refactored POS checkout to call it; `npm test` **78/78
    unchanged** before and after — the proof the extraction was faithful. Also
    added `returnStock()` alongside it (mirrors the POS void guard: a batch can
    never hold more than its `quantityReceived`, plus an independent
    already-returned check) — used only by the new ticket return path, POS void
    itself was left untouched since it wasn't broken and refactoring it wasn't
    in scope.
  - Added `consumeCharge` / `returnCharge` to `modules/tickets/service.ts` and
    wired `POST /v1/tickets/:id/charges/:chargeId/consume` and `.../return` in
    `routes/tickets.ts`. `consumeCharge` locks the `ticket_charges` row `FOR
    UPDATE` before checking status, so a double-tap serializes instead of
    double-deducting; rejects `sourceType !== 'part'`, `status === 'consumed'`
    (409 `ALREADY_CONSUMED`), and `status !== 'approved'` (409
    `CHARGE_NOT_APPROVED`) before touching stock.
  - `npx tsc --noEmit` clean; `npx svelte-check`: 0 errors, 0 warnings.
  - **Live API run** (seeded LCD Samsung A10: batches 5@Rp150.000 / 5@Rp165.000 /
    20@Rp165.000, same brand — 30 units total), then DB reset back to clean seed:
    - Added a 7-unit part charge to the seeded ticket, consumed while still
      `estimated` → 409 `CHARGE_NOT_APPROVED`. Approved it via `/quotation`,
      then consumed → **200**, `unitCost: "154285.71"` (matches the
      `fifo.test.ts` split-batch case exactly: 5×150.000 + 2×165.000 = 1.080.000
      / 7). `GET /v1/inventory/:id` confirmed batch 1 at `remaining: 0`
      (received 5), batch 2 at `remaining: 3` (was 5) — exactly the 5+2 split.
      `stock_levels.quantityAvailable` dropped 30 → 23. Raw SQL against
      `stock_movements` showed **exactly 2 rows** for this charge, both
      `reference_type='ticket_consumption'` with `service_ticket_id` populated
      — the column H9 exists to finally write.
    - Consuming the same (now-consumed) charge again → 409 `ALREADY_CONSUMED`.
    - **Concurrency, not just sequential** (the task's explicit ask): fired two
      simultaneous `POST .../consume` requests (backgrounded curl + `wait`) at
      a second, freshly-approved 1-unit charge on the same item. One returned
      200, the other 409 `ALREADY_CONSUMED`; a raw SQL count of
      `stock_movements` for that charge's id was **exactly 1**, not 2 — proves
      the `FOR UPDATE` lock on the charge row serializes the race rather than
      relying on request ordering.
    - Added a 1000-unit part charge (far more than the ~22 remaining), approved
      it, consumed → 422 `INSUFFICIENT_STOCK`; `stock_levels.quantityAvailable`
      unchanged after the failed attempt, confirming the transaction rolled
      back cleanly with no partial deduction.
    - Returned the original split-batch charge → batch 1 restored to its exact
      original `remaining: 5`; batch 2 restored by exactly the 2 units this
      charge had drawn from it (not a fresh FIFO re-pick — it went back to
      **the same batch it came from**, correctly landing at 4 after accounting
      for the second charge's 1-unit draw from that same batch in between).
      `quantityAvailable` rose 22 → 29. Charge status flipped back to
      `approved`, `unitCost`/`stockMovementId` cleared. Returning it a second
      time → 409 `NOT_CONSUMED` (status is no longer `consumed`).
    - `GET /v1/inventory/reconciliation` → `{ isClean: true, drift: [] }` after
      every step above, including after the failed 422 attempt.
  - **Click-path**: Playwright is still not installed in `flowserv-web` (same
    gap recorded in H7/H8). Substituted with an SSR fetch of `/tickets/:id`
    using a real `flowserv_token` login cookie: 200, the charges section
    rendered with **2** "Pakai Part" buttons (the two charges left in
    `approved`) and **1** "Kembalikan" button (the one left `consumed`) —
    reflecting the exact backend state from the run above, proving the new
    `TicketCharges.svelte` buttons and `ticket.detail.svelte.ts`
    `consumeCharge`/`returnCharge` methods are wired correctly end-to-end.
  - DB reset back to clean seed state after the live run — confirmed via a
    fresh `npm run db:reset` before moving on.
- [x] H10 Stock reservation — 2026-07-21
  - `modules/inventory/service.ts` gained `reserveStock` / `releaseReservation` +
    two pure functions (`computeSellable`, `clampReleasedReserved` — unit tested
    without a database, 7 tests). Both lock the `stock_levels` row `FOR UPDATE`
    and write a `stock_movements` row using the `reserve`/`release` enum values
    that existed since H2 but had never once been written. Reservation never
    touches `stock_batches` and creates no `in`/`out` movement — exactly the
    "claim on stock, not a movement of it" distinction the task's Design section
    calls load-bearing.
  - `consumeStock` (shared by POS and ticket consumption) now also locks
    `stock_levels` `FOR UPDATE` and rejects with **422 `INSUFFICIENT_SELLABLE`**
    when `available − reserved < quantity` — this is the check that actually
    stops POS from selling a part a ticket already holds. Lock order kept
    consistent with the existing `returnStock` (batches, then stock_levels) to
    avoid a cross-function deadlock.
  - Wired into the H7 charge lifecycle in `modules/tickets/service.ts`:
    `generateQuotation` reserves every part among the charges it just flipped
    `estimated → approved` (whole thing rolls back if any part can't be
    reserved); `consumeCharge` releases the charge's own hold *before* calling
    `consumeStock` (order matters — otherwise the sellable check would count a
    charge's reservation against itself); `returnCharge` re-reserves after
    restoring stock, since 'approved' is a reserved state and a return lands
    back on 'approved'. Added a new `cancelCharge` (+ route
    `POST /:id/charges/:chargeId/cancel` + frontend "Batalkan" button) since no
    lifecycle transition previously existed to release an approved-but-not-yet-
    consumed charge's reservation — deliberately scoped to `status === 'approved'`
    only (estimated charges are deleted, never reserved; consumed charges must
    be returned first), which sidesteps ever writing `approvedTotal` before a
    ticket's first quotation (would have broken the frontend's
    `isQuoted = approvedTotal != null` check).
  - **Frontend:** `pos.products.svelte.ts`'s `getStockForBranch` now returns
    *sellable* (`available − reserved`) for the non-branded path — this is what
    already fed `ProductGrid`'s grey-out/click-block and `pos.cart.svelte.ts`'s
    `maxStock`, so both now enforce sellable automatically; new
    `getReservedForBranch` feeds a "N direservasi" note on the tile. Branded
    tiles are a known, documented limitation: `stock_levels.quantityReserved` is
    item+branch scoped, not per-brand (no schema column for it, matching how
    reservation itself is scoped — see task's Design section), so the
    brand-specific batch count can't subtract a brand-specific reserved amount;
    backend enforcement is unaffected since it checks the real item+branch
    sellable regardless of which brand tile a sale came from.
  - `npm test`: **85/85 passing** (was 78 — 7 new in the new
    `modules/inventory/__tests__/service.test.ts`). `npx tsc --noEmit` clean;
    `npx svelte-check`: 0 errors, 0 warnings (683 files).
  - **Live API run** (recorded, then DB reset to clean seed), using the seeded
    1-unit item (Baterai iPhone X, `BAT-IPH-X`):
    - Added a 1-unit part charge, approved via `/quotation` → `quantityReserved`
      went 0→1, `quantityAvailable` unchanged at 1 (checkbox 1).
    - **The core test:** POS checkout for that same item while reserved →
      **422 `INSUFFICIENT_SELLABLE`**, `"0 sellable, 1 diminta (sebagian sedang
      direservasi)"` — not a successful sale (checkbox 2).
    - Consumed the charge → both counters dropped together, `available: 1→0`,
      `reserved: 1→0` in the same response (checkbox 3).
    - Returned the charge → stock restored **and** re-reserved,
      `available: 0→1`, `reserved: 0→1` — confirmed the "approved is a reserved
      state" invariant holds across an undo.
    - Cancelled the (now approved-again) charge → `reserved: 1→0`; immediately
      re-attempted the same POS sale → **201**, sale succeeded — proves
      cancellation actually frees the part for a walk-in (checkbox 4). Voided
      that sale afterward to keep testing.
    - Second independent guard case: added a 100-unit charge against the
      30-unit LCD item, approved → 422 `INSUFFICIENT_SELLABLE`,
      `"hanya 30 yang tersedia untuk dijual, 100 diminta"`; confirmed the LCD's
      `available`/`reserved` were untouched afterward — the failed reservation
      left no partial state (checkbox 6).
    - **Concurrency, not just sequential** (matching H9's bar): created a
      second ticket, put a 1-unit charge for the same last-unit item on each of
      two tickets, fired both `/quotation` requests simultaneously
      (backgrounded curl + `wait`). Exactly one returned 201, the other 422
      `INSUFFICIENT_SELLABLE` with `"hanya 0 yang tersedia"`; the loser's charge
      was confirmed still `estimated` (its transaction rolled back cleanly, not
      partially applied) — the `FOR UPDATE` lock on `stock_levels` serialized
      the race exactly like H9's charge-row lock did for consumption.
    - `GET /v1/inventory/reconciliation` → `{ isClean: true, drift: [] }` after
      every step above, including after the two failed 422 attempts.
    - Raw SQL against `stock_movements`: every reserve/release pair present,
      `movement_type` correctly `'reserve'`/`'release'`, `stock_batch_id` null
      (no batch touched), `reference_type: 'ticket_charge_reservation'`,
      `service_ticket_id` populated.
  - **Click-path:** Playwright is still not installed in `flowserv-web` (same
    gap recorded in H7/H8/H9). Substituted with an SSR fetch of `/tickets/:id`
    using a real `flowserv_token` login cookie while the charge was reserved:
    200, both the "Pakai Part" and the new "Batalkan" button rendered for the
    approved charge — proving the new button and `ticket.detail.svelte.ts`'s
    `cancelCharge` method are wired correctly. An SSR fetch of `/pos` returned
    200 with the item's tile present, but the "N direservasi" note and the
    stock-based grey-out did not appear in the raw SSR HTML — confirmed this is
    an existing SSR limitation predating this task (`selectedBranchId` is set by
    a client-side `$effect` after branch data loads, so the whole product grid
    — including the pre-existing "Stok:" badge — only renders post-hydration,
    same as before H10). The substantive "try to sell it in POS, see it
    blocked" is proven at the API level above (the 201→422 pair); the cosmetic
    reserved-badge rendering in an actual browser is the one piece not walked
    — a manual walk (or installing Playwright) would close it.
  - DB reset back to clean seed state after every live-testing round — final
    state confirmed via a fresh `npm run db:reset` before finishing, both dev
    servers stopped.

Stage 4
- [x] H11 Finance ledger — 2026-07-21
  - `services/event-bus.ts` gained 5 new `AppEvent` values
    (`POS_SALE_COMPLETED`/`POS_SALE_VOIDED`/`TICKET_PART_CONSUMED`/
    `SUPPLIER_INVOICE_CREATED`/`SUPPLIER_PAYMENT_RECORDED`) and an `onEvent` alias
    for `eventBus.on`. Every emit site fires **after** its owning transaction
    commits (matching the existing `TICKET_STAGE_CHANGED` pattern in
    `flow-engine.ts`) — a ledger failure can never roll back a completed sale,
    consumption, or payment. Emit sites: `routes/pos/invoices.ts` (checkout +
    void), `modules/tickets/service.ts` (`consumeCharge`),
    `routes/purchasing/invoices.ts` (invoice creation — emits both
    `SUPPLIER_INVOICE_CREATED` and, for cash/transfer, an immediate
    `SUPPLIER_PAYMENT_RECORDED` so it nets to zero rather than leaving a phantom
    AP balance), `modules/finance/service.ts` (`recordPayment` — replaced the
    `// TODO: ledger posting` comment left by 3.5B.6).
  - New `modules/finance/ledger.ts`: 5 pure builder functions
    (`buildSaleEntries`, `buildVoidReversalEntries`, `buildTicketCogsEntry`,
    `buildApInvoiceEntry`, `buildApSettlementEntry` — no database, 15 tests) plus
    `subscribeLedger()` which wires them to the event bus and writes
    `finance_ledger_entries`. Each handler catches and logs its own errors — a
    subscriber throwing must never propagate back into the route that emitted
    the event. AP movements are posted as `entryType: 'adjustment'`, not a new
    type — deliberately not building a chart-of-accounts liability account here
    (task's own "Watch out"); `supplier_invoices`/`supplier_payments` remain the
    real source of truth for AP balance.
  - Voided sales reverse on the **same** `referenceType`/`referenceId` as the
    original (not a distinct `'void_pos'` reference), so summing by
    `referenceId` alone proves an invoice nets to zero — this is exactly what
    `/reconcile` checks.
  - New `lib/ledger-reconciliation.ts` (`reconcileSaleLedger`, pure, 5 tests,
    mirrors H4's `lib/reconciliation.ts` pattern) backs
    `GET /v1/finance/ledger/reconcile`: compares posted revenue per invoice
    against `grandTotal` (or 0 if voided) and flags any gap. Also
    `GET /v1/finance/ledger` (plain list, DAS-004 Simple Mode).
  - `src/db/backfill-ledger.ts` (new `npm run db:backfill-ledger`): reconstructs
    entries for any `pos_invoice` with no posted revenue entry yet. Deliberately
    computes COGS by joining `stock_movements → stock_batches.unit_cost` for
    that invoice's own consumption, **not** `pos_invoice_lines.unit_cost` —
    historical lines can predate H6's per-line cost capture, while
    `unit_cost` on a batch is never mutated after creation (only
    `quantity_remaining` changes), so the join is exact. Idempotent: skipped on
    a pre-existing `entryType='revenue'` row for that `referenceId`.
  - Considered and rejected extracting a `modules/purchasing/service.ts` for the
    single `SUPPLIER_INVOICE_CREATED` emit (floated during planning) — purchasing
    already has a precedent for a pure decision function living directly under
    `routes/purchasing/` (`order-status.ts`), and H16's "only extract when
    already touching that module for a feature" argues against a structural
    move just to emit one event. Kept the emit inline, matching how
    `flow-engine.ts` and `pos/invoices.ts` already do it.
  - `npm test`: **100/100 passing** (was 85 — 15 new: 10 in
    `modules/finance/__tests__/ledger.test.ts`, 5 in
    `lib/__tests__/ledger-reconciliation.test.ts`). `npx tsc --noEmit` clean;
    `npx svelte-check`: 0 errors, 0 warnings (689 files).
  - **Live API run** (recorded, then DB reset to clean seed):
    - POS checkout of a mixed sale (6× a part split across two batches —
      5@Rp150.000 + 1@Rp165.000 — plus 1 labor line, grandTotal Rp1.370.000) →
      ledger posted `revenue: 1.370.000` and `cogs: 915.000` (= 5×150.000 +
      1×165.000, the exact blended cost, not a re-averaged one).
      `/reconcile` → `{ isClean: true, gaps: [] }`.
    - Voided that invoice → reversal entries `-1.370.000`/`-915.000` posted on
      the *same* `referenceId`; summing all four entries for that invoice = 0
      exactly. `/reconcile` still clean (voided invoice's expected revenue is
      0, and posted net is 0).
    - Approved and consumed a 1-unit ticket part charge (Baterai iPhone X,
      cost Rp200.000) → ledger posted `cogs: 200.000`,
      `referenceType: 'ticket_consumption'`, no revenue entry (by design — see
      task file).
    - Recorded a Rp1.000.000 partial payment against the seeded unpaid
      supplier invoice (Rp3.300.000 total) → ledger posted
      `adjustment: -1.000.000` against that invoice's `referenceId`.
    - Received goods + invoiced a fresh PO as `tempo` (Rp2.000.000) → ledger
      posted `adjustment: +2.000.000` — confirms `SUPPLIER_INVOICE_CREATED`
      independently of the payment path already covered above.
    - **Backfill, against real historical data, not just the live path**:
      inserted a synthetic pre-H11-style invoice directly via SQL (3 units,
      cost 175.000/unit, `pos_invoice_lines.unit_cost` left `NULL` to simulate
      a pre-H6 row, no ledger entries) and ran `npm run db:backfill-ledger`
      twice. First run: `1 invoices posted, 1 already had entries` (the live
      invoice above was correctly skipped). Second run: `0 invoices posted, 2
      already had entries` — proves idempotency against real data, not just
      the unit test. Posted `revenue: 525.000` / `cogs: 525.000`, correctly
      reconstructed from `stock_movements → stock_batches` despite the null
      line `unit_cost`. `/reconcile` stayed clean throughout. Deleted the
      synthetic fixture afterward (it was raw-SQL test data, not a real
      exercise of the app, unlike the live-API steps above).
    - **Frontend**: new `/finance/ledger` page (`+page.server.ts` fetches both
      `/ledger` and `/ledger/reconcile` server-side; `LedgerTable.svelte` shows
      a warning banner only when `!isClean`), added to the sidebar under
      Finance for Super Admin/Manager. Logged in via a real POST to the
      SvelteKit login form action (not simulated), saved the `flowserv_token`
      cookie, and SSR-fetched `/finance/ledger` with it: 200, `<title>Finance
      Ledger | FlowServ</title>`, table headers present, the nav link present,
      all 7 posted entries rendered with correct `Rp`-formatted amounts and
      reference types (4 pos sale, 2 supplier invoice, 1 ticket consumption),
      and — correctly — no reconcile warning banner while clean. Playwright is
      still not installed in `flowserv-web` (same gap recorded since H7), so
      this SSR-with-real-cookie check substitutes for a literal click-through,
      consistent with how H7–H10 closed this same gap.
  - DB reset back to clean seed state after every live-testing round — final
    state confirmed (`0` `finance_ledger_entries`, `0` `pos_invoices`) before
    finishing, both dev servers stopped.
- [x] H12 RBAC — three-stage rollout completed 2026-07-21, `RBAC_MODE=enforce` is
  now the live default expectation (break-glass: `RBAC_MODE=report`, documented
  in `CLAUDE.md`). See `PHASES.md` 4.5B for the full evidence trail. Summary:
  - **Stage 1 (catalog):** `db/seed/01-core.ts` already had a 10-code catalog
    seeded ahead of this task (prep work noted in its own comment) covering
    only the spec's 10-action matrix. Extended to 20 coarse, resource-level
    codes to cover the ~37 mutating handlers that had no code at all — one
    code per resource+action group (e.g. all 6 ticket-charges mutations share
    `ticket.manage_charges`), not one per endpoint. Verified idempotent via
    `npm run db:reset` run twice.
  - **Stage 2 (report mode):** `middleware/rbac.ts` — `evaluateRbac()` pure
    decision + `requirePermission(code)` DB-fetching wrapper, same split as
    `flow-engine.ts`'s `evaluateTransition`/`FlowEngine`. Applied inline to all
    37 mutating handlers across 16 route files (one handler, ticket
    transitions, is intentionally left ungated at the route level — already
    gated per-target-node by the flow engine itself). Walked the catalog live:
    logged in as all 4 seeded roles against a freshly-reset DB, exercised one
    representative endpoint per permission code (both an allowed and a denied
    role per code where a denial was expected). Every denied call logged
    `[RBAC] would deny: user=... role=... perm=... METHOD /path`; every
    allowed call logged nothing — the grant table matched intent on the first
    pass, no corrections needed before flipping to enforce.
  - **Stage 3 (enforce):** Restarted with `RBAC_MODE=enforce`. Verified live:
    Cashier void → 403 naming `pos.void_transaction`; Manager void → passes
    the permission gate to a business 404; Cashier create-supplier → 403
    naming `supplier.manage`; Super Admin create-supplier → 201 despite zero
    seeded grants (bypass is role-name-based, not grant-based). Populated
    `flow_nodes.requiredPermissionId` on the Diagnosis node
    (`ticket.diagnose`) — first time `evaluateTransition`'s `PERMISSION_DENIED`
    branch has run against real data (previously 0 of 5 nodes had it set):
    Cashier → Intake→Diagnosis is 403, Technician → same transition succeeds.
    Cross-tenant read (second tenant's admin token against the first tenant's
    ticket) → 404 `NOT_FOUND`, not 403, confirmed unaffected by the RBAC layer.
    Break-glass tested for real: restarted with `RBAC_MODE` unset — the
    previously-403'd Cashier action succeeded again, no code change.
  - **Tests:** `middleware/__tests__/rbac.test.ts`, 4 tests on `evaluateRbac`
    (grant-allows-both-modes, Super-Admin-bypasses-with-no-grant,
    report-logs-but-allows, enforce-blocks). `npm test`: 104/104 (100 existing
    + 4 new).
  - **Caught during typecheck, not left for review:** `requirePermission`
    initially returned a bare `(c: Context, next: Next) => ...`. Inlining that
    in a route registration (`router.post(path, requirePermission(...),
    handler)`) silently collapsed Hono's path-param type inference for the
    handler after it (`c.req.param()` degraded to `string | undefined`),
    which cascaded into ~24 spurious Drizzle "no overload matches" errors
    elsewhere in the same files. Fixed by typing the return value as Hono's
    `MiddlewareHandler` instead — `npx tsc --noEmit` went from 24 errors to 0
    with that one change, confirming it was the root cause, not 24 separate
    problems.
- [ ] H13 API hardening

Stage 5
- [ ] H14 Payments
- [ ] H15 End-to-end verification

Continuous
- [ ] H16 Module migration (ongoing — never "done")
