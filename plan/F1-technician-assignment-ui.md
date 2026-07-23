# F1 — Technician assignment UI (wire the orphaned H8 endpoint)

> **Size:** S · **Layer:** FE · **Priority:** now
> **Goal:** Make `POST /v1/tickets/:id/assign` reachable from the ticket workspace so
> `assignedTechnicianId` actually gets set by a human.

## Problem (the dishonest flow)
H8 built `assignTechnician` (`modules/tickets/service.ts`) with tenant validation and a
reassignment note, and it is tested — but **no UI ever calls it**. So the assignee field
is always null, and every feature that depends on it (F2 "My Jobs", reassignment history,
the technician dashboard) is inert. The endpoint is orphaned.

## Files to touch (all frontend)
- `flowserv-web/src/routes/(app)/tickets/[id]/+page.server.ts` — also load the tenant's
  technician list (users with the Technician role) so the picker has options.
- `flowserv-web/src/lib/states/tickets/ticket.detail.svelte.ts` — add an `assign(technicianId)`
  method that POSTs to `/v1/tickets/:id/assign` (mint one `Idempotency-Key` per assign action,
  same pattern as `selectTransition`), then `invalidateAll()`.
- `flowserv-web/src/lib/components/tickets/TicketWorkspace.svelte` — add an assignee control
  (dropdown of technicians + current assignee shown). Reuse the search-as-you-type pattern
  already used for the customer picker if the list is long.

## Steps
1. In the `[id]` server load, fetch the technician list (see F-note below on where the list
   comes from — until a dedicated endpoint exists, filter `GET /v1/branches`/users by role,
   or add a small `GET /v1/users?role=Technician` — coordinate with 2A.1/Phase 5.10 if that
   endpoint lands first). Simplest interim: expose technicians via the existing users query
   the seed already creates.
2. Add `assign()` to the detail state; wire the control's `onchange`.
3. Show the current assignee name (the ticket detail already returns `assignedTechnician`).

## Verification (Definition of Done)
- Click-path walked (Playwright is now installed — extend `e2e/intake-to-close.spec.ts` or
  add a small spec): open a ticket, pick a technician, reload → assignee shows; a stage-history
  note "Ditugaskan ke X" appears. Reassign → "Dialihkan dari X ke Y".
- `npx svelte-check` clean.

## Watch out
- The assignee list must be **tenant-scoped** and only real users of this tenant (the backend
  already rejects a cross-tenant user id — don't rely on that alone, filter in the query).
- Do **not** invent a parallel `technicians` table — an assignee is a `users` row (H8 decision).
