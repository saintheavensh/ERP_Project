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
- [ ] H10 Stock reservation

Stage 4
- [ ] H11 Finance ledger
- [ ] H12 RBAC
- [ ] H13 API hardening

Stage 5
- [ ] H14 Payments
- [ ] H15 End-to-end verification

Continuous
- [ ] H16 Module migration (ongoing — never "done")
