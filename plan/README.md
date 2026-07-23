# FlowServ — Continuation Plan (post-Hardening-Track)

> **Created 2026-07-23.** Replaces the Hardening Track plan (H0–H17), which is **complete
> and merged to `main`**. The durable evidence for every H-task now lives in `PHASES.md`
> (Phases 3.5 / 4 / 4.5 / 3E) and in git history (commits `d32e881`→`aa341c6`); the individual
> `H*.md` task files were deleted on completion, the same way the Phase 3.5 scaffolding was.
>
> **How to use this folder:** each `F*.md` / phase task file is self-contained — open one, do it,
> mark it done in the Progress section below, commit. Detailed task files for Phase 5+ are authored
> **when that phase is reached** (the H-track worked the same way: detailed files for the active
> track, a roadmap table for what's further out).
>
> **AI agent?** `CARA-PROMPT.md` still applies — ready-to-use prompt templates and the guardrails
> that stop a task being marked done without evidence.

---

## Where we are

The backend + a functional CRUD frontend are built and tested (137 unit + 21 e2e passing). What's
missing splits into two kinds, and **the first kind matters more than raw missing features**:

1. **Flows that are wired up but lie** — orphaned endpoints, faked steps, dead buttons/enums, and
   validation that only exists on the client. These make the app *look* like it does something it
   doesn't. → **Track F** below.
2. **Missing features** — whole MVP areas with no code. → **Phases 5–8** below.

Full detail comes from a 6-domain gap audit (2026-07-23) and is summarized inline in each task file.

### The dishonest flows the audit found (what Track F + 4C fix)
- Technician assignment endpoint (H8) is **orphaned** — no UI calls it → F1.
- "My Jobs" shows **all** tenant tickets, not the technician's → F2.
- `cancelled` ticket status is a **dead enum** — nothing sets it, and reserved parts would leak → F3.
- No way to **edit an inventory item** after creation → F4.
- PO delete can corrupt stock (**guard commented out**) → F5.
- `warranty_records` is an **orphaned table** (no code touches it) → F6.
- Customer-detail "Create Ticket" button is **dead** (no action) → F7.
- Six spec status headers are **stale** (understate what H8–H17 built) → F8.
- **Margin is a frontend illusion** — columns never written, backend accepts any price → 4C.
- (Bigger, deferred to later phases) customer approval is **faked**, refund permission is **dead**,
  RBAC ignores **branch + multi-role**, and the sidebar uses **hardcoded role checks**.

---

## Definition of Done (unchanged, applies to every task here)

> A task may be marked `[x]` only when there is **a passing automated test**, **a recorded API
> request + response**, or **for frontend work, a click-path actually walked** (Playwright is now
> installed — `flowserv-web/e2e/`). "I wrote the code and it looked correct" is **not** done.

---

## Track F — Finishing / honesty pass  *(do first; mostly small, high value)*

Make the built flows honest before layering new UI on top. Mirrors how the H-track made the
checkboxes true before building more.

| # | Task | Size | Layer |
|---|------|------|-------|
| F1 | [Technician assignment UI](./F1-technician-assignment-ui.md) — wire the orphaned H8 endpoint | S | FE |
| F2 | ["My Jobs" filter](./F2-my-jobs-filter.md) — technician sees only their tickets | S | FE |
| F3 | [Ticket cancellation](./F3-ticket-cancellation.md) — real `cancelled` status + release reserved parts | M | BE+FE |
| F4 | [Inventory item edit](./F4-inventory-item-edit.md) — `PUT /v1/inventory/:id` | S | BE+FE |
| F5 | [PO delete guard](./F5-po-delete-guard.md) — block deleting a received/completed PO | S | BE |
| F6 | [Warranty-records decision](./F6-warranty-records-decision.md) — adopt or delete the orphaned table | S | BE |
| F7 | [Create-Ticket button](./F7-create-ticket-button.md) — wire the dead button → intake | S | FE |
| F8 | [Refresh spec headers](./F8-refresh-spec-headers.md) — stop the 6 stale status headers lying | S | docs |

> **Bigger "faked flow" fixes that are really features** (scheduled in later phases, not Track F
> because of size): real customer approval portal → **Phase 8**; service refund (dead
> `finance.approve_refund` permission) → **Phase 8**; RBAC branch/multi-role + permission-driven
> sidebar → **Phase 5.9**.

---

## Phase 4C — Dynamic margin pricing  *(the officially-current phase — close it)*

| # | Task | Size | Layer |
|---|------|------|-------|
| 4C | [Margin config endpoint + server-side price validation](./4C-margin-config-and-validation.md) — closes 4C.1/4C.2/4C.5 | M | BE+FE |

---

## Phase 5 — Core UI Polish  *(the headline phase; biggest visible win)*
> Detailed `5.*.md` task files to be authored when Phase 5 starts.

| # | Task | Size | Layer | Notes |
|---|------|------|-------|-------|
| 5.1 | Per-role dashboards replacing the health-check landing page | L | BE+FE | Needs new KPI/count read endpoints. Spec design principle #1. |
| 5.2 | Kanban ticket board (columns = flow stages, drag-drop → transition) | L | FE | Closes 3B.5. Add `svelte-dnd-action`. Stages: Intake→Diagnosis→Waiting Approval→Repair→Completion. |
| 5.3 | Ticket detail polish (live cost/margin breakdown, approval panel, photo slots) | M | FE | |
| 5.4 | Finance dashboard Simple/Accountant toggle + basic **P&L** | M | BE+FE | All data already in the ledger; aggregate it (DAS-004 / FIN-011). |
| 5.5 | Audit-log viewer page | S | FE | Backend `GET /v1/audit-logs` already exists — pure FE win. |
| 5.6 | Settings UIs (Company, Branches, Payment Methods) | M | BE+FE | Replaces the placeholder `/settings` page. |
| 5.7 | Global search (top-bar; tickets/customers/inventory/invoices) | M | BE+FE | PLT-007. |
| 5.8 | Technician dashboard + calendar/schedule | L | FE | Depends on F1/F2. Mobile-friendly (design principle #3). |
| 5.9 | RBAC correctness: JWT carries all roles + branch scope; permission-driven sidebar | M | BE+FE | Fixes spec-03 mismatch + the hardcoded-role sidebar. |
| 5.10 | Register / create-user endpoint (2A.1) | M | BE | Prerequisite for the RBAC management UI (Phase 7.3). |

---

## Phase 6 — Printer Integration (Python)
Flask `POST /print` agent + python-escpos + per-paper-size templates (58/80mm) + printer CRUD routes
over the existing `printer_*` schema tables + settings UI + PyInstaller packaging. Zero code today.

## Phase 7 — Builder UIs
Flow Template Builder (upgrade read-only `/flows/[id]` to a node/transition editor), Printer Template
Builder (WYSIWYG, depends on Phase 6), **RBAC Management UI** (visual permission matrix + custom roles;
depends on 5.9/5.10).

## Phase 8 — Business Module Expansion  *(remaining MVP features, rough value order)*
- **Customer portal + magic-link approval** (SVC-007/CUST-009) — fixes the faked-approval flow · L
- **Service refund** (SBL-005 — consumes the dead `finance.approve_refund` permission) · M
- **Sales returns** (SAL-005 — void ≠ return; a paid sale can't be returned today) · L
- **Discount thresholds + approval** (SAL-006 — a cashier can currently zero out any sale) · M
- **Service categories + labor pricing** (CAT-001) · M
- **Stock adjustment / supplier returns / customer returns** (INV-008/009/010; opname is add-only) · M each
- **Stock-movement read endpoint** (INV-005 — written but never viewable) · M
- **Customer/device service history** + duplicate detection (CUST-005/008, DEV-005) · M
- **Warranty lifecycle** (WAR-001..006 — depends on F6) · L
- **Technician skills + assignment recommendation** (TECH-002/003) · L
- **Expense + Cash management** (FIN-005/002 — without these any "profit" number overstates margin) · M/L
- **Chart of Accounts / Journal / double-entry** (FIN-007/008/009 — currently a deliberate single-sided ledger; **design decision needed**) · L

## Phase 9–11 — Testing, LAN, Production, VPS
- **9:** integration tests beyond the one happy path, permission-matrix tests, multi-tenant isolation
  tests, `0.0.0.0` binding, one-click launcher, realtime WebSocket (PLT-013 — declared in CLAUDE.md, not wired).
- **10:** real-shop onboarding, daily use, `pg_dump` backup strategy.
- **11 — pre-VPS security debt** (confirmed live): make `JWT_SECRET` throw-on-missing
  (`middleware/auth.ts:13`), remove the legacy SHA-256 password branch (`routes/auth.ts:30`), and
  env-back the ~50 server-side `localhost:3001` URLs. *Recommend pulling the `JWT_SECRET` throw
  forward — it's one line and zero-risk if `.env` already sets it.*

---

## Progress

Track F
- [x] F1 Technician assignment UI — 2026-07-23
- [x] F2 "My Jobs" filter — 2026-07-23
- [x] F3 Ticket cancellation — 2026-07-23
- [ ] F4 Inventory item edit
- [ ] F5 PO delete guard
- [ ] F6 Warranty-records decision
- [ ] F7 Create-Ticket button
- [ ] F8 Refresh spec headers

Phase 4C
- [ ] 4C Margin config + server-side price validation

Phase 5+
- [ ] Authored when reached (see roadmap tables above)
