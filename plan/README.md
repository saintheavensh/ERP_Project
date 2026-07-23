# FlowServ — Plan Index (master roadmap)

> **The single source for what is done, in progress, and not yet built.** `PHASES.md`
> holds the authoritative per-task evidence; this file is the map over it. If the two ever
> disagree, `PHASES.md` wins.
>
> **Convention (important):** a per-task `plan/*.md` file exists only while its task is
> active. **On completion the file is deleted** — its durable evidence moves to `PHASES.md`
> and lives forever in git history. This is how the Hardening Track (`H*.md`), Track F
> (`F*.md`), and Phase 4C/5 task files were all handled. So: an inline `plan/…md` link in
> `PHASES.md` pointing at a file that no longer exists is **expected** — it's a historical
> marker, not a broken reference. Only *active* plans keep their files.
>
> **AI agent?** `CARA-PROMPT.md` has ready-to-use prompt templates + the "no done without
> evidence" guardrail.

---

## Current focus

**Phase 5 — Core UI Polish**, on branch `phase-5/core-ui`.
Active detailed plan: **[P7-plus-phase5-completion-plan.md](./P7-plus-phase5-completion-plan.md)**
— a full codebase audit (done / partial / needs-fix) plus the remaining Phase 5 work broken
into small, individually-revertable steps, every FE step mobile-first.

---

## Status at a glance

### ✅ Done — built, tested, merged/verified (evidence in `PHASES.md` + git)
- **Foundations** — Hardening Track H0–H17 (auth, RBAC enforce/report, audit log, event-bus
  finance ledger, idempotency, pagination, BusinessError, seed/reset). Phases 3.5 / 4.5 / 3E.
- **Track F (F1–F8)** — made the dishonest flows honest: technician-assignment UI, "My Jobs"
  filter, ticket cancellation (real `cancelled` + reservation release), inventory item edit,
  PO delete guard, `warranty_records` deletion, live Create-Ticket button, spec-header refresh.
- **Phase 4 / 4C** — purchasing, supplier AP, dynamic margin config **and** server-side price
  enforcement (below-cost 422 / below-target warn).
- **Phase 5 so far:**
  - **P1.5** mobile app-shell (off-canvas drawer) + worst-offender table fixes.
  - **P2** ticket Kanban board (columns = flow nodes, tap-to-move + desktop drag), mobile-first.
  - **P3** per-role dashboards (Super Admin/Manager/Technician/Cashier) — *real-data half.*
  - **P4** ticket detail polish (timeline actor, cost-breakdown tiles, mobile layout) — *core half.*
  - **P5** finance dashboard Simple/Accountant toggle + `GET /v1/finance/ledger/summary`.
  - **P6** inventory search/low-stock filter + batch-history enrichment.

  Test baseline: **179 backend unit + 21 API e2e + 30 Playwright browser specs**, all green.

### 🔧 In progress — Phase 5 remainder
Detailed steps in **[P7-plus-phase5-completion-plan.md](./P7-plus-phase5-completion-plan.md)**.
Suggested order: **P7 → P8 → P10 → P11 → P12 → P9**.

| # | Task | PHASES.md | Layer | Note |
|---|------|-----------|-------|------|
| **P7** | Mobile responsive sweep (remaining tables) | — | FE | **do first.** finance/purchasing/inventory-sub tables still force page-wide horizontal scroll on a phone. Per-page commits. |
| P8 | Global Search (top-bar, grouped) | 5.7 / PLT-007 | BE+FE | nothing built yet |
| P10 | Product Catalog (browse by category + supplier price comparison) | 5.5 | FE-mostly | data exists (`itemBrandPricing`), no view |
| P11 | Technician quick actions on dashboard | 5.8 | FE | My Jobs done (P3); calendar/schedule deferred (no data model) |
| P12 | POS touch polish (big buttons / tap targets) | 5.6 | FE | mostly done in P1.5; targeted pass |
| P9 | Settings pages (Company / Branches / Users+Roles / Payment Methods) | 5.10 | BE+FE | **largest** — needs real CRUD; includes **2A.1 create-user**. Printer→Phase 6, RBAC matrix→Phase 7 |

### ⏳ Deferred / not built — tracked so nothing is forgotten
| Item | Why | Lands in |
|---|---|---|
| Dashboard **widget framework** (drag/resize/persist/admin catalog, WDG-002..006) | P3 shipped real dashboards first | later Phase 5 or Phase 7 |
| Ticket **attachments** (before/after photos, PLT-009) | spec Phase 2; no upload/storage infra; local-vs-cloud is a deploy decision | own task, post-MVP |
| Technician **calendar / schedule / commission** (TECH-011/013) | no scheduling/commission data model | Phase 8 |
| **RBAC** branch + multi-role in JWT; permission-driven sidebar | hardcoded role checks today | Phase 5.9-scope, see spec-03 |
| Real **P&L / Chart of Accounts / journal** (double-entry) | ledger single-sided by design | Phase 2+ / Phase 8 |
| **RBAC management UI** (permission matrix) | | Phase 7.3 |
| **Printer** config UI + Python agent | | Phase 6 |

### Floating gaps (fold into whichever task touches them)
- **2A.1 register / create-user endpoint** — still absent; now owned by **P9.2**.
- **H16 module migration** — when you touch a not-yet-migrated module (`modules/pos/`,
  `modules/purchasing/`), extract its `service.ts` + a test *then*. Never a refactor branch.
- **`catch (err: any)` sweep** (~36 sites) → `catch (err: unknown)` + shared `toBusinessError()`.
- **drizzle-zod adoption** (0 imports) — coding-guidelines §4 wants generated Zod schemas.

---

## Definition of Done (applies to every task)

> A task is `[x]` only with **a passing automated test**, **a recorded API request +
> response**, or **for frontend work, a click-path actually walked** (Playwright is installed,
> `flowserv-web/e2e/`). "I wrote the code and it looked correct" is **not** done.

---

## Later phases (roadmap — detailed task files authored when reached)

### Phase 6 — Printer Integration (Python)
Flask `POST /print` agent + python-escpos + per-paper-size templates (58/80mm) + printer CRUD
over the existing `printer_*` schema tables + settings UI + PyInstaller packaging. Zero code today.

### Phase 7 — Builder UIs
Flow Template Builder (upgrade read-only `/flows/[id]` to a node/transition editor), Printer
Template Builder (WYSIWYG, depends on Phase 6), **RBAC Management UI** (visual permission matrix
+ custom roles; depends on 5.9 / P9.2).

### Phase 8 — Business Module Expansion *(remaining MVP, rough value order)*
- **Customer portal + magic-link approval** (SVC-007/CUST-009) — fixes the faked-approval flow · L
- **Service refund** (SBL-005 — consumes the dead `finance.approve_refund` permission) · M
- **Sales returns** (SAL-005 — void ≠ return) · L
- **Discount thresholds + approval** (SAL-006 — a cashier can currently zero out any sale) · M
- **Service categories + labor pricing** (CAT-001) · M
- **Stock adjustment / supplier + customer returns** (INV-008/009/010; opname is add-only) · M each
- **Stock-movement read endpoint** (INV-005 — written but never viewable) · M
- **Customer/device service history** + duplicate detection (CUST-005/008, DEV-005) · M
- **Warranty lifecycle** (WAR-001..006 — table was deleted in F6; design with the feature) · L
- **Technician skills + assignment recommendation** (TECH-002/003) · L
- **Expense + Cash management** (FIN-005/002 — without these any "profit" overstates margin) · M/L
- **Chart of Accounts / Journal / double-entry** (FIN-007/008/009 — **design decision needed**) · L

### Phase 9–11 — Testing, LAN, Production, VPS
- **9:** integration tests beyond the happy path, permission-matrix tests, multi-tenant isolation,
  `0.0.0.0` binding, one-click launcher, realtime WebSocket (PLT-013 — declared, not wired).
- **10:** real-shop onboarding, daily use, `pg_dump` backup strategy.
- **11 — pre-VPS security debt** (confirmed live): make `JWT_SECRET` throw-on-missing
  (`middleware/auth.ts`), remove the legacy SHA-256 password branch (`routes/auth.ts`), env-back
  the ~50 server-side `localhost:3001` URLs. *Pull the `JWT_SECRET` throw forward — one line,
  zero-risk if `.env` already sets it.*

---

## Progress log

**Track F** — ✅ COMPLETE 2026-07-23 (F1–F8). Evidence: `PHASES.md` Phase 3E/4 + git.
**Phase 4C** — ✅ COMPLETE 2026-07-23 (4C.1 config, 4C.2 enforcement). Closes Phase 4.

**Phase 5** (branch `phase-5/core-ui`):
- [x] P1.5 Mobile shell — 2026-07-23
- [x] P2 Ticket Kanban (3B.5 / 5.2) — 2026-07-23
- [/] P3 Role dashboards (5.1) — 2026-07-23 · real-data half done; widget framework deferred
- [/] P4 Ticket detail polish (5.3) — 2026-07-23 · core done; attachments deferred
- [x] P5 Finance dashboard modes (5.9→built as DAS-004) — 2026-07-23
- [x] P6 Inventory search + batch history (5.4) — 2026-07-23
- [ ] P7 Mobile responsive sweep — see [P7-plus plan](./P7-plus-phase5-completion-plan.md)
- [ ] P8 Global Search (5.7)
- [ ] P9 Settings CRUD (5.10, incl. 2A.1)
- [ ] P10 Product Catalog (5.5)
- [ ] P11 Technician quick actions (5.8)
- [ ] P12 POS touch polish (5.6)
