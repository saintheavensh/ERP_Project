# P2 — Ticket Kanban board

> **Size:** M · **Layer:** BE + FE · **Closes:** PHASES.md 5.2 (and the long-open 3B.5)
> **Goal:** Visualize open tickets as columns = flow nodes, built mobile-first per the
> broadened principle #3 in `specification/08-ui-ux.md` (added in P1.5).

## Research (done before writing code)

- Flow graph is a true DAG, not a line: `Diagnosis` branches to both `Waiting Approval`
  and `Repair`; `Waiting Approval` branches to both `Repair` and `Completion`. Columns
  are ordered by `flow_nodes.sequence_order` for display, but **valid moves are computed
  only from `flow_transitions` edges** (`fromNodeId === card's current node`), never by
  column adjacency.
- Terminal node = structurally no outgoing transitions (existing rule, `engine.ts`).
  Entering one sets `status: 'closed'`. The board only shows `status='open'` tickets, so
  a card **leaves the board** the moment it's moved into a terminal column (e.g.
  `Completion`) — same shape as "Done" cards graduating off an active-work board. Not a
  bug: documented here so it isn't reported as one.
- `POST /:id/transition` has no route-level `requirePermission` — gating is inside
  `FlowEngine.executeTransition`, keyed on the **target node's** `requiredPermissionId`.
  Only `Diagnosis` is gated today (`ticket.diagnose`). This means a permission failure
  always surfaces as a real 403 `PERMISSION_DENIED`, independent of `RBAC_MODE`. There is
  no endpoint exposing the caller's granted permission codes, so the board cannot
  pre-emptively grey out a target column the user can't move into — same limitation the
  existing ticket-detail transition picker already has (`ticket.detail.svelte.ts`
  `executeTransition`, no pre-check, just surfaces the error). The board follows the same
  precedent: attempt the move, surface a clear message on 403 vs 409.
- `GET /v1/tickets` did **not** return `currentNodeId`/`flowTemplateId`, only the joined
  *names* — insufficient to group cards into columns or know the source node for a move.
  Backend change required (see below).
- `svelte-dnd-action` is **not installed** (contrary to the PHASES.md note assuming it
  was already in the stack) and its Svelte-5 compatibility wasn't verified. Decision:
  skip the dependency. Native HTML5 drag-and-drop (`draggable`, `dragstart`/`dragover`/
  `drop`) covers the desktop/mouse case with zero new dependency and no compat risk, and
  doesn't work on touch anyway — so touch needed a tap fallback regardless. Given that,
  **tap-to-move is the primary, single interaction model** (identical on mobile and
  desktop: tap a card → a panel lists valid next stages, computed the same way as
  `ticket.detail.svelte.ts`'s `availableTransitions` → tap one → confirm). Native drag is
  added as a desktop-only progressive enhancement calling the exact same move function,
  not a separate code path.

## Decisions

1. **Board scope = one flow template at a time.** Only one service flow template
   (`Standard Repair`) exists in seed data today, but the schema allows more. A dropdown
   (hidden if only one template exists) lets the user switch; default = the tenant's
   `isDefault` service-domain template. Mixing tickets from different templates in one
   set of columns doesn't make sense once node ids diverge across templates.
2. **Board shows `status='open'` tickets only.** Closed/cancelled tickets already have a
   home (the existing list page, unfiltered). Kanban is for active work in flight.
3. **Tap-to-move is the primary, Definition-of-Done-satisfying interaction** (works
   identically on every viewport). Native drag-and-drop is a desktop-only bonus on top
   of it — turned out Playwright's `locator.dragTo()` drives real HTML5 drag events
   reliably enough to cover it too (see Verification below), so it ended up automated
   as well, not just manually checked as originally planned.
4. Reuses the "My Jobs" filter: a Technician's board is scoped to `?assignedTo=me`,
   exactly like the existing list page.

## Backend changes

`flowserv-api/src/routes/tickets.ts` — `GET /v1/tickets`:
- Add `currentNodeId` and `flowTemplateId` (the raw ids, not just the joined names) to
  the select.
- Add optional `?status=` filter (validated against `ticketStatusEnum.enumValues`,
  ignored if not a recognized value — matches the existing lenient-query-param style of
  `?assignedTo=`).
- Add optional `?flowTemplateId=` filter (`eq`, no validation needed — an unmatched uuid
  just yields zero rows, same as any other filter here).

No other backend endpoint needed: `GET /v1/flows` (list, for the template dropdown),
`GET /v1/flows/:id` (nodes + transitions, for columns + valid-move computation), and
`POST /v1/tickets/:id/transition` (the move itself) all already exist and are reused
as-is.

## Frontend changes

- New `flowserv-web/src/lib/states/tickets/ticket.board.svelte.ts` — loads
  templates/tickets, exposes `columns` (nodes ordered by `sequenceOrder`, each with its
  tickets), `availableTargets(ticket)` (mirrors `ticket.detail.svelte.ts`'s
  `availableTransitions`), `move(ticket, targetNodeId)` (idempotent POST, same pattern as
  `executeTransition`), and template-switcher state.
- New route `flowserv-web/src/routes/(app)/tickets/board/+page.server.ts` +
  `+page.svelte` — mobile-first from the start: columns in a `overflow-x-auto flex`
  row, each column `min-w-[280px] w-72 shrink-0` so phones get natural horizontal
  column scroll (per the `08-ui-ux.md` note added in P1.5) instead of crushed columns.
- Card tap opens a small inline panel (not a full modal — keeps it light) listing valid
  target nodes; confirming calls `move()`. A "Detail →" link on the card still goes to
  `/tickets/:id` for the full workspace.
- Desktop enhancement: cards `draggable="true"`; columns handle `dragover`/`drop`;
  drop calls the exact same `move()` used by tap, after checking the transition edge
  exists client-side (invalid drop target = no-op, not a failed API call).
- Cross-links: `/tickets` (list) gets a "Board View" link; `/tickets/board` gets a "List
  View" link back. Sidebar's "Tickets"/"My Jobs" entry unchanged (still points at the
  list, which stays the default landing page — the board is opt-in, not a replacement).

## Verification (Definition of Done)

- New `e2e/p2-ticket-kanban.spec.ts` (Playwright):
  - **375×667 (mobile):** columns scroll horizontally, page itself doesn't overflow;
    tap a card → panel shows valid target(s) → tap target → ticket moves to the new
    column (re-fetch or optimistic update reflected in the DOM); a permission-gated
    move (into `Diagnosis`) surfaces a clear error for a role without `ticket.diagnose`.
  - **1280×800 (desktop):** template dropdown hidden when only one template exists;
    list↔board cross-links work; native `dragTo()` drag-and-drop moves a card between
    two columns connected by a real transition edge (Diagnosis → Waiting Approval).
  - 6 tests, all passing. Screenshots in `test-results/p2-ticket-kanban/`.
- `npx tsc --noEmit` (API): 0 errors. `npx svelte-check` (web): 703 files, 0 errors.
- Backend: live curl proof — `GET /v1/tickets?status=open&flowTemplateId=...` returns
  `currentNodeId`/`flowTemplateId` and respects both filters; a bogus `flowTemplateId`
  yields zero rows; Cashier attempting Intake→Diagnosis gets 403 `PERMISSION_DENIED`
  (`ticket.diagnose` not granted); Super Admin performing the same move gets 200 and the
  ticket's `nodeName` flips to `Diagnosis` on the next list fetch.

## Watch out

- Don't compute valid moves from column adjacency (`sequenceOrder`) — the graph branches
  (Diagnosis → Approval **or** Repair). Always filter `transitions` by `fromNodeId`.
- The `Completion` column will (correctly) stay visually empty on the open-only board —
  don't "fix" this by including closed tickets by default.
