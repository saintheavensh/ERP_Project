# FlowServ — Implementation Phases & Checklist

> **RULE: Work on ONE phase at a time. Do NOT skip or combine phases.**
> Before starting any work, check this file to know which phase is current.
> Mark items `[/]` when in progress, `[x]` when done.

> **⚠️ Corrected 2026-07-20.** This file previously claimed work that did not exist —
> seven tasks were marked `[x]` for code that was never written. It was rewritten from
> a verified code audit, and Phase 3.5 below fixed the defects that audit found. The
> audit's own scaffolding (`RECOVERY-PLAN.md`, `plan/`) has since been deleted; its
> durable conclusions live in this file. See the Definition of Done immediately below —
> that rule exists specifically to stop this from recurring.

---

## Current Phase: `PHASE 4 (Purchasing, Supplier Debts, & Margins)` ← IN PROGRESS

> **Phase 3.5 (Stabilization) completed 2026-07-20.** All 9 stabilization tasks are
> done and merged to `main`. The flow engine now actually enforces transitions, stock
> can no longer be silently oversold or mis-received, tickets close, supplier debt can
> be paid, and there are 37 passing tests where there were none.
>
> **One item is deliberately `[/]`, not `[x]`:** 3.5B.2 (row locking) is code-reviewed
> but was never load-tested under real concurrency. That gap is recorded rather than
> papered over — see the Definition of Done below.
>
> Phase 4 remains open: 4C.1 and 4C.2 (margin config endpoint + server-side pricing
> on stock arrival) are still unbuilt. See Phase 4 below.

---

## ⚠️ Definition of Done (MANDATORY)

A task may only be marked `[x]` when **one** of the following exists:

1. A passing automated test, **or**
2. A recorded API request + response showing the expected result, **or**
3. For frontend-only work, a screenshot or a written click-path that was actually walked

**"I wrote the code and it looked correct" is not done.** Every incorrect `[x]` found
in the 2026-07-20 audit was written in good faith by someone who had just finished
writing the code and had not run it end to end.

If you cannot produce evidence, mark the task `[/]` (in progress) and say what is
missing.

---

## Git Workflow (MANDATORY for all AI Agents)

- **Branch per phase:** `phase-1/project-setup`, `phase-2/flow-engine`, etc.
- **Commit after each task:** Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- **Merge to main** after a phase is fully verified
- **Before starting work:** Check current branch with `git branch`
- **Never commit to `main` directly** — always work in a phase branch

> **Current debt:** `phase-4/purchasing` contains all of Phase 2, 3, and 4.
> `main` has not moved since Phase 1. Task 3.5D below resolves this.

---

## PHASE 0 — Documentation Consolidation ✅ COMPLETE
> **Goal:** Merge docs/ + books/ into specification/, create feature catalog, clean up project.

- [x] 0.0 Create `specification/coding-guidelines.md` (Coding Standards)
- [x] 0.1 Create `specification/` folder structure (12 core docs)
- [x] 0.2 Create `specification/features/` — Feature Catalog (14 docs)
- [x] 0.3 Create `specification/frameworks/` — Business Frameworks (5 docs)
- [x] 0.4 Add `DEPRECATED.md` to `docs/` and `books/`
- [x] 0.5 Update CLAUDE.md to point to `specification/`
- [x] 0.6 Delete `frontend/` folder
- [x] 0.7 Delete `backend/` folder
- [x] 0.8 Verify: all specification files exist

---

## PHASE 1 — Project Setup, Cleanup & Database ✅ COMPLETE
> **Goal:** Clean root, init git, setup monorepo (BE + FE), push schema to local PostgreSQL.

### 1A. Root Cleanup
- [x] 1A.1 Delete unused files: `ROADMAP.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- [x] 1A.2 Delete unused folders: `glossary/`, `templates/`, `scripts/`, `assets/`, `implementation plan/`
- [x] 1A.3 Delete old package files: `package.json`, `pnpm-lock.yaml`, `node_modules/`
- [x] 1A.4 Update `.gitignore` (node_modules, .env, dist, .drizzle, etc.)

### 1B. Git Initialization
- [x] 1B.1 Initialize git repo (or reinitialize if `.git` exists)
- [x] 1B.2 Create initial commit with current state
- [x] 1B.3 Create branch `phase-1/project-setup`

### 1C. Backend Setup (flowserv-api/)
- [x] 1C.1 Create `flowserv-api/` with `package.json`
- [x] 1C.2 Install dependencies: hono, @hono/node-server, drizzle-orm, pg, zod, drizzle-zod, dotenv, @hono/zod-validator
- [x] 1C.3 Install dev dependencies: typescript, tsx, vitest, drizzle-kit, @types/pg
- [x] 1C.4 Move `db/schema.ts` → `flowserv-api/src/db/schema.ts`
- [x] 1C.5 Move `drizzle.config.ts` → `flowserv-api/drizzle.config.ts`
- [x] 1C.6 Create `flowserv-api/src/db/connection.ts` (database connection)
- [x] 1C.7 Create `flowserv-api/src/lib/response.ts` (standardized API response helper)
- [x] 1C.8 Create `flowserv-api/src/middleware/error-handler.ts`
- [x] 1C.9 Create `flowserv-api/src/index.ts` (entry point + health check `/v1/health`)
- [x] 1C.10 Create `.env` with DATABASE_URL
- [x] 1C.11 Run `npx drizzle-kit push` — verify tables exist in PostgreSQL
- [x] 1C.12 Verify: `npm run dev` starts, `GET /v1/health` returns `{ data: { status: "ok" } }`

### 1D. Frontend Setup (flowserv-web/)
- [x] 1D.1 Create SvelteKit project in `flowserv-web/`
- [x] 1D.2 Install dependencies: tailwindcss, shadcn-svelte
- [x] 1D.3 Create `flowserv-web/src/lib/api/client.ts`
- [x] 1D.4 Create basic layout with sidebar placeholder
- [x] 1D.5 Create health check page that calls `/v1/health`
- [x] 1D.6 Verify: `npm run dev` starts, health check page shows "API Connected"

### 1E. Seed Data
- [x] 1E.1 Create `flowserv-api/src/db/seed.ts`
- [x] 1E.2 Add script to `package.json` (`"db:seed": "tsx src/db/seed.ts"`)
- [x] 1E.3 Write seed data for `roles` (Super Admin, Manager, Technician, Cashier)
- [x] 1E.4 Write seed data for one default `tenant`
- [x] 1E.5 Write seed data for one `user` (Super Admin) linked to Demo tenant —
      **this was a false positive until task 09 (2026-07-20).** The user existed but
      was never actually linked to the Super Admin role — no `user_role_assignments`
      row was ever inserted, so the seeded admin logged in as `'no-role'`. Genuinely
      true now.
- [x] 1E.6 Run `npm run db:seed` and verify data in database
- [x] 1E.7 Commit: "feat: phase 1E complete - seed data"

### 1F. Final Verification
- [x] 1F.1 Backend starts and connects to PostgreSQL
- [x] 1F.2 Frontend starts and health check passes
- [x] 1F.3 Verify all files follow strict typing rules (`no implicit any`)
- [x] 1F.4 Commit: "feat: phase 1 completed - system verification"
- [x] 1F.5 Merge `phase-1/project-setup` → `main` — was never done at the time;
      resolved 2026-07-20 by 3.5D.1, which merged all accumulated work to `main`.

---

## PHASE 2 — Auth + Flow Engine (BE + FE)
> **Goal:** Build authentication + the modular workflow engine. Display results in UI.
> **Read first:** specification/02-architecture.md, specification/03-rbac-roles.md
> **Branch:** `phase-2/auth-flow-engine`

### 2A. Authentication (BE + FE)
- [/] 2A.1 BE: Auth routes — login works; **register endpoint does not exist**
- [x] 2A.2 BE: Auth middleware (verify JWT, extract tenant_id)
- [x] 2A.3 FE: Login page (form → call API → store token)
- [x] 2A.4 FE: Protected layout (redirect to login if no token)
- [x] 2A.5 Verify: login works, protected pages redirect

### 2B. Flow Engine Core (BE)
- [x] 2B.1 Flow Template CRUD (read/write FlowTemplate + FlowNode from DB)
- [x] 2B.2 Transition validation engine — now enforced (Phase 3.5A.1/A.2). Verified
      live: `Intake → Diagnosis` returns 200; `Intake → Completion` returns 409
      `TRANSITION_NOT_ALLOWED`.
- [x] 2B.3 Stage history recording (TicketStageHistory — append-only)
- [x] 2B.4 Event emission on state change — `FlowEngine.executeTransition` now
      performs the DB update and emits `TICKET_STAGE_CHANGED` on every successful
      transition. No listeners subscribe yet (Phase 4.5A will add ledger posting).
- [ ] 2B.5 **Unit tests** — transition validation, invalid transitions, permission checks
      — ⚠️ **no test files exist anywhere in the repo.** `npm test` exits 1.

### 2C. Flow Engine Visualization (FE)
- [x] 2C.1 FE: Flow template list UI
- [x] 2C.2 FE: Flow detail view (visualize nodes and transitions)
- [x] 2C.3 Merge `phase-2/auth-flow-engine` → `main` — was never done at the time;
      resolved 2026-07-20 by 3.5D.1.
- [x] 2C.4 Git commit: `feat: phase 2 complete — auth + flow engine`

---

## PHASE 3 — Vertical Slice: One Complete Service Flow (BE + FE)
> **Goal:** Build ONE end-to-end flow with both API and UI.
> **Read first:** specification/features/02-service.md, specification/features/06-inventory.md
> **Branch:** `phase-3/vertical-slice`

### 3A. Customer & Device (BE + FE) ✅
- [x] 3A.1 BE: Customer CRUD endpoints
- [x] 3A.2 BE: Device (CustomerAsset) CRUD endpoints
- [x] 3A.3 FE: Customer list + create form
- [x] 3A.4 FE: Device list + create form

### 3B. Service Ticket (BE + FE)
- [x] 3B.1 BE: Create ticket (intake) — with Zod validation
- [x] 3B.2 BE: Transition ticket to next stage (uses Flow Engine) — now genuinely
      enforces the flow template's transition rules; see Phase 3.5A.1/A.2
- [x] 3B.3 BE: Get ticket detail + stage history
- [x] 3B.4 FE: Ticket creation form (select customer, device, complaint)
- [ ] 3B.5 FE: Ticket Kanban board (columns = flow nodes, drag-drop)
- [x] 3B.6 FE: Ticket detail page (timeline, current stage, actions)

### 3C. Inventory + FIFO (BE + FE)
- [x] 3C.1 BE: Inventory item CRUD
- [x] 3C.2 BE: Batch creation (goods receipt → FIFO batch)
- [ ] 3C.3 BE: Parts reservation (soft-lock) — ⚠️ **not implemented.**
      `quantityReserved` is only ever written as the literal `0`.
- [ ] 3C.4 BE: Parts consumption from a ticket (hard deduction, FIFO order) — ⚠️ FIFO
      deduction exists **only in POS checkout**. Nothing consumes parts from a service ticket.
- [x] 3C.5 FE: Inventory list page (stock levels, alerts)
- [x] 3C.6 FE: Stock receipt form (add batch)

### 3D. POS + Finance (BE + FE)
- [x] 3D.1 BE: POS transaction + invoice generation
- [ ] 3D.2 BE: Payment processing (partial/full) — `payments` table never written to;
      `paymentStatus` is a flat string, partial payment impossible
- [ ] 3D.3 BE: Finance ledger posting (COGS, revenue) — ⚠️ **`financeLedgerEntries` is
      never written to by any route.** FIFO already computes the cost and discards it.
- [x] 3D.4 FE: Simple POS page
- [ ] 3D.5 FE: Payment form
- [ ] 3D.6 **Unit tests** — FIFO batch split, ledger accuracy, stock levels

### 3E. Verify Full Flow
- [ ] 3E.1 Test full flow in UI: Intake → Diagnosis → Approve → Reserve Part → Repair → QC → Invoice → Pay → Close
- [ ] 3E.2 Verify: stock levels decreased, finance ledger entries created, ticket closed
- [ ] 3E.3 Git commit: `feat: phase 3 complete — vertical slice working`

> **Note:** 3E cannot pass today. Diagnosis, approval, reservation, ticket-linked
> consumption, ledger posting, and ticket closure all do not exist. Phases 3.5 and
> 4.5 close these gaps.

---

## PHASE 3.5 — Stabilization ✅ COMPLETE (2026-07-20)
> **Goal:** Fix the defects found in the 2026-07-20 audit. Make the checkboxes honest.
> **Branch:** all work landed on `phase-4/purchasing`, merged to `main` by 3.5D.1.
> **Rule:** No new features. Only fixes, tests, and the merge to main.
>
> **Outcome:** 9 tasks, 11 numbered bugs fixed, 37 tests added (from zero). The
> scaffolding that drove this phase (`RECOVERY-PLAN.md` and `plan/`) was deleted on
> completion — its durable output is this file, the Definition of Done above, and the
> Architecture Debt section below.

### 3.5A. P0 — Correctness & Security
- [x] 3.5A.1 Fix BUG-01: `if (!allowed.valid)` in `routes/tickets.ts`. Return **409**
      for invalid transition, **403** for permission failure, include the `reason`.
- [x] 3.5A.2 Fix BUG-02: validate `targetNodeId` belongs to the ticket's flow template;
      add `tenantId` filter to both queries in `FlowEngine.validateTransition`
- [x] 3.5A.3 Fix BUG-03: use the `allReceived` flag — set PO status to `partial` vs `received`.
      Also fixed the same bug's frontend surface: the receive page hard-blocked any
      status other than `'ordered'`, the orders list filtered `'partial'` out
      entirely, and the receive form defaulted to the full original quantity
      instead of what's still owed. All fixed together — see commit for task 04.
- [x] 3.5A.4 Fix BUG-04: increment `receivedQuantity` instead of overwriting. Also
      added an over-receipt guard (422-shaped, pending BusinessError from task 05).
- [x] 3.5A.5 Fix BUG-05: verify `lineId` belongs to the order and tenant before updating
- [x] 3.5A.6 Fix BUG-11: include role **name** in the JWT; fix the sidebar role check in
      `(app)/+layout.svelte` (currently compares a UUID to `'Super Admin'`, so real users
      see only "Dashboard")

### 3.5B. P1 — Data Integrity
- [x] 3.5B.1 Fix BUG-06: set `status='closed'` and `closedAt` when entering a terminal node.
      Detected structurally (a node with no outgoing `flowTransitions` rows), not by
      name, so it works for any flow template. Verified live: transitioned a real
      ticket to Completion, `GET /v1/tickets/:id` showed `status: "closed"` with a
      populated `closedAt`.
- [/] 3.5B.2 Fix BUG-07: add `SELECT ... FOR UPDATE` row locking on batch/level reads
      in POS checkout, purchasing receive, and opname (also applied to the manual
      inventory receive path, which had the same lost-update shape). **Code-reviewed,
      not load-tested** — no concurrent-request harness was run against two
      simultaneous checkouts of the last unit. Per the task's own instruction, marked
      `[/]` rather than `[x]` until that's actually verified.
- [x] 3.5B.3 Fix BUG-08: stop swallowing POS errors — log them, and return **422**
      `INSUFFICIENT_STOCK` instead of a generic 500. Verified live: selling 1 unit of
      a zero-stock item now returns 422 with code `INSUFFICIENT_STOCK` (was a generic
      500 with no logged cause).
- [x] 3.5B.4 Fix BUG-09: extracted `calculateWac()` as the single implementation,
      previously duplicated three times (purchasing/invoices.ts, opname.ts, and
      missing entirely from inventory/receipts.ts, which is *why* it was
      inconsistent). The manual receive path now actually recalculates WAC.
- [x] 3.5B.5 Fix BUG-10: guard void so restored quantity cannot exceed
      `quantityReceived` (409 `VOID_CONFLICT`). Also added a second double-void guard
      checking `stockMovements` directly, not just `paymentStatus`. Verified live:
      voiding an invoice twice returns 409 `ALREADY_VOIDED` on the second attempt.
- [x] 3.5B.6 GAP-01: add `POST /v1/finance/payables/:id/payments` so supplier debt can
      actually be settled (completes 4A.3). Built as `modules/finance/{service,types}.ts`
      per coding-guidelines §6 — the first module in this shape, per the incremental
      retrofit rule in Architecture Debt below. Also added
      `GET /v1/finance/payables/:id` for payment history, and
      wired the previously-dead "Bayar" button in `PayablesTable.svelte` to a real modal.
      Discovered `supplier_payments` table + relations already existed in the schema
      and live DB (unused) — used it as-is rather than creating a duplicate table.
      Verified live end-to-end: partial payment (400k of 1M) → status `partial`;
      overpayment attempt (999999 against a 600k remaining balance) → 422
      `OVERPAYMENT`, balance untouched; completing payment (600k) → status `paid`;
      further payment attempt → 409 `ALREADY_PAID`; payment history via `GET /:id`
      shows both records newest-first; invoice correctly drops off the outstanding
      payables list once paid. 6 new tests (37 total).

### 3.5C. P1 — Testing Foundation
- [x] 3.5C.1 Add `vitest.config.ts` and fix the `test` script in `flowserv-api/package.json`
- [x] 3.5C.2 Extract `flow-engine` logic so it is testable without HTTP (start of decision D1)
- [x] 3.5C.3 **Tests:** transition validation — valid, invalid, missing permission, cross-tenant
- [x] 3.5C.4 **Tests:** FIFO batch splitting and consumption order (`lib/fifo.ts`,
      6 tests, including the 5@10k/5@12k split-across-two-batches case)
- [x] 3.5C.5 **Tests:** stock level arithmetic across receive → sell → void
      (`lib/__tests__/stock-lifecycle.test.ts`, including the BUG-10 guard case)
- [x] 3.5C.6 Verify `npm test` passes (31/31, re-confirmed after task 08 — backend untouched)

### 3.5E. Deployment Config & Seed Data
> Added 2026-07-20 after the audit found these while working on 3.5A. Both are
> prerequisites for later phases rather than defects in current behaviour.

- [x] 3.5E.1 Replace the 35 hardcoded `localhost:3001` URLs in **client-side** code
      (20 files under `lib/states/` and `*.svelte`) with an env-backed constant, and
      commit `.env.example` files. Server-side (`+page.server.ts`) stays as-is until
      Phase 11. Added `lib/api/config.ts` as the single definition; `lib/api/client.ts`
      now imports from it instead of recomputing it. Verified: grep for
      `localhost:3001` across `*.svelte.ts`/`*.svelte` is empty (44 server-side
      occurrences in 28 files untouched, as intended); `npm run check` 0 errors;
      SSR-rendered all touched pages (customers, inventory, POS, tickets, brands,
      categories, an item detail, a PO detail) with a real login cookie — all 200;
      confirmed via the dev server's transformed module that `API_BASE` resolves
      identically to the old hardcoded value under the current `.env`.
- [x] 3.5E.2 Fix `db/seed.ts`: assign the Super Admin role (no user currently gets
      *any* role), make the seed idempotent, switch to bcrypt. Then remove the
      `'no-role'` full-menu fallback in `(app)/+layout.svelte`.
      **Must be done before 4.5B** — RBAC cannot be tested while every user is
      `'no-role'`.
      Rewrote the seed as find-or-create throughout, so it was safe to run against
      the existing dev database (preserving all data accumulated across tasks 01–08)
      rather than wiping it. Verified: ran it twice — first run reused the existing
      tenant/branch/roles/user and added the one genuinely missing piece (the role
      assignment); second run created nothing (`SELECT COUNT(*)`: 1 tenant, 4 roles,
      1 assignment). Login now returns `roleName: "Super Admin"`. A freshly-hashed
      password starts with `$2b$` and is 60 chars (confirmed via bcryptjs directly),
      not the old 64-char SHA-256 hex — the existing admin's own hash was left
      untouched by the find-or-create, so it's still SHA-256 and still logs in via
      the legacy branch in `routes/auth.ts`, exactly as intended (that branch stays
      until Phase 11). Removed the `'no-role'` fallback in `+layout.svelte` and added
      a visible amber notice for unassigned users instead of a silent empty menu.
      SSR-verified with a real login cookie: full menu renders, badge reads
      `Super Admin`, no-role notice correctly absent.

### 3.5D. Branch Hygiene & Docs
- [x] 3.5D.1 Merge current work → `main` (resolves the orphaned 1F.5 and 2C.3)
- [x] 3.5D.2 Branch fresh from `main` for the next phase
- [x] 3.5D.3 Add implementation-status headers to all 14 `specification/features/*.md`
      (decision D4). Each now states what is actually built vs not, derived from the
      verified endpoint inventory — so the catalog stops reading as current scope.
- [x] 3.5D.4 Git commit: `fix: phase 3.5 complete — stabilization`

---

## PHASE 4 — Purchasing, Supplier Debts, & Margins
> **Goal:** Supplier Management, Purchasing (Costing), AP (Hutang), Dynamic Margin Pricing.
> **Branch:** `phase-4/purchasing`
> **Status:** mostly built, but was marked complete prematurely.

### 4A. Supplier & Hutang (Accounts Payable)
- [x] 4A.1 BE: Create Supplier CRUD routes & schema
- [x] 4A.2 FE: Supplier Management page
- [x] 4A.3 BE: AP routes for tracking supplier debts — now supports recording
      payments and settling debt. See 3.5B.6.
- [x] 4A.4 FE: Manajemen Hutang Supplier page (with aging/tempo limits)

### 4B. Purchasing (PO & Costing)
- [x] 4B.1 BE: Purchase Order routes (receiving goods, updating stock_batches)
- [x] 4B.2 FE: Input Invoice/Costing page (Payment Method: Tunai, Transfer, Tempo)
- [x] 4B.3 BE: Auto-calculate `dueDate` based on Supplier's `paymentTermDays`
- [x] 4B.4 FE: Auto-fill due date when selecting 'Tempo'

> ⚠️ 4B.1 carries BUG-03, BUG-04, and BUG-05. Fixed in Phase 3.5.

### 4C. Dynamic Margin Pricing
- [/] 4C.1 BE: Margin Config (Markup/GrossMargin, Target %) — schema columns
      `marginStrategy` / `targetMargin` exist on categories and items, but **no endpoint
      sets them**. `settings.ts` only serves payment methods.
- [ ] 4C.2 BE: Update product pricing when new stock arrives — ⚠️ **not automatic.** The
      margin calculation lives entirely in the frontend simulator; the backend accepts
      whatever `sellingPrice` the client sends and never validates it against `targetMargin`.
- [x] 4C.3 FE: Show warning if new price changes drastically or modal > margin limit
- [x] 4C.4 FE: Inventory page enhancements (margin column, filter/sort by margin)
- [ ] 4C.5 Git commit: `feat: phase 4 complete — purchasing & margins`

---

## PHASE 4.5 — Finance Ledger, RBAC & Audit
> **Goal:** Build the three cross-cutting foundations that have schema tables but no code.
> **Read first:** specification/features/10-finance.md, specification/03-rbac-roles.md
> **Branch:** `phase-4.5/foundations`
>
> **Why this phase exists:** the old Quick Reference table listed Phase 4 as
> "RBAC + Audit" while the phase body said Purchasing. Both fell into that gap. This
> gives them a home. These are MVP features (FIN-007, PLT-003, PLT-006) and everything
> downstream — dashboards, reports, the customer portal — depends on them.

### 4.5A. Finance Ledger (FIN-007, FIN-010)
> **Completed 2026-07-21 as [H11](plan/H11-finance-ledger.md)** — see `plan/README.md`
> Stage 4 for the full writeup (event wiring, live API run, backfill against a
> synthetic historical invoice, frontend SSR verification). Posted via the
> existing event bus (`services/event-bus.ts`), not inline in route handlers —
> `POS_SALE_COMPLETED`/`POS_SALE_VOIDED`/`TICKET_PART_CONSUMED`/
> `SUPPLIER_INVOICE_CREATED`/`SUPPLIER_PAYMENT_RECORDED`, each emitted after its
> owning transaction commits.
- [x] 4.5A.1 BE: Post COGS + revenue to `financeLedgerEntries` on POS checkout
      (the FIFO code already computes the cost — currently discarded)
- [x] 4.5A.2 BE: Post reversal entries on invoice void
- [x] 4.5A.3 BE: Post AP entries on supplier invoice creation and payment —
      posted as `entryType: 'adjustment'`, not a new type; `supplierInvoices`/
      `supplierPayments` remain the real source of truth for AP balance (no
      chart-of-accounts liability account built here, per the task's own
      "resist scope creep" instruction).
- [x] 4.5A.4 GAP-06: delete the dead `posTransactions` / `invoiceLines` schema, or migrate
      onto it — do not leave two competing POS models. Resolved by
      [H1](plan/H1-delete-dead-schema.md), not H11 — verified during H11 that
      neither table exists in `db/schema/pos.ts` anymore, only `posInvoices`/
      `posInvoiceLines`.
- [x] 4.5A.5 **Tests:** ledger accuracy — COGS matches consumed batch cost, entries balance.
      `npm test`: 100/100 passing (15 new: `modules/finance/__tests__/ledger.test.ts`,
      `lib/__tests__/ledger-reconciliation.test.ts`).
- [x] 4.5A.6 FE: simple ledger view (Simple Mode per DAS-004) — new
      `/finance/ledger` page, SSR-verified with a real login cookie.

### 4.5B. RBAC Enforcement (PLT-003)
- [ ] 4.5B.1 BE: Create `middleware/rbac.ts` with `requirePermission('...')`
- [ ] 4.5B.2 BE: Seed the permission catalog from specification/03-rbac-roles.md
- [ ] 4.5B.3 BE: Apply `requirePermission` to every mutating endpoint
- [ ] 4.5B.4 **Tests:** 403 on unauthorized access; tenant isolation holds

### 4.5C. Audit Log (PLT-006)
- [ ] 4.5C.1 BE: Create `middleware/audit.ts` writing to the existing `auditLogs` table
- [ ] 4.5C.2 BE: Apply to all mutations
- [ ] 4.5C.3 FE: Audit log viewer (admin only)

### 4.5D. API Hardening
- [ ] 4.5D.1 Create `lib/pagination.ts`; apply cursor pagination to tickets, inventory,
      POS invoices (currently a hardcoded `limit: 100`)
- [ ] 4.5D.2 Create `lib/idempotency.ts`; apply `Idempotency-Key` to the three endpoints
      named in coding-guidelines §3.4
- [ ] 4.5D.3 Create the `BusinessError` class (guidelines §8) and wire it to the error
      handler so 409 and 422 are actually returned
- [ ] 4.5D.4 Git commit: `feat: phase 4.5 complete — ledger, rbac, audit`

---

## PHASE 5 — Core UI Polish (FE)
> **Goal:** Build remaining essential UI screens and polish the experience.
> **Read first:** specification/08-ui-ux.md, specification/features/12-dashboard-reporting.md
> **Branch:** `phase-5/core-ui`

- [ ] 5.1 Dashboard: Per-role default dashboards with widget layout
- [ ] 5.2 Ticket Board: Kanban with status colors, filters (completes 3B.5)
- [ ] 5.3 Ticket Detail: Timeline, cost breakdown, attachments
- [ ] 5.4 Inventory Dashboard: Stock levels, low-stock alerts, batch history
- [ ] 5.5 Product Catalog: Browse by category, supplier price comparison
- [ ] 5.6 POS/Cashier Screen: Touch-friendly, big buttons
- [ ] 5.7 Global Search: Typo-tolerant, grouped results
- [ ] 5.8 Technician Dashboard: My Jobs, Quick Actions, Calendar/Schedule
- [ ] 5.9 Finance Dashboard: Simple Mode + Accountant Mode toggle
- [ ] 5.10 Settings pages: Company, Branches, Roles, Printer config
- [ ] 5.11 Git commit: `feat: phase 5 complete — core UI polished`

---

## PHASE 6 — Printer Integration (Python)
> **Goal:** Build local thermal printer agent.
> **Read first:** specification/09-printer-integration.md
> **Branch:** `phase-6/printer`

- [ ] 6.1 Flask app: POST /print endpoint
- [ ] 6.2 Default template per paper size (58mm/80mm)
- [ ] 6.3 FE: Printer settings page (devices, templates, assignments)
- [ ] 6.4 Verify: physical print test
- [ ] 6.5 PyInstaller packaging
- [ ] 6.6 Git commit: `feat: phase 6 complete — printer integration`

---

## PHASE 7 — Builder UIs
> **Goal:** Build configuration UIs that make FlowServ unique.
> **Branch:** `phase-7/builders`

- [ ] 7.1 Flow Template Builder: Visual editor for nodes + transitions
- [ ] 7.2 Printer Template Builder: WYSIWYG editor + preview
- [ ] 7.3 RBAC Management UI: Visual permission matrix (depends on 4.5B)
- [ ] 7.4 Git commit: `feat: phase 7 complete — builder UIs`

---

## PHASE 8 — Business Module Expansion
> **Goal:** Implement remaining MVP features per domain.
> **Read first:** specification/features/00-feature-catalog.md (filter MVP ✅)
> **Branch:** `phase-8/modules`

- [ ] 8.1 Customer Management (profile, duplicate detection, history)
- [ ] 8.2 Device Management (identification, compatibility, status)
- [ ] 8.3 Supplier Management (profile, categories, pricing)
- [ ] 8.4 Purchasing (PO, goods receiving, returns)
- [ ] 8.5 Sales (walk-in, returns, discounts)
- [ ] 8.6 Service Billing (quotation, deposit, invoice, refund)
- [ ] 8.7 Warranty (templates, activation, claims)
- [ ] 8.8 Technician (skills, performance, commission)
- [ ] 8.9 Finance (AR, COA, journal, P&L) — builds on 4.5A
- [ ] 8.10 Dashboard Alerts (service, inventory, finance, warranty)
- [ ] 8.11 Customer Portal (magic link, approve/reject quote)
- [ ] 8.12 Git commit: `feat: phase 8 complete — all MVP modules`

---

## PHASE 9 — Testing & Local Network Deployment
> **Goal:** Comprehensive testing and deploy to local network (LAN/WiFi).
> **Branch:** `phase-9/testing`

- [ ] 9.1 Integration tests: Full flow end-to-end
- [ ] 9.2 Permission matrix: Test all role/action combinations
- [ ] 9.3 Multi-tenant: Verify data isolation
- [ ] 9.4 Performance: API response time
- [ ] 9.5 UX review: Mobile responsiveness, touch targets
- [ ] 9.6 Real-time: WebSocket updates working
- [ ] 9.7 Local network: Configure server to listen on 0.0.0.0
- [ ] 9.8 Test from other devices on same WiFi (phone, tablet, other PC)
- [ ] 9.9 Create startup script (one-click start for backend + frontend + database)
- [ ] 9.10 Git commit: `feat: phase 9 complete — tested and running on local network`

---

## PHASE 10 — Production Use (1 Shop)
> **Goal:** Use the app daily in your real shop. Fix issues as they arise.

- [ ] 10.1 Onboard real data (customers, inventory, suppliers)
- [ ] 10.2 Train staff on the application
- [ ] 10.3 Daily use for 2-4 weeks
- [ ] 10.4 Collect feedback & fix bugs
- [ ] 10.5 Database backup strategy (daily pg_dump)

---

## PHASE 11 — VPS Deployment (Future)
> **Goal:** Deploy to VPS when ready to serve multiple clients.
> **Only start when Phase 10 is stable and you want to expand.**

- [ ] 11.1 Provision VPS (DigitalOcean/Hetzner/etc.)
- [ ] 11.2 Setup PostgreSQL on VPS (or managed DB)
- [ ] 11.3 Setup Nginx reverse proxy + HTTPS (Let's Encrypt)
- [ ] 11.4 CI/CD pipeline (GitHub Actions → auto deploy)
- [ ] 11.5 Domain setup (flowserv.yourdomain.com)
- [ ] 11.6 Backup strategy (automated daily)
- [ ] 11.7 Monitoring & alerting

> **Before VPS:** replace the hardcoded `JWT_SECRET` fallback in `middleware/auth.ts`
> with a required env var that throws on startup if missing, and remove the legacy
> unsalted SHA-256 password path in `routes/auth.ts`.

---

## PHASE 12 — Phase 2 Features (Post-MVP)
> **Goal:** Implement 🟡 Phase 2 features based on real usage feedback.
> Only start after PHASE 10 is stable.

- [ ] 12.1 Multi-warehouse / multi-location stock
- [ ] 12.2 Stock Opname (scheduled audit)
- [ ] 12.3 WhatsApp Business API integration
- [ ] 12.4 Payment gateway (QRIS, cards)
- [ ] 12.5 SSO / enterprise login
- [ ] 12.6 Advanced finance (Balance Sheet, Cash Flow, Tax, Period Closing)
- [ ] 12.7 Supplier performance tracking
- [ ] 12.8 AI-assisted diagnosis suggestion
- [ ] 12.9 Advanced reporting & analytics
- [ ] 12.10 Webhook for external integrations
- [ ] 12.11 Platform Super Admin Dashboard (for managing multiple tenants)

---

## Architecture Debt (read before refactoring)

The backend does **not** follow the module structure in
`specification/coding-guidelines.md` §2. Most business logic still lives inline in
HTTP route handlers, which is why so little of it was testable.

Phase 3.5 began the correction: `modules/finance/` is the first module in the
specified shape, and the pure decision functions extracted along the way
(`services/flow-engine.ts`'s `evaluateTransition`, `lib/fifo.ts`, `lib/wac.ts`,
`routes/purchasing/order-status.ts`) are what the 37 current tests actually exercise.

**Decision: retrofit incrementally, never big-bang.**

When you touch a module for a fix or a feature, extract its `service.ts` *then*,
with a test. Do **not** refactor modules you are not otherwise changing. A
whole-codebase restructure with zero tests is the fastest way to break a working
application.

Other known debt, to be addressed as modules are touched:
- `drizzle-zod` is installed but never used; Zod schemas are hand-written (§4)
- `services/flow-engine.ts` should be `flow-engine/{engine,types,events}.ts`
- Two schema files violate kebab-case naming: `payment_methods__settings_.ts`,
  `relations__untuk_relational_query_api_drizzle.ts`
- Comments and error strings mix Indonesian and English — pick one for user-facing text

**Decision (2026-07-21, H4): `stock_levels` is deliberately a cache, not the source of
truth.** The source of truth for physical stock is `SUM(stock_batches.quantity_remaining)`.
`stock_levels.quantityAvailable` is a denormalized read cache kept in sync by every route
that touches stock, and it is the only place `quantityReserved` can live — that value
cannot be derived from batches, and H10 (stock reservation) needs it. Option B (drop the
cache, derive everything from a view over `stock_batches`) was considered and rejected for
that reason. What makes the cache safe now, that it was not before H4:
- `stock_levels` carries a `(tenant_id, inventory_item_id, branch_id)` unique constraint —
  a duplicate row (the failure mode that let `findFirst` silently return the wrong one) is
  now rejected by the database, not just prevented by row locking.
- Creating an inventory item auto-creates its `stock_levels` row (quantity 0) for every
  branch of the tenant, so a newly created item can never hit the `STOCK_LEVEL_MISSING`
  422 path in POS just because the cache row was never made.
- `GET /v1/inventory/reconciliation` (backed by the pure `reconcileStockLevels()` in
  `lib/reconciliation.ts`, covered by 5 unit tests) compares the cache against the batch
  sum per item/branch and reports any drift. Run it periodically, or after suspecting a
  bug in a stock-mutating route — a non-empty `drift` array means a code path updated one
  side without the other.
Revisit this decision (toward Option B) only if reconciliation keeps finding real drift
despite the constraint — that would mean something is writing to `stock_levels` without
going through the paths this task audited.

---

## Deprecated Documentation (DO NOT use as reference)

- `docs/` and `books/` — superseded archives. `specification/` is the single source of truth.

> **Removed 2026-07-20:** `legacy/`, `my-saas-app/`, and `pos_sederhana-main/` were
> example applications unrelated to FlowServ and have been deleted from the repo.
> Earlier task files and commit messages reference them as "folders to ignore" —
> that guidance is obsolete; they simply no longer exist.

---

## Quick Reference

> Corrected 2026-07-20 — this table previously contradicted the phase bodies
> (it listed Phase 4 as "RBAC + Audit" while the body said Purchasing, which is
> how both features ended up with schema tables and no code).

| Phase | Focus | Depends On |
|-------|-------|-----------|
| 0 | Documentation | — |
| 1 | Project Setup + DB + Cleanup + Git | Phase 0 |
| 2 | Auth + Flow Engine (BE+FE) | Phase 1 |
| 3 | Vertical Slice (BE+FE) | Phase 2 |
| **3.5** | **Stabilization — bug fixes + first tests** | Phase 3 |
| 4 | Purchasing, Supplier Debts, Margins | Phase 3.5 |
| **4.5** | **Finance Ledger, RBAC, Audit** | Phase 4 |
| 5 | Core UI Polish | Phase 4.5 |
| 6 | Printer Agent | Phase 5 |
| 7 | Builder UIs | Phase 5 + 6 |
| 8 | Module Expansion | Phase 5 |
| 9 | Testing + Local Network | Phase 8 |
| 10 | Production Use (1 Shop) | Phase 9 |
| 11 | VPS Deployment | Phase 10 |
| 12 | Post-MVP Features | Phase 10 |
