# H7-IMPL — Ticket Charges: Step-by-Step (Conservative Scope)

> Execution checklist for [H7-ticket-charges.md](./H7-ticket-charges.md). Read that first
> for the *why*; this file is the *how*, in order. Self-contained — open it, do one step,
> check it off, move on.
>
> **Scope decision (locked 2026-07-21):** CONSERVATIVE. The H7 plan's step 2 suggests
> migrating the existing `intake` / `transition` / `get` endpoints out of
> [routes/tickets.ts](../flowserv-api/src/routes/tickets.ts) into a full module. We are
> **not** doing that here. Those endpoints work and have **no tests** to catch a
> regression. Per `PHASES.md` → Architecture Debt ("retrofit incrementally… do not
> refactor modules you are not otherwise changing") and R5 in [README.md](./README.md),
> we:
> - put all **new** charge logic in module shape: `modules/tickets/{service,types}.ts` +
>   `__tests__` (this is the first tickets-module extraction — the H16 rule);
> - add the charge **endpoints** to the existing `routes/tickets.ts`, delegating to the
>   service (keeps it the thin HTTP layer for tickets);
> - leave `intake` / `transition` / `get` **exactly as they are**.
>
> The full lift-and-shift is [H16](./H16-module-migration.md)'s job, later.

**Prereq:** H6 is done ✅ — `lineSourceEnum` (`part|labor|fee|discount`) already exists in
[enums.ts](../flowserv-api/src/db/schema/enums.ts) and is reused for `source_type`. No new
source enum needed.

**Ship in two halves** (per the plan's "Watch out → Scope"):
- **Half A** = Steps 1–8 (schema + CRUD + totals + tests). Ship and verify this first.
- **Half B** = Steps 9–12 (quotation/approval + frontend). Only start once A is green.

---

## Decisions locked (do not re-litigate mid-task)

1. **`ticket_charges` goes in a NEW schema file** `db/schema/ticket-charges.ts` (kebab-case
   per coding-guidelines §1), **not** in `tickets.ts`. Reason: the table references
   `inventoryItems`, `stockMovements` (inventory), `partBrands` (product_catalog), `users`,
   and `serviceTickets`. `inventory.ts` already imports from `tickets.ts`; adding the
   reverse edge inside `tickets.ts` makes the import graph circular. A leaf file that
   *nothing* imports back sidesteps that entirely. The two new **columns** on
   `service_tickets` still go in `tickets.ts` (they only need `money`, already imported).
2. **Money is stored as `decimal` → comes back as a STRING.** `parseFloat()` on read,
   `.toString()` on write. Never compare raw strings. (Same trap documented in
   [modules/finance/service.ts:66](../flowserv-api/src/modules/finance/service.ts#L66).)
3. **No `total` column on `ticket_charges`.** It is `quantity × unitPrice`, computed.
4. **Denormalized `estimatedTotal` / `approvedTotal` on the ticket are recomputed from the
   charge rows inside the SAME `db.transaction()` as every mutation.** Cache-drift is the
   main risk — see bottom. Same shape as the `stock_levels` cache (H4).
5. **This task NEVER touches stock.** Charges are estimates. `unitCost` and
   `stockMovementId` stay null here — [H9](./H9-ticket-parts-consumption.md) fills them at
   consumption.
6. **`unitPrice` defaults from the item's selling price but stays editable.** If the client
   sends a price, use it. If omitted on a `part` line, the service looks up
   `inventoryItems.sellingPrice`. Never hard-wire.
7. **`description` is `NOT NULL`.** For a `part` line, default it from `inventoryItems.name`
   (mirrors H6's server-derived description); `labor`/`fee` must supply their own.

---

## Half A — schema, CRUD, totals, tests

### Step 1 — enum
**File:** [db/schema/enums.ts](../flowserv-api/src/db/schema/enums.ts)
- Add `export const chargeStatusEnum = pgEnum('charge_status', ['estimated','approved','consumed','cancelled']);`
- Add the derived type: `export type ChargeStatus = (typeof chargeStatusEnum.enumValues)[number];`

### Step 2 — table + ticket columns
**New file:** `db/schema/ticket-charges.ts` — the `ticketCharges` table exactly as in the
H7 design block (reuse `lineSourceEnum` for `sourceType`; `unitPrice` via `money`,
`unitCost` nullable `money`, `status` default `'estimated'`, `stockMovementId` nullable,
`ticketIdx` index). Import `money` from `./columns`, enums from `./enums`, and the FK
targets from `./tickets`, `./inventory`, `./product_catalog`, `./core`.
**Edit:** [db/schema/tickets.ts](../flowserv-api/src/db/schema/tickets.ts) — on
`serviceTickets`, add `estimatedTotal: money('estimated_total').notNull().default('0')`
and `approvedTotal: money('approved_total')`. (`money` is already imported there.)
**Edit:** [db/schema/index.ts](../flowserv-api/src/db/schema/index.ts) — add
`export * from './ticket-charges';` (place it after `./product_catalog`, before the
relations export).

### Step 3 — relations
**File:** [db/schema/relations__untuk_relational_query_api_drizzle.ts](../flowserv-api/src/db/schema/relations__untuk_relational_query_api_drizzle.ts)
- Import `ticketCharges` from `./ticket-charges`.
- Add `charges: many(ticketCharges)` to `serviceTicketsRelations`.
- Add `ticketChargesRelations` (`ticket`, `inventoryItem`, `partBrand`, `stockMovement`,
  `createdByUser` — the ones you'll actually load with `.with`).

### Step 4 — push
- `cd flowserv-api && npm run db:reset` (drops schema → push → seed; localhost-guarded).
- Confirm the table exists and both new columns report `numeric(14,2)`.

### Step 5 — `modules/tickets/types.ts`
Zod inputs (hand-written Zod, matching the repo's current style):
- `createChargeInput`: `sourceType` enum(`part|labor|fee`), `description` optional,
  `inventoryItemId` uuid optional, `partBrandId` uuid optional, `quantity` int positive,
  `unitPrice` coerce number ≥ 0 optional. **Refine:** `part` ⇒ `inventoryItemId` required;
  `labor`/`fee` ⇒ `description` required and no `inventoryItemId`.
- `updateChargeInput`: partial of the above (description, quantity, unitPrice).

### Step 6 — `modules/tickets/service.ts`
**Pure functions first (no DB — these are what the tests hit):**
```
type ChargeCalcRow = { status: ChargeStatus; quantity: number; unitPrice: number; unitCost: number | null };
calculateTicketTotals(rows) -> { estimated, approved, consumed }  // Σ qty*unitPrice per bucket; 'cancelled' excluded
canModifyCharge(charge)     -> boolean                            // true only when status === 'estimated'
calculateTicketMargin(rows) -> { revenue, cost, margin }         // over non-cancelled; revenue=Σqty*unitPrice, cost=Σqty*(unitCost ?? 0)
```
**DB functions (throw `BusinessError` from `lib/errors`, tenant-scoped, transactional):**
- `addCharge(tenantId, ticketId, input, userId)` — verify ticket∈tenant (404 else); for a
  `part`, default `unitPrice` ← `inventoryItems.sellingPrice` and `description` ←
  `inventoryItems.name` when omitted; insert row; **recompute + write** `estimatedTotal`;
  return the charge. 201.
- `updateCharge(tenantId, ticketId, chargeId, input)` — load charge (verify it's this
  ticket's and this tenant's, 404 else); if `!canModifyCharge` → `BusinessError('CHARGE_LOCKED', …, 409)`;
  update; recompute totals.
- `deleteCharge(tenantId, ticketId, chargeId)` — same 404 / 409-if-not-estimated guard;
  delete; recompute totals.
- `listCharges(tenantId, ticketId)` — rows + `calculateTicketTotals` + `calculateTicketMargin`.

### Step 7 — endpoints in existing router
**File:** [routes/tickets.ts](../flowserv-api/src/routes/tickets.ts) — add, delegating to the
service (catch `BusinessError` → `errorResponse` with its `code`/`statusCode`, mirroring
[routes/finance.ts](../flowserv-api/src/routes/finance.ts)):
- `GET    /:id/charges`
- `POST   /:id/charges`            → 201
- `PATCH  /:id/charges/:chargeId`  → 200
- `DELETE /:id/charges/:chargeId`  → 200 (envelope helper always returns a body; no 204)

### Step 8 — tests + verify Half A
**New file:** `modules/tickets/__tests__/service.test.ts` — unit-test the three pure
functions, **including a zero-cost labor line** (contributes to revenue, not cost).
- `npm test` green (adds to the current 61).
- Recorded API run: add 2 parts + 1 labor to a ticket → `GET /:id/charges` returns 3 with
  correct total; `service_tickets.estimated_total` == Σ estimated; editing/deleting an
  `estimated` charge works; editing an `approved` charge → 409 `CHARGE_LOCKED`.

**→ Commit Half A before starting Half B.**

---

## Half B — quotation, approval, frontend

### Step 9 — quotation endpoint
**service.ts:** `generateQuotation(tenantId, ticketId, userId)` in one transaction —
flip every `estimated` charge to `approved`, compute the approved total, write it to
`serviceTickets.approvedTotal`, and insert an `approvalRequests` row with
`amount = approvedTotal` (that column exists and is what this fills — the whole point of
H7). Guard: 422 if there are no estimated charges to quote.
**routes/tickets.ts:** `POST /:id/quotation` → 201.

### Step 10 — frontend state
**File:** [ticket.detail.svelte.ts](../flowserv-web/src/lib/states/tickets/ticket.detail.svelte.ts)
- `charges = $state<any[]>([])`, `chargeForm` state, and methods `addCharge()`,
  `editCharge()`, `deleteCharge()`, `requestApproval()` hitting `${API_BASE}/tickets/${id}/…`
  (client-side uses `API_BASE`, per 3.5E.1), then `invalidateAll()`.

### Step 11 — frontend UI + load
**File:** [tickets/[id]/+page.server.ts](../flowserv-web/src/routes/(app)/tickets/[id]/+page.server.ts)
— also fetch `/v1/tickets/${id}/charges` (server-side hardcoded `localhost:3001` stays, per
3.5E.1) and pass it in `data`.
**New component:** `lib/components/tickets/TicketCharges.svelte` — list of charges (part /
labor / fee), add-part + add-labor mini-forms, running total, and a **"Request Approval"**
button. Render it inside
[TicketWorkspace.svelte](../flowserv-web/src/lib/components/tickets/TicketWorkspace.svelte),
below the customer/device grid.

### Step 12 — verify Half B + close out
Walk the click-path (real browser): open a ticket → add a part + a labor charge → see
running total → Request Approval → see the quoted total; confirm `approval_requests.amount`
matches. `npx svelte-check` 0 errors. Then update **`PHASES.md`** (3C.3/3C.4 precondition,
SVC-006/007, SBL-001 now unblocked) and the **Progress** section of
[README.md](./README.md) (`H7` → done, with the evidence). Commit.

---

## Verification (from the H7 plan — this is the Definition of Done)

Completed 2026-07-21 — full evidence in [README.md](./README.md) → Progress → H7.

- [x] Add 2 parts + 1 labor charge; `GET` returns all three with a correct total
- [x] `estimatedTotal` on the ticket matches the sum of its estimated charges (live-verified across add/edit/delete)
- [x] `POST /quotation` writes the correct `amount` (540000) into `approval_requests`
- [x] An `approved` charge cannot be edited or deleted (409 `CHARGE_LOCKED`)
- [x] `calculateTicketMargin` correct incl. a zero-cost labor line — unit tested, no DB
- [~] Click-path: **not** walked interactively (Playwright not installed) — instead the page
      was SSR-rendered with a real cookie (200, charges section + live data present) and every
      button's API was proven directly. Manual browser walk is the remaining confirmation.
- [x] `npm test` passing (71) with new tests for all three pure functions

## Watch out

- **Total drift is THE risk.** Every write path (add / edit / delete / quotation) must
  recompute `estimatedTotal` (and `approvedTotal` on quotation) from the rows and write it
  in the same transaction. If any path updates rows without recomputing, the cached total
  and `SUM(charges)` silently disagree — exactly the failure mode H4 constrained away for
  `stock_levels`. If unsure, re-`SELECT` the ticket's charges inside the txn and sum them;
  don't try to increment the cached number by a delta.
- Keep stock untouched (Decision 5). If you find yourself importing FIFO helpers here,
  stop — that's H9.
- Hono route order: `/:id/charges` and `/:id/quotation` are distinct paths from the
  existing `/:id`, `/:id/transition`, `/intake` — no conflict, but register them on the
  same `ticketsRouter` so `requireAuth` (already `use('*')`) covers them.
