# Next Steps — after the Hardening Track (P-series)

> **Created 2026-07-23.** The Hardening Track (H0–H17) is complete; H16 remains a
> standing rule, not an open task. This file is the roadmap for what comes next,
> connecting `PHASES.md` to concrete, mentionable task files. Same conventions as
> [README.md](./README.md): one task file per item, self-contained, marked done here
> with evidence, committed per task.

## Where we are (verified 2026-07-23)

- All accumulated work is on `phase-4/purchasing-completion` and pushed to origin.
  `origin/main` was 24 commits behind; **now synced** (pushed this session).
- **4C.1 done** (margin config endpoints — commit `1b3ddbd`). `npm test`: 162 unit + 21 e2e.
- Phase 4 is **one task from complete**: only 4C.2 (margin enforcement) remains.

## The sequence

### Stage A — Finish Phase 4 (do first, it's small and overdue)

| # | Task | Size | Notes |
|---|---|---|---|
| P1 | [Margin enforcement on price writes](./P1-margin-enforcement.md) — closes 4C.2 | M | reuses `lib/margin.ts`; one block-vs-warn decision |
| — | 4C.5: `feat: phase 4 complete — purchasing & margins` | S | the phase-complete commit, after P1 |

### Stage B — Merge decision (branch hygiene) — ✅ RESOLVED 2026-07-23

What actually happened (this section's original plan assumed a merge that turned out
not to be necessary): Track F (F1–F8) landed on a separate `track-f/honesty-fixes`
branch, which merged `phase-4/purchasing-completion` into itself partway through
(before F4) rather than the other way around. By the time P1/4C.2 landed,
`track-f/honesty-fixes` was a strict superset of both `main` and
`phase-4/purchasing-completion` — zero unique commits on either side — so `main` was
**fast-forwarded** straight to `track-f/honesty-fixes`'s tip (`60306ce`), pushed, and
both now-fully-contained branches were deleted (local + remote). `phase-5/core-ui`
is branched fresh from this `main`.

### Stage C — Phase 5 (Core UI Polish) — the next real phase

Read `specification/08-ui-ux.md` + `specification/features/12-dashboard-reporting.md`
first. Highest-value items, roughly in order:

| # | Task | Size | Notes |
|---|---|---|---|
| P1.5 | [Mobile shell fix](./P1.5-mobile-shell-fix.md) — responsive nav + worst-offender pages | S | prerequisite for P2+: fixes the foundation everything else renders inside |
| P2 | Ticket Kanban board (PHASES.md 5.2, **closes the long-open 3B.5**) | M | columns = flow nodes, drag-drop via `svelte-dnd-action` (already in the stack); the flow engine already gives node ordering; **mobile-first per the updated `08-ui-ux.md`** — horizontal column scroll + tap-based transition fallback, not just drag |
| P3 | Per-role default dashboards + widgets (5.1) | L | split further if it stalls |
| P4 | Ticket detail polish: timeline, cost breakdown, attachments (5.3) | M | most of the data already exists (charges, ledger, stage history) |
| P5 | Finance dashboard: Simple/Accountant toggle (5.9) | M | builds on the H11 ledger + H14 receivables |
| P6 | [Inventory dashboard gaps](./P6-inventory-dashboard-gaps.md) (5.4) | S | turned out narrow — search/filter + batch-history enrichment, not a new page |
| — | remaining 5.5–5.8, 5.10 as capacity allows | — | product catalog, POS polish, global search, technician quick-actions/calendar, settings pages |

### Stage D — Small floating gaps (fold into whichever phase touches them)

| Item | Where it fits | Notes |
|---|---|---|
| 2A.1 register endpoint | Phase 5 settings / user mgmt, or Phase 8 | genuinely absent; only needed once multi-user self-signup matters. Low priority — a seeded admin creates users today. |
| H16 module migration | every task, forever | when you touch a not-yet-migrated module (`modules/pos/`, `modules/purchasing/`), extract its `service.ts` + a test *then*. Never a dedicated refactor branch. |
| `catch (err: any)` sweep (~36 sites) | per-module, as touched | → `catch (err: unknown)` + a shared `toBusinessError()`. |
| drizzle-zod adoption (0 imports) | per-module, as touched | coding-guidelines §4 wants generated Zod schemas; hand-written today. |

## Definition of Done (unchanged, applies to every P-task)

A task is `[x]` only with **a passing automated test**, **a recorded API request +
response**, or **for frontend work, a click-path actually walked** (Playwright is now
installed in `flowserv-web` since H15 gap (b) — use it, no more SSR-cookie substitutes).

## Progress

Stage A
- [x] P1 Margin enforcement (4C.2) — 2026-07-23, see [P1-margin-enforcement.md](./P1-margin-enforcement.md)
- [x] 4C.5 Phase-4-complete commit — 2026-07-23 (Phase 4 fully `[x]` in PHASES.md)

Stage B
- [x] Branch hygiene — 2026-07-23. `main` fast-forwarded to `track-f/honesty-fixes`'s
      tip (`60306ce`); `track-f/honesty-fixes` and `phase-4/purchasing-completion`
      deleted (local + remote, fully contained). `phase-5/core-ui` branched fresh
      from `main` and is the active branch.

Stage C
- [x] P1.5 Mobile shell fix — 2026-07-23, see [P1.5-mobile-shell-fix.md](./P1.5-mobile-shell-fix.md)
- [x] P2 Ticket Kanban (3B.5 / 5.2) — 2026-07-23, see [P2-ticket-kanban-board.md](./P2-ticket-kanban-board.md)
- [/] P3 Role dashboards (5.1) — 2026-07-23, see [P3-role-dashboards.md](./P3-role-dashboards.md).
      Real-data dashboards done; the interactive widget framework (drag/resize/persist/
      admin catalog) deferred to a follow-up task by explicit scope decision.
- [/] P4 Ticket detail polish (5.3) — 2026-07-23, see [P4-ticket-detail-polish.md](./P4-ticket-detail-polish.md).
      Timeline actor name + cost-breakdown tiles + mobile-responsive pass done;
      attachments (photos) deferred to its own task by explicit scope decision
      (spec marks it Phase 2, zero infra exists).
- [x] P5 Finance dashboard modes (5.9) — 2026-07-23, see [P5-finance-dashboard.md](./P5-finance-dashboard.md).
      New /finance page, Simple/Accountant mode toggle, small backend ledger-summary
      aggregation endpoint. COA/journal entries/exports explicitly out of scope.
- [x] P6 Inventory dashboard gaps (5.4) — 2026-07-23, see [P6-inventory-dashboard-gaps.md](./P6-inventory-dashboard-gaps.md).
      Search + low-stock filter on /inventory, dashboard tile deep-link, batch history
      enriched with supplier/branch/date. Frontend-only, no new page needed.
