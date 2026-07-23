# P3 — Per-role dashboards (static layout)

> **Size:** M (scoped down from the original "L") · **Layer:** FE (no backend changes)
> **Closes:** PHASES.md 5.1 (DAS-001..005, DAS-008 — the real-data half only, see Scope)

## Scope decision (confirmed with user before starting)

The feature catalog marks a full interactive widget framework (WDG-001..006: drag-and-drop
repositioning, resize/collapse, per-user persisted layout, admin-controlled role-based
widget catalog) as MVP alongside the dashboards themselves. `/` currently renders a
placeholder (a static "API Connected" health check) — nothing dashboard-shaped exists at
all yet.

**Decision: ship real dashboards with live data in a fixed, sensible layout now. Defer
the interactive widget framework (WDG-002..006) to a later task**, once there's an actual
multi-widget dashboard worth letting users rearrange. There's nothing to persist a layout
*for* until the content exists. This is the same incremental-retrofit shape already used
for P1.5 (fix the foundation, defer the exhaustive sweep) and the Architecture Debt section
of PHASES.md (retrofit incrementally, never big-bang).

## Research

- The four *real* seeded roles are Super Admin, Manager, Technician, Cashier — the spec's
  "Owner"/"Finance"/"Branch Mgr" dashboard types don't map 1:1 to anything that exists.
  Super Admin and Manager have near-identical sidebar visibility (tickets, inventory, POS,
  finance — Super Admin additionally gets Settings/Flow Templates), so they share one
  "operational overview" widget set. Technician and Cashier each get a narrower,
  role-specific set.
- Every widget is servable from **existing endpoints** with server-side (SvelteKit load
  function) aggregation — no new backend route needed:
  - Tickets by stage: `GET /v1/tickets?status=open&limit=200`, grouped client-side by
    `nodeName` (no counts-only endpoint exists; 200-cap is an acceptable MVP limit, same
    cap the Kanban board already accepts).
  - Low stock: `GET /v1/inventory?limit=200`, filtered where `reorderPoint > 0 &&
    totalAvailable <= reorderPoint` (both fields already computed/present in the response).
  - AR/AP: `GET /v1/finance/receivables` / `/payables` — line items only, summed
    (`grandTotal - amountPaid` / `totalAmount - amountPaid`) in the load function.
  - Today's sales: `GET /v1/pos/invoices?limit=200` (newest-first), filtered by
    `createdAt >= startOfToday && status !== 'voided'`. No date-range query param exists
    server-side; flagged as a future cheap addition if a branch ever does >200
    invoices/day between dashboard loads (not realistic for a single local shop yet).
  - My Jobs (Technician): `GET /v1/tickets?assignedTo=me&status=open&limit=200`, same
    grouping as tickets-by-stage.
- **Explicitly not built**: a "waiting parts" widget for the Technician dashboard. Charge
  status (`estimated`/`approved`/`consumed`) is only queryable per-ticket
  (`GET /v1/tickets/:id/charges`), so an aggregate across a technician's assigned tickets
  is N+1 — not cheap. Left for a later pass if it turns out to matter in practice (a bulk
  charges-by-technician endpoint would be the real fix, not a client-side N+1 loop).
- No reusable stat-card/tile component existed anywhere in the codebase — every page
  hand-rolls its own tile markup. Added one (`StatCard.svelte`) since this is the first
  page that needs several identical tiles side by side.

## What changed

- New `flowserv-web/src/lib/components/dashboard/StatCard.svelte` — a small presentational
  tile (title/value/subtitle/tone, optionally a link), styled to match the Kanban board's
  existing card language (`bg-white rounded-xl border border-slate-200 shadow-sm`).
- `flowserv-web/src/routes/(app)/+page.server.ts` (new) — role-branches on
  `locals.user.roleName`, fetches only what that role's widgets need (Technician doesn't
  pay for inventory/finance calls it won't render), aggregates in the load function.
- `flowserv-web/src/routes/(app)/+page.svelte` — rewritten from the health-check
  placeholder to the real per-role dashboard. Mobile-first: a `grid grid-cols-1 sm:grid-cols-2
  lg:grid-cols-4` tile grid (stacks on phone, no horizontal-scroll problem since tiles wrap
  naturally, unlike the Kanban board's columns).

## Verification (Definition of Done)

- New `e2e/p3-role-dashboards.spec.ts` (Playwright): logs in as each of the 4 seeded roles,
  confirms the role-appropriate tiles render with real (non-placeholder) numbers, and that
  a role never sees another role's widgets (e.g. Technician never sees AR/AP tiles).
- `npx svelte-check`: 0 errors.
- Backend untouched — no `flowserv-api` changes, no need to re-run its test suite.

## Watch out

- Don't hardcode flow-node names for ordering the "tickets by stage" tile beyond sorting
  by count — a future custom flow template's stage names aren't guaranteed to match
  "Standard Repair"'s.
- `GET /v1/finance/payables` and `/receivables` are unpaginated (`findMany` with no
  `.limit()`) — fine at current data volumes, but if either list grows large this
  dashboard's load time grows with it. Not a P3 problem to solve.
