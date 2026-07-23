# F2 — "My Jobs" actually shows my jobs

> **Size:** S · **Layer:** FE · **Priority:** now · **Depends on:** F1
> **Goal:** The Technician "My Jobs" menu must list only that technician's assigned tickets.

## Problem (the dishonest flow)
The sidebar shows a "My Jobs" link → `/tickets` for the Technician role, and the backend
`GET /v1/tickets` already supports `?assignedTo=me`. But `tickets/+page.server.ts` **never
passes the filter**, so a technician sees every ticket in the tenant. The menu label is a lie.

## Files to touch
- `flowserv-web/src/routes/(app)/tickets/+page.server.ts` — when the logged-in user's role is
  Technician (or, better, always when a "mine" view is requested), append `?assignedTo=me` to
  the tickets fetch.
- `flowserv-web/src/routes/(app)/tickets/+page.svelte` — optional: a small "My tickets / All
  tickets" toggle for roles that can see both (Manager/Super Admin).

## Steps
1. Read the current user (already available from the auth cookie/`/me`) in the load function.
2. If Technician → fetch `GET /v1/tickets?assignedTo=me`. Managers/Super Admin keep the full
   list (or default to "all" with a toggle).
3. Keep cursor pagination intact (the list is already paginated from H13).

## Verification (Definition of Done) — DONE 2026-07-23
- `tickets/+page.server.ts` now checks `locals.user?.roleName === 'Technician'` and, only
  then, appends `?assignedTo=me` to the `GET /v1/tickets` fetch — matches the same
  `roleName` field already used by the sidebar (`(app)/+layout.svelte`) and typed in
  `app.d.ts`. No toggle was added (Manager/Super Admin/Cashier keep the unfiltered list,
  per the task's "optional" note).
- **Live SSR run with real login cookies** (via the actual SvelteKit login form action,
  not simulated): logged in as Technician ("Teknisi Andi") — `/tickets` showed
  **"No tickets found"** before any assignment (proves the filter is real, not a no-op:
  the seeded ticket exists but wasn't assigned yet). Assigned that ticket to Teknisi Andi
  via `POST /:id/assign` (F1). Created a **second, unassigned** ticket via
  `POST /tickets/intake` (a fresh customer's laptop) as a control. Re-fetched both
  sessions: **Technician's `/tickets` showed exactly the one assigned ticket** (not the
  second, unassigned one); **Manager's `/tickets` showed both tickets** — the definitive
  proof that the filter only narrows for a Technician and everyone else still sees
  everything.
- `npm run test:unit`: 137/137 unchanged. `npx tsc --noEmit` (API) and `npx svelte-check`
  (web) both clean (0 errors, 0 warnings, 696 files).
- DB reset to clean seed state afterward (`npm run db:reset`); both dev-server instances
  started for this check were stopped (a pre-existing stray instance on port 5173 from an
  earlier session was left untouched, per the same convention H14 recorded).

## Watch out
- Don't hardcode the role string in a way that breaks for custom roles — this is a UX filter,
  not a security boundary (the API already enforces tenant scope). Prefer keying off "is this
  the My Jobs entry" rather than a `roleName ===` check where practical. (Full permission-driven
  nav is Phase 5.9; here just make the filter honest.)
