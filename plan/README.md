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
- [ ] H0 Complete seed + `db:reset` workflow

Stage 2
- [x] H1 Delete dead schema — 2026-07-21
- [ ] H2 Status enums
- [ ] H3 Timestamps
- [ ] H4 Constraints
- [ ] H5 Money & numbering

Stage 3
- [ ] H6 Labor billing
- [ ] H7 Ticket charges
- [ ] H8 Technician & customer
- [ ] H9 Ticket parts consumption
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
