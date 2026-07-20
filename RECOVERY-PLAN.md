# FlowServ — Recovery Plan

> **TEMPORARY FILE.** Delete this once Phase 3.5 (Stabilization) is complete and
> `PHASES.md` is trustworthy again. Do not add it to `CLAUDE.md`'s `@` imports —
> it is a working document, not project memory.

**Created:** 2026-07-20
**Verified against:** branch `phase-4/purchasing`, commit `0d2b285`
**Why this exists:** `PHASES.md` drifted from reality. Several tasks were marked
`[x]` for work that does not exist in the codebase. This file records what is
*actually* built, verified by reading the code — not by memory. `PHASES.md` was
then rewritten from this file.

---

## Part 1 — Ground Truth

Every endpoint that exists in `flowserv-api/src/routes/`, verified 2026-07-20.

**Legend:** ✅ works · ⚠️ works but has a known defect · ❌ broken or missing

### Auth — `routes/auth.ts`
| Endpoint | Status | Notes |
|---|---|---|
| `POST /v1/auth/login` | ⚠️ | Works. Two issues: accepts a legacy unsalted SHA-256 hash path (`passwordHash.length === 64`), and does not check whether the user is active. JWT carries `roleId` as a **UUID**. |
| `GET /v1/auth/me` | ✅ | |

**Missing:** no register endpoint, despite task 2A.1 saying "register, login".

### Flow Engine — `routes/flow.ts`, `services/flow-engine.ts`
| Endpoint | Status | Notes |
|---|---|---|
| `GET /v1/flows` | ✅ | List templates |
| `GET /v1/flows/:id` | ✅ | Template + nodes + transitions |

**`FlowEngine.validateTransition` is not enforced.** See BUG-01. `FlowEngine.executeTransition` is dead code — never called from anywhere.

### Tickets — `routes/tickets.ts`
| Endpoint | Status | Notes |
|---|---|---|
| `GET /v1/tickets` | ⚠️ | No pagination, no branch filter |
| `GET /v1/tickets/:id` | ✅ | Includes stage history |
| `POST /v1/tickets/intake` | ✅ | Creates customer + asset + ticket in one transaction |
| `POST /v1/tickets/:id/transition` | ❌ | Validation bypassed (BUG-01), no tenant scoping on target node (BUG-02), never closes ticket (BUG-06) |

**Missing:** no diagnosis, no quotation, no customer approval, no parts consumption
from a ticket, no Kanban board. A ticket can be created and moved between stages,
and nothing else.

### Customers — `routes/customers.ts`
| Endpoint | Status |
|---|---|
| `GET /v1/customers`, `GET /:id`, `POST /`, `PUT /:id` | ✅ |
| `GET /v1/customers/:id/assets`, `POST /:id/assets` | ✅ |

This is the one module that is genuinely complete for its phase.

### Inventory — `routes/inventory/`
| Endpoint | Status | Notes |
|---|---|---|
| `GET /v1/inventory`, `POST /`, `GET /:id`, `DELETE /:id` | ✅ | |
| `PUT /v1/inventory/:id/compatibility` | ✅ | |
| `PUT /v1/inventory/:id/brands/:brandId` | ✅ | Sets selling price per brand |
| `POST /v1/inventory/:id/receive` | ⚠️ | Manual receipt. **Skips WAC recalculation and pricing update** — stock received this way is costed differently than stock received via a PO. See BUG-09. |

**Parts reservation does not exist.** `quantityReserved` appears in exactly four
places in the codebase and is written as the literal `0` in all of them. Nothing
reserves, nothing releases.

### Purchasing — `routes/purchasing/`
| Endpoint | Status | Notes |
|---|---|---|
| `GET /v1/purchasing/orders`, `GET /orders/:id`, `POST /orders`, `PUT /orders/:id/status`, `DELETE /orders/:id` | ✅ | |
| `POST /v1/purchasing/orders/:id/receive` | ❌ | Partial receipts recorded as complete (BUG-03), `receivedQuantity` overwrites instead of accumulating (BUG-04), no ownership check on `lineId` (BUG-05) |
| `POST /v1/purchasing/orders/:id/invoice` | ⚠️ | Works. Sets actual cost, updates selling price, recalculates WAC, creates the AP record. But WAC and batch queries have **no `tenantId` filter**. |

### POS — `routes/pos/`
| Endpoint | Status | Notes |
|---|---|---|
| `GET /v1/pos/invoices`, `GET /invoices/:id` | ⚠️ | Hardcoded `limit: 100`, no pagination |
| `POST /v1/pos/invoices` | ⚠️ | FIFO deduction works and is correct in the single-user case. Race condition under concurrency (BUG-07); errors swallowed into a generic 500 (BUG-08) |
| `DELETE /v1/pos/invoices/:id` | ⚠️ | Void restores batches, but no guard against restoring beyond `quantityReceived` |
| `GET/POST/DELETE /v1/pos/drafts` | ✅ | |

**No payment record is ever created.** `paymentStatus` is a string on the invoice.
The `payments` table is never written to. Partial payment is impossible.

### Finance — `routes/finance.ts`
| Endpoint | Status |
|---|---|
| `GET /v1/finance/payables` | ✅ read-only |

**This is the largest gap in the system.** Four tables exist in the schema and are
never written to by any route — verified by grep, zero hits:

- `financeLedgerEntries` — no COGS, no revenue, ever
- `posTransactions`
- `invoiceLines`
- `payments`

Consequence: FIN-007 (double-entry), FIN-010 (general ledger), FIN-011 (P&L), and
FIN-003 (accounts receivable) do not exist in any form. The FIFO code in
`pos/invoices.ts` knows the exact cost of every batch it consumes and discards it.

**Supplier debt can be created but never paid.** There is no AP payment endpoint,
so `supplierInvoices.amountPaid` is permanently `'0'`.

### Other
| Module | Endpoints | Status |
|---|---|---|
| Suppliers | 7 endpoints incl. brand mapping | ✅ |
| Brands | `GET`, `POST`, `DELETE /:id` | ✅ |
| Categories | `GET`, `POST` | ⚠️ no update/delete |
| Branches | `GET /` | ✅ |
| Opname | `POST /` | ⚠️ same race condition as POS |
| Settings | `GET /payment-methods` only | ⚠️ see 4C.1 below |

### Cross-cutting: what does not exist at all

| Required by | Thing | Reality |
|---|---|---|
| guidelines §6 | Service layer (`service.ts` per module) | **None.** All business logic is inline in HTTP handlers. This is why nothing is testable. |
| guidelines §4 | `drizzle-zod` as schema source | Installed, **never imported**. All Zod schemas hand-written inline. |
| guidelines §9 | Tests | **Zero test files.** `npm test` is still `exit 1`. Vitest installed, no config. |
| guidelines §3.4 | `Idempotency-Key` | Not implemented on any endpoint. Zero grep hits. |
| guidelines §3.5 | Cursor pagination | `lib/pagination.ts` does not exist. |
| guidelines §8 | `BusinessError` class | Does not exist. Every error is 400 or 500 — **409 and 422 are never returned.** |
| PLT-003 | RBAC middleware | `middleware/rbac.ts` does not exist. **Any authenticated user can call every endpoint.** |
| PLT-006 | Audit log | `auditLogs` table exists, `middleware/audit.ts` does not. Nothing is ever logged. |
| PLT-011 | Event bus | `services/event-bus.ts` exists with **zero listeners registered** anywhere. |
| PLT-013 | WebSocket | Not started. |

### Cross-cutting: structural drift

- Backend uses flat `src/routes/*.ts`. Guidelines §2 mandates
  `src/modules/<domain>/{routes,service,types}.ts`.
- `services/flow-engine.ts` should be `flow-engine/{engine,types,events}.ts`.
- Two schema files violate kebab-case: `payment_methods__settings_.ts` and
  `relations__untuk_relational_query_api_drizzle.ts`.
- **Two competing POS data models.** `posTransactions`/`invoiceLines`/`payments`
  (specified, unused) sit alongside `posInvoices`/`posInvoiceLines` (actually
  used). One of these must be deleted.
- **Two goods-receipt paths** with different costing behaviour (see BUG-09).
- Comments and user-facing error strings mix Indonesian and English
  inconsistently (`Stok tidak cukup` vs `Ticket not found`).

---

## Part 2 — PHASES.md Reconciliation

Tasks that were marked `[x]` but are not done. Each corrected in the rewritten
`PHASES.md`.

| Task | Claimed | Reality |
|---|---|---|
| **2B.5** Unit tests — transition validation | `[x]` | **No test files exist anywhere in the repo.** `npm test` exits 1. |
| **2B.4** Event emission on state change | `[x]` | Event bus exists but the transition route never calls `executeTransition`, so the event never fires. No listeners exist regardless. |
| **3C.3** Parts reservation (soft-lock) | `[x]` | Not implemented. `quantityReserved` is only ever written as `0`. |
| **3C.4** Parts consumption (FIFO) | `[x]` | FIFO deduction exists **only in POS checkout**. Nothing consumes parts from a service ticket, which is what this task meant. |
| **4C.1** Margin config in settings | `[x]` | Schema columns `marginStrategy` / `targetMargin` exist on categories and items, but **no endpoint sets them**. `settings.ts` only serves payment methods. |
| **4C.2** Auto-update pricing on stock arrival | `[x]` | Not automatic. The margin calculation lives entirely in the **frontend** simulator; the backend accepts whatever `sellingPrice` the client sends and never validates it against `targetMargin`. |
| **4C.5** Commit "phase 4 complete" | `[x]` | Phase 4 is not complete — 4A and 4B are unchecked and AP payment does not exist. |

Also wrong, in the other direction — these are marked `[ ]` but **are** built:

| Task | Reality |
|---|---|
| 3A.1–3A.4 Customer & Device | Fully built, BE + FE |
| 3B.1, 3B.3, 3B.4, 3B.6 Ticket intake/detail | Built |
| 3D.1 POS invoice generation | Built (as `posInvoices`) |
| 3D.4 POS page | Built |
| 4A.1, 4A.2 Supplier CRUD + page | Built |
| 4B.1–4B.4 PO, receiving, costing, due date | Built (with the bugs listed above) |

**Process failures:**

1. **Phase 3 was skipped, not completed.** Phase 4 was built on top of an
   incomplete Phase 3. The missing finance ledger in Phase 4 exists *because*
   3D.3 was never done.
2. **1F.5 (merge to main) never happened.** `main` has not moved since Phase 1.
   Everything since lives on `phase-4/purchasing`, including all of Phase 2 and 3.
3. **The Quick Reference table contradicted the phase bodies.** It listed Phase 4
   as "RBAC + Audit" while the body said Purchasing. RBAC and audit logging fell
   into that gap — which is exactly why both exist in the schema and nowhere in
   the code.

---

## Part 3 — Stabilization Backlog

Ordered. P0 items are correctness or security defects in code that is already
being used.

### P0 — fix first

**BUG-01 — Flow engine validation is bypassed.** `routes/tickets.ts:206`
```ts
const allowed = await FlowEngine.validateTransition(...);  // returns { valid, reason }
if (!allowed) { ... }                                      // object is always truthy
```
`!allowed` is never true, so every transition is permitted regardless of the flow
template rules or the user's role. This disables the product's core differentiator
and the only permission check in the system. Fix: `if (!allowed.valid)` and return
the `reason`. Return **409** for an invalid transition and **403** for a permission
failure, per guidelines §3.3.

**BUG-02 — `targetNodeId` is unvalidated and unscoped.** The transition endpoint
never checks that the target node belongs to the ticket's own flow template, or to
the caller's tenant. `FlowEngine.validateTransition` queries `flowTransitions` and
`flowNodes` with no `tenantId` filter. Combined with BUG-01, a user can move a
ticket to any node UUID in the database, including another tenant's.

**BUG-03 — Partial goods receipt recorded as complete.**
`routes/purchasing/receipts.ts` computes `allReceived` across the loop and then
never uses it — the PO is set to `status: 'received'` unconditionally.

**BUG-04 — `receivedQuantity` overwrites instead of accumulating.** Same file:
`.set({ receivedQuantity: lineTotalReceived })`. A second partial receipt erases
the first.

**BUG-05 — No ownership check on `purchaseOrderLines`.** Lines are updated by
`lineId` alone, with no verification that the line belongs to the order or tenant.

**BUG-11 — Sidebar navigation is broken for every real user.**
`flowserv-web/src/routes/(app)/+layout.svelte:8` compares `user?.roleId === 'Super Admin'`,
but `roles.id` is a UUID and the JWT carries that UUID. A properly assigned user
matches nothing and sees only "Dashboard". Only users with *no* role (`'no-role'`)
see the full menu. Fix: put the role **name** in the JWT alongside the id.

### P1 — before building anything new

**BUG-06 — Tickets never close.** `status` stays `'open'` forever, `closedAt` is
never set. The transition handler has a comment acknowledging this.

**BUG-07 — Stock can be oversold.** FIFO deduction reads batches then updates them
with no row locking. Two concurrent checkouts can both see the same remaining
quantity. Fix: `SELECT ... FOR UPDATE` on the batch rows inside the transaction.
Same pattern in `purchasing/receipts.ts` and `opname.ts`.

**BUG-08 — POS errors are swallowed.** `pos/invoices.ts:213` catches everything and
returns a generic 500 with no logging, discarding `error.message`. "Insufficient
stock" — a **422** per guidelines §3.3 — reaches the cashier as an opaque server
error.

**BUG-09 — Two goods-receipt paths with different costing.**
`/v1/inventory/:id/receive` skips WAC recalculation and pricing updates;
`/v1/purchasing/orders/:id/receive` does not. Decide which survives.

**BUG-10 — Void can over-restore batch quantities.** No guard that
`quantityRemaining + restored <= quantityReceived`.

**GAP-01 — No AP payment endpoint.** Supplier debt is write-only. Needed to close
task 4A.3 honestly.

**GAP-02 — No tests.** At minimum: flow engine transition validation, FIFO batch
splitting, and stock level arithmetic. These are the three places where a bug
costs real money.

### P2 — the phase after stabilization

- **GAP-03 — Finance ledger.** Post COGS and revenue on POS checkout. The cost data
  is already computed and thrown away; this is mostly plumbing.
- **GAP-04 — RBAC middleware.** `requirePermission()` on every mutating endpoint.
- **GAP-05 — Audit middleware.** The table is already there.
- **GAP-06 — Delete the dead POS schema** (`posTransactions`, `invoiceLines`) or
  migrate onto it. Do not leave both.
- **GAP-07 — Pagination + `Idempotency-Key`** on the three endpoints guidelines
  §3.4 names.

---

## Part 4 — Decisions

These are recorded so future sessions do not re-litigate them.

### D1 — Service layer: retrofit incrementally, never big-bang

The codebase has no service layer and no tests. Rewriting every route into
`modules/<domain>/{routes,service,types}.ts` in one pass, with nothing to verify
against, is the fastest way to break a working application.

**Rule:** when you touch a module for a stabilization fix or a new feature, extract
its `service.ts` *then*, with a test. Do not refactor modules you are not otherwise
changing. Within a few phases most of the codebase converts, and every step stays
verifiable.

### D2 — Definition of Done

This is the actual fix for the drift. A task may only be marked `[x]` when **one**
of these exists:

- a passing automated test, or
- a recorded API request + response showing the expected result, or
- for frontend-only work, a screenshot or a written click-path that was actually walked

"I wrote the code and it looked correct" is not done. Every false `[x]` in Part 2
was written in good faith by someone who had just written the code.

### D3 — Branch hygiene

`phase-4/purchasing` currently contains all of Phase 2, Phase 3, Phase 4, and five
refactor commits. `main` has not moved since Phase 1, so the rule "never commit to
main" is protecting nothing.

**Action:** after P0 fixes land, merge to `main` and branch fresh from there. Then
resume one-branch-per-phase properly.

### D4 — Do not rewrite `specification/`

The spec is large (~30 documents, ~170 features) but it is not wrong — it is
aspirational, and that is fine. Rewriting it is weeks of work with no functional
payoff.

**Instead:** add a one-line status header to each `specification/features/*.md`:

```
> **Implementation status:** Partial — see RECOVERY-PLAN.md Part 1.
> Built: supplier CRUD, brand mapping. Not built: performance tracking, credit terms.
```

Cheap to maintain, and it stops the feature catalog from reading as if all ~100 MVP
features are current scope when roughly 25 exist.

---

## Exit criteria

Delete this file when:

- [ ] All P0 bugs fixed and verified
- [ ] All P1 items fixed and verified
- [ ] `PHASES.md` checkboxes match reality (spot-check 5 at random)
- [ ] `npm test` runs and passes with at least flow-engine and FIFO coverage
- [ ] Merged to `main`
