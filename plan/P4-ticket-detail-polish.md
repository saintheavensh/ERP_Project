# P4 — Ticket detail polish

> **Size:** S · **Layer:** BE (small) + FE · **Closes:** PHASES.md 5.3 (partial — see Scope)

## Scope decision (confirmed with user before starting)

PHASES.md 5.3 lists "timeline, cost breakdown, attachments." Research found timeline and
cost breakdown already substantially built (`TicketTimeline.svelte`, `TicketCharges.svelte`)
— genuine work is polish, not a rebuild. Attachments (before/after photos) has **zero**
infrastructure anywhere (no schema, no upload route, no storage) and the spec itself marks
PLT-009 "File Storage (photo before/after)" as Phase 2 (🟡), not MVP
(`specification/features/00-feature-catalog.md:242`).

**Decision: P4 covers timeline + cost breakdown polish + making the detail page
mobile-responsive (it had zero responsive classes, untouched by P1.5's shell-and-worst-
offenders pass). Attachments deferred to its own task** — storage strategy (local disk vs
cloud) is a real decision that interacts with the local-first-now/VPS-later deployment
plan (PHASES.md Deployment Strategy), not something to bolt on inside a polish task.

## What was already there (not rebuilt)

- `TicketTimeline.svelte` — full stage history, node name, timestamp, quoted notes,
  vertical-line-and-dot layout.
- `TicketCharges.svelte` — running totals (`Estimasi`/`Disetujui` in the header) and a
  margin summary block (`Pendapatan`/`Modal`/`Margin`, color-coded).

## Genuine gaps found and fixed

1. **Timeline had no actor name.** `ticketStageHistory.actorId` exists on the schema and
   is written on every transition/intake, but `GET /v1/tickets/:id`'s history query
   (`flowserv-api/src/routes/tickets.ts`) never joined `users` to surface it — only
   `nodeName`/`enteredAt`/`notes`. Added a `leftJoin(users, ...)` (left, not inner:
   `actorId` is nullable) and an `actorName` field.
2. **`consumed` charge total was fetched but never displayed.** `chargeTotals.consumed`
   existed in the state (`ticket.detail.svelte.ts`) and the backend response, just missing
   from `TicketCharges.svelte`'s header. Added it alongside the existing two.
3. **The whole detail page had zero responsive classes** — `flex gap-6` with a fixed
   `w-80` sidebar overflows badly under ~1000px. Made it stack (timeline below workspace)
   below `lg`, side-by-side above it — same shape as every other P1.5-era responsive fix
   in this codebase (mobile-first stack, unchanged desktop).
4. Reused `StatCard` (built in P3) for the charge/margin summary tiles instead of the
   previous ad-hoc inline header/footer split — first reuse of that component outside the
   dashboard, which is exactly what it was built generically enough to do.

## Verification (Definition of Done)

- New/updated Playwright coverage: mobile viewport walk of the ticket detail page
  confirming no page overflow and the timeline renders below (not beside) the workspace;
  desktop confirms unchanged side-by-side layout; confirms the actor name and consumed
  total actually render with real seed/fixture data.
- `npx tsc --noEmit` (API): 0 errors. `npx svelte-check` (web): 0 errors.
- Backend: live curl proof that `GET /v1/tickets/:id`'s `history` array now includes
  `actorName`.
- Full existing e2e suite (P1.5/P2/P3 + intake-to-close + F7) still green — this page is
  exercised by `intake-to-close.spec.ts`, so a layout regression here would show up there.

## Watch out

- `actorId` is nullable (system-driven transitions may have none) — the join must be a
  `leftJoin`, and the frontend must handle `actorName: null` gracefully (omit the "by
  ___" line rather than rendering "by null").
