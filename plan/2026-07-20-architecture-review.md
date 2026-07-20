# Architecture Review — Phases 0–4

> **Written 2026-07-20** against branch `phase-4/purchasing-completion`.
> Verified by reading code, not by trusting `PHASES.md`. Every claim below has a
> file:line reference or a command output behind it.
>
> **Verification baseline at time of writing:**
> - `npx tsc --noEmit` → exit 0, no errors
> - `npx vitest run` → 37 passed / 37, 6 files
> - `npx svelte-check` → 682 files, 0 errors, 0 warnings

---

## 1. What Phases 0–4 Still Do Not Have

`PHASES.md` is broadly honest since the 3.5 correction. Two corrections and the real
remaining list:

### Stale checkboxes (work IS done, box is not ticked)

| Task | Reality |
|---|---|
| 2B.5 Flow engine unit tests | **Done.** `services/__tests__/flow-engine.test.ts` exists and passes. The note "no test files exist anywhere in the repo" is left over from the pre-3.5 audit. |
| 3D.6 (partial) FIFO tests | **Done for FIFO** (`lib/__tests__/fifo.test.ts`, 6 tests). Ledger accuracy half is genuinely absent. |

### Genuinely not built

| Task | What is missing | Blocks |
|---|---|---|
| 2A.1 | Register endpoint. Only login exists in `routes/auth.ts`. | Onboarding any second user without a DB insert |
| 3B.5 | Ticket Kanban board | Phase 5.2 |
| 3C.3 | Parts reservation. `quantityReserved` is only ever written as literal `0`. | SVC-008, PUR-005 |
| 3C.4 | Parts consumption from a ticket. FIFO deduction exists **only** in POS checkout. | 3E.1, INV-006 |
| 3D.2 | Payment processing (partial/DP) | SAL-004, SBL-002 |
| 3D.3 | Finance ledger posting. `financeLedgerEntries` is written by **zero** routes. | All of Phase 4.5A, every report |
| 3D.5 | Payment form (FE) | — |
| 3E.1–3E.3 | End-to-end flow verification | Phase 5 |
| 4C.1 | Margin config endpoint. Columns `marginStrategy`/`targetMargin` exist on both `inventory_categories` and `inventory_items`; **no endpoint writes them.** | 4C.2 |
| 4C.2 | Server-side price recalculation on stock arrival. Margin math lives entirely in the frontend simulator (`PricingSimulator.svelte`); the backend accepts whatever `sellingPrice` the client sends and never validates it against `targetMargin`. | Pricing integrity |

### The dependency nobody wrote down

**3D.2 (payment processing) is blocked by 4.5A.4 (dead schema), and `PHASES.md`
does not connect them.**

`payments.posTransactionId` references `pos_transactions` — the **dead** POS model.
The live POS writes to `pos_invoices`. So the payments table, as currently defined,
physically cannot record a payment against a real invoice. That is why
`paymentStatus` ended up as a flat string and partial payment is impossible: it was
never a missing feature, it was a foreign key pointing at the wrong table.

Fix the schema split (4.5A.4) **before** attempting 3D.2, not after.

---

## 2. Data Types — Are They Enterprise-Ready?

**Short answer: the TypeScript layer is genuinely strict. The database layer is not.**

### What is already good

- `tsconfig.json` has `"strict": true`, and `tsc --noEmit` is clean.
- `svelte-check` is clean across 682 files.
- Money is `decimal`/`numeric` in Postgres — never float. Correct.
- `parseFloat` on money appears in only 3 places, each with a comment explaining why
  (`modules/finance/service.ts:67-68` is exemplary).
- Every FK is declared. Tenant indexes are present on most hot tables.

### Problem 1 — Zero `pgEnum`. ~30 status columns are unconstrained `varchar`

```
pgEnum usage across schema: 0
```

Every state field is a bare string with the legal values written in a **comment**:

- `inventory.ts:150` — `status` → `'unpaid' | 'partial' | 'paid'`
- `inventory.ts:181` — PO `status` → `'draft' | 'ordered' | 'partial' | 'received' | 'completed'`
- `pos.ts:36` — `paymentStatus` → `'unpaid', 'partial', 'paid'`
- `inventory.ts:85` — `movementType` → `in, out, reserve, release, adjust, write_off`

The database will accept `'PAID'`, `'paid '`, `'pald'`, or `'banana'` in any of these.
And it already has drifted: `pos/invoices.ts:339` writes `paymentStatus: 'voided'` —
a **fourth** value that the schema comment does not list, with the code's own comment
admitting it: *"reusing paymentStatus for voided state"*. Void is a lifecycle state,
not a payment state; they are now conflated in one column.

This is the single highest-value type fix. `pgEnum` + a derived TS union type gives
you compile-time exhaustiveness on `switch` statements **and** a database constraint,
from one declaration.

### Problem 2 — Zero `withTimezone`. All 32 timestamps are `timestamp without time zone`

```
timestamp columns: 32     withTimezone: true → 0
```

Today this is invisible: one shop, one machine, WIB. It becomes a data-corruption bug
the moment Phase 11 (VPS) happens — the server will very likely run UTC while users
are UTC+7. Then `dueDate` on a supplier invoice is off by 7 hours, aging buckets
misclassify, and `closedAt` timestamps silently shift. Fixing it **after** there is
production data means a backfill migration where you have to guess what zone each
existing row meant.

`timestamp('...', { withTimezone: true })` costs nothing now and is expensive later.
Do it before Phase 10, not before Phase 11.

### Problem 3 — Three different money precisions

| Column | Type |
|---|---|
| most money columns | `decimal(14, 2)` |
| `posInvoiceLines.unitPrice`, `.subtotal` | `decimal(12, 2)` |
| `posInvoices.subtotal/discountAmount/taxAmount/grandTotal` | `numeric` — **no precision at all** |

An unbounded `numeric` accepts arbitrary scale, so a computed value like
`1666666.666666` will store in full and then disagree with the `decimal(12,2)` lines
that sum into it. Pick `decimal(14,2)` (or a shared `money()` helper) and apply it
everywhere.

### Problem 4 — Critical uniqueness constraints are commented out

Three of these, all disabled:

```ts
// core.ts:60
// tenantNameUnique: unique('roles_tenant_name_unique').on(table.tenantId, table.name),

// inventory.ts:53
// tenantSkuUnique: unique('inventory_items_tenant_sku_unique').on(table.tenantId, table.sku),

// inventory.ts:76
// itemBranchUnique: unique('stock_levels_item_branch_unique').on(...),
```

The third is the dangerous one. `stock_levels` is a per-item-per-branch cache, and
**every read of it uses `findFirst`** (e.g. `pos/invoices.ts:194`). With no unique
constraint, a race or a bad insert creates a second row for the same item+branch, and
from then on `findFirst` returns an arbitrary one of the two. Stock silently reports
wrong, and the FIFO batches — which are correct — will disagree with it forever.

The row locking added in 3.5B.2 does not help here: `FOR UPDATE` cannot lock a row
that does not exist yet. Only the unique constraint prevents the duplicate.

### Problem 5 — `stock_levels` and `purchase_order_lines` have no `tenant_id`

`coding-guidelines.md` §5 says *"EVERY query MUST include `where(eq(table.tenantId, ...))`"*.
These two tables make that impossible — the column does not exist. Tenant isolation
for them is inferred through a join, which means one forgotten join is a cross-tenant
leak with no constraint to catch it.

### Problem 6 — Invoice numbers can collide, and are globally unique across tenants

```ts
// pos/invoices.ts:102-104
const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;
```

`invoiceNumber` is `.notNull().unique()` (`pos.ts:29`). Four random digits = 10,000
slots per day. By the birthday bound, a shop issuing ~118 invoices in one day has a
**~50% chance** of at least one collision, which surfaces as an unhandled unique-violation
→ HTTP 500 at the till, mid-sale.

Worse, the unique constraint is **global, not tenant-scoped**. Two tenants on the same
database will collide with each other. Replace with a per-tenant sequence or
`unique(tenantId, invoiceNumber)` plus a real counter.

### Problem 7 — `drizzle-zod` installed, never imported

```
drizzle-zod references in src: 0
```

`coding-guidelines.md` §4 mandates it as the single source of truth for validation.
All ~20 Zod schemas are hand-written, so schema and validator can drift silently.
Low urgency, but it is a documented rule currently at 0% compliance.

### Problem 8 — `catch (err: any)` × 30, and `err.message` returned to the client

34 `any` in the backend; ~30 are `catch (err: any)`. Two consequences:

- `tickets.ts:183` returns `err.message` **directly in the API response**. A Postgres
  error leaks table and column names to the client.
- `catch (err: unknown)` + a small `toBusinessError()` helper would fix both the typing
  and the leak in one pass.

Frontend has 153 `any` — mostly API response shapes. That is the real cost of having no
shared types package (see §3).

---

## 3. Folder Restructure

### The actual problem: three competing patterns coexist

```
src/
├─ routes/          ← 19 files, business logic inline in HTTP handlers  (Phases 2–4)
├─ services/        ← flow-engine.ts, event-bus.ts                      (ad hoc)
├─ modules/         ← finance/ only — the ONE module in the spec'd shape (Phase 3.5)
└─ lib/             ← fifo.ts, wac.ts — pure logic pulled out under duress
```

A new developer opening this cannot answer "where does purchasing logic live?" without
grepping. It lives in `routes/purchasing/*.ts`, mixed with HTTP concerns, except the
part that lives in `lib/wac.ts` and the part in `routes/purchasing/order-status.ts`.

Note what correlates: **`modules/` and `lib/` hold nearly all 37 tests. `routes/` holds
almost none.** That is not a coincidence — logic welded to a Hono handler cannot be
unit-tested. The structure is what is capping test coverage.

### Recommendation: finish the structure `coding-guidelines.md` §2 already specifies

Do **not** invent a new layout. §2 already defines the target, and `modules/finance/`
already proves it works in this codebase. The job is to finish the migration, not to
redesign.

```
src/
├─ db/schema/            # keep — the per-domain split is good
├─ middleware/           # auth, rbac, tenant-scope, audit, error-handler
├─ modules/
│  ├─ <domain>/
│  │  ├─ routes.ts       # thin: parse → call service → respond
│  │  ├─ service.ts      # all business logic, no HTTP imports, testable
│  │  ├─ types.ts        # Zod (via drizzle-zod) + TS types
│  │  └─ __tests__/
├─ flow-engine/          # engine.ts, types.ts, events.ts  (from services/)
├─ lib/                  # response, pagination, idempotency, money, fifo, wac
└─ index.ts
```

**Migration order — one module per PR, each with tests, never a big-bang.** The
Architecture Debt section of `PHASES.md` already commits to this rule; it is correct.

1. `services/` → `flow-engine/` — 2 files, zero behaviour change, do it first as a warm-up
2. `routes/pos/` → `modules/pos/` — highest business risk, most complex logic, biggest test payoff
3. `routes/purchasing/` → `modules/purchasing/` — partially extracted already (`order-status.ts`)
4. `routes/inventory/` → `modules/inventory/`
5. `routes/tickets.ts` → `modules/tickets/` — do this **while** building parts consumption (§4), not before
6. Everything else (customers, suppliers, brands, categories) — thin CRUD, migrate last, low value

Rename the two files violating kebab-case at the same time:
`payment_methods__settings_.ts` → `payment-methods.ts`,
`relations__untuk_relational_query_api_drizzle.ts` → `relations.ts`.

### One addition to §2 worth making: a shared types package

The 153 frontend `any` exist because the frontend has no access to backend types. A
`packages/shared/` exporting the Drizzle-inferred types and Zod schemas — consumed by
both apps — collapses most of that and makes an API change a **compile error** in the
frontend instead of a runtime `undefined`. This is the highest-leverage single change
for a codebase you expect to grow.

### For learnability specifically

The thing that will most help a new developer is not the folder layout — it is that
**business flow is currently only expressed in `specification/`, and the code does not
mirror it.** Once modules are named after domains, add a short `README.md` per module
(10 lines: what it owns, what it emits, what it listens for). Cheap, and it puts the
business context at the place the developer is already looking.

---

## 4. Priority Modules for Scalability

Ranked by *what unblocks the most downstream work*, not by effort.

### P0 — Finance Ledger (4.5A)

Nothing writes to `financeLedgerEntries`. The FIFO code **already computes exact COGS
and throws it away** (`pos/invoices.ts` — `pickFifoBatches` returns per-batch cost,
unused). Every report, dashboard, and P&L in Phases 5, 8, and 12 depends on this table.

> **⚠️ Corrected 2026-07-21.** This section originally claimed unposted COGS was
> *permanently unrecoverable* and that "delay causes permanent data loss." **That was
> wrong.** A database audit found all 5 `pos_sale` movements carry a `stock_batch_id`
> resolving to `stock_batches.unit_cost`, and `unit_cost` is never mutated after creation
> (only `quantity_remaining` changes). Historical COGS is fully reconstructible by joining
> movement → batch. `plan/H11-finance-ledger.md` includes the backfill script that proves
> it.
>
> The ledger stays P0 because everything downstream depends on it — but not for the
> data-loss reason given here.

### P0 — RBAC middleware (4.5B)

`middleware/rbac.ts` does not exist. `requirePermission()` is referenced throughout
`coding-guidelines.md` and used nowhere. Right now **any authenticated user can call
any endpoint** — a Cashier's token can void invoices, edit margins, and delete
suppliers. The permission tables (`permissions`, `role_permissions`) exist and are
empty of any real catalog.

Retrofitting authorization across ~19 route files after they multiply is far worse than
doing it at 19. And it gets cheaper if done **during** the module migration in §3 —
same files, same PR.

### P1 — `BusinessError` wiring + pagination (4.5D)

`lib/errors.ts` exists and `BusinessError` is used well in POS and finance, but list
endpoints still carry a hardcoded `limit: 100` (`pos/invoices.ts:48`, tickets, inventory).
That is not a scale problem at 100 invoices; it is a silent-wrong-answer problem at 101.
The user sees a truncated list with no indication anything is missing.

### P1 — Idempotency (4.5D.2)

`coding-guidelines.md` §3.4 names three endpoints that need `Idempotency-Key`. None have
it. On flaky shop WiFi — which is the actual deployment target — a retried POS checkout
double-deducts stock and double-charges. This is a *local-first LAN app*; unreliable
networks are the normal case, not the edge case.

### P2 — Shared types package

See §3. Do it alongside the module migration.

---

## 5. Crucial Business Processes That Were Overlooked

This is the most important section. These are not "not yet built" — they are **absent
from the data model entirely**, which means no amount of Phase 5 UI work can surface
them.

### 5.1 A service ticket cannot hold money

`service_tickets` (`tickets.ts:43-56`) has exactly: tenant, branch, customer, asset,
flow template, current node, status, timestamps.

There is **no** estimated cost, no approved quote amount, no parts list, no labor
charge, no total. The ticket is a status token that moves between nodes.

Consequences, all of which are currently impossible:

- A technician cannot record "I used 2× LCD from stock" against a ticket → **3C.4 has
  nowhere to write**
- No quotation → `approval_requests.amount` exists but nothing computes what that
  amount should be
- No cost accumulation → you cannot answer *"did we make money on this repair?"*,
  which is the core question a service ERP exists to answer
- SBL-001 through SBL-005 (quotation, deposit, invoice, refund — all marked MVP ✅)
  have no schema to build on

**Missing tables:** `ticket_charges` (or `ticket_parts` + `ticket_labor`), linking a
ticket to consumed inventory batches and to labor lines, each with quantity, unit price,
and cost.

### 5.2 You cannot bill for labor — and the schema that could is the dead one

This is the sharpest finding in this review.

`pos_invoice_lines.inventoryItemId` is `.notNull()` (`pos.ts:48`). **Every invoice line
must reference a physical inventory item.** There is no way to add a line for "Jasa
servis — Rp 150.000".

Meanwhile the **dead** `invoice_lines` table (`finance.ts:35-42`) has exactly what is
needed:

```ts
description: text('description').notNull(),
sourceType: varchar('source_type', { length: 20 }).notNull(), // "part" | "labor" | "fee"
```

The model that supports labor billing is the one marked for deletion in 4.5A.4; the
model in production is the one that cannot. For a repair shop, **labor is typically the
larger margin line.** The system currently cannot charge for it at all.

This changes the 4.5A.4 decision. `PHASES.md` frames it as *"delete the dead schema, or
migrate onto it."* The answer is now clear: **migrate onto the richer shape** — keep
`pos_invoices` as the header, but rebuild lines with a nullable `inventoryItemId` plus
`sourceType` and `description`. Do not delete the design that solves the problem.

### 5.3 No technician assignment exists anywhere

```
grep -i "technician|assigned" src/db/schema → 0 matches
```

There is no `assignedTechnicianId` on `service_tickets`, no technician skills table, no
workload data. TECH-001 through TECH-015 are almost entirely MVP ✅ in the feature
catalog, and TECH-003 (assignment), TECH-010 (My Jobs dashboard), and TECH-013
(calendar) are all listed for Phase 5.

Phase 5.8 is "Technician Dashboard: My Jobs" — **there is no way to know whose jobs
they are.** Phase 5 will hit this wall immediately. A single `assignedTechnicianId`
column on `service_tickets` unblocks most of it and costs nothing to add now.

### 5.4 Customer-facing money is invisible

`pos_invoices.customerName` is free text (`pos.ts:30`) and there is **no `customerId`
FK** — even though the `customers` table exists and tickets reference it properly.

So: customer AR (FIN-003, MVP ✅) is impossible. You cannot answer "what does this
customer owe us?" A `tempo` (credit) sale records the debt against a **string**. Two
sales to "Budi" may or may not be the same Budi. Supplier debt is fully modelled
(`supplier_invoices` + `supplier_payments` + aging); customer debt has nothing.

That asymmetry is worth fixing before Phase 10 onboards real data, because free-text
names cannot be reliably reconciled into customer records afterward.

### 5.5 Stock reservation is a no-op, so parts get double-promised

`quantityReserved` exists on `stock_levels` and is only ever written as literal `0`.
Availability checks read `quantityAvailable` alone.

Real consequence: a technician "reserves" the last LCD for ticket A, and the POS sells
that same LCD to a walk-in customer ten minutes later, because nothing decremented an
available count. This is the single most common real-world failure mode in a combined
service + retail shop, and it is exactly what SVC-008 and INV-006 exist to prevent.

### 5.6 No cancellation or refund path

`service_tickets.status` allows `'cancelled'` but no endpoint sets it, and there is no
defined handling for what happens to reserved or already-consumed parts when a job is
abandoned mid-repair. SVC-013 (Service Cancellation, MVP ✅) and SBL-005 (Refund, MVP ✅)
have no implementation and no schema.

POS void exists and is well built (`pos/invoices.ts:233-351`, correctly guarded). The
equivalent for services does not.

### 5.7 Purchase returns to supplier

INV-008 and PUR-007 are both MVP ✅. There is no schema and no endpoint. When a supplier
ships a defective part, the only current recourse is a manual stock adjustment, which
loses the link to the supplier and to the original batch — despite `stock_batches`
deliberately retaining `supplierId` precisely so returns can be traced. The data model
anticipated this; the code never used it.

---

## 6. Suggested Sequencing

The order matters more than the list — several of these get much cheaper when done
together.

**Now, before more features (schema changes while the DB is still small):**
1. `pgEnum` for all status columns + derived TS unions; resolve `'voided'` into a proper
   lifecycle column
2. `withTimezone: true` on all 32 timestamps
3. Re-enable the three commented-out unique constraints; add `tenant_id` to
   `stock_levels` and `purchase_order_lines`
4. Fix invoice numbering (per-tenant sequence, tenant-scoped unique)
5. Add `assignedTechnicianId` to `service_tickets`, `customerId` FK to `pos_invoices`
6. Standardise money on `decimal(14,2)`

**Then Phase 4.5, reordered:**
7. 4.5A.4 first — resolve the POS schema split by migrating onto the richer line shape
   (unblocks labor billing **and** 3D.2)
8. 4.5A.1–.3 — ledger posting
9. 4.5B — RBAC, done during the module migration

**Then close Phase 3:**
10. `ticket_charges` schema → 3C.4 (ticket parts consumption) → 3C.3 (reservation)
11. 3D.2 payment processing (now unblocked)
12. 3E end-to-end verification

**Continuously:** migrate one module per PR into `modules/` with tests, per §3.

---

## 7. What Is Genuinely Good

Worth stating plainly, because the list above is long:

- The FIFO implementation is correct, and the batch→supplier traceability is a
  thoughtful design that most systems this size get wrong.
- Phase 3.5's row locking, void guards, and `BusinessError` usage in POS are careful,
  well-commented work. The comments explain *why*, per §10 — genuinely above average.
- The pure-function extraction pattern (`evaluateTransition`, `pickFifoBatches`,
  `calculateWac`, `applyPayment`) is exactly right, and is why 37 tests exist at all.
  Keep doing this.
- Structurally detecting terminal nodes (no outgoing transitions) rather than matching
  on the name `"Completion"` is a small decision that will save real pain when tenants
  define their own flows.
- The Definition of Done added to `PHASES.md` after the audit is the most valuable
  process artifact in the repo.
