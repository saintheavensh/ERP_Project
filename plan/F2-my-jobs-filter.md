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

## Verification (Definition of Done)
- Recorded API/UI check: log in as the seeded Technician ("Teknisi Andi"), assign one ticket
  to them (via F1), open `/tickets` → only that ticket shows. Log in as Manager → all show.
- `npx svelte-check` clean.

## Watch out
- Don't hardcode the role string in a way that breaks for custom roles — this is a UX filter,
  not a security boundary (the API already enforces tenant scope). Prefer keying off "is this
  the My Jobs entry" rather than a `roleName ===` check where practical. (Full permission-driven
  nav is Phase 5.9; here just make the filter honest.)
