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

## Verification (Definition of Done) — DONE 2026-07-23
- Added `GET /v1/users?role=<name>` (`routes/users.ts`, mounted in `app.ts`) — no such
  endpoint existed at all, so the technician picker had nothing to read from.
  Auth-only (matches `GET /v1/branches`'s pattern — a lookup list, not a mutation),
  tenant-scoped via a join through `user_role_assignments`/`roles`.
- `tickets/[id]/+page.server.ts` fetches technicians in parallel with charges/inventory;
  `ticket.detail.svelte.ts` gained `assignedTechnician`/`technicians` getters and an
  `assign(technicianId)` method (idempotency key minted per call, `invalidateAll()` on success);
  `TicketWorkspace.svelte` gained an "Assigned Technician" card with a picker (hidden once
  the ticket is closed/cancelled — shows the name as plain text instead).
- **Live API run** (seeded ticket, then DB reset back to clean state):
  `GET /v1/users?role=Technician` → exactly "Teknisi Andi"; unfiltered → all 4 tenant users.
  Assigned the seeded open ticket to Teknisi Andi → `GET /:id` showed
  `assignedTechnician: {id, name: "Teknisi Andi"}` and a new history note
  "Ditugaskan ke Teknisi Andi". Reassigned to Budi Manager → history's newest entry
  read "Dialihkan dari Teknisi Andi ke Budi Manager", exactly per `describeAssignment()`.
  `npm run db:reset` afterward confirmed the ticket back to `assignedTechnicianId: null`.
- `npx tsc --noEmit` (API): clean. `npx svelte-check` (web): 0 errors, 0 warnings (696
  files) — verified the check itself catches real errors (injected a deliberate type
  error, confirmed it was reported, then reverted and re-ran clean).
- `npm run test:unit`: 137/137 passing, unchanged.
- **Not done this session:** a literal Playwright click-through of the picker (the
  existing `e2e/intake-to-close.spec.ts` walks transitions only). The live API run above
  covers every backend behavior the picker calls; the UI code itself was reviewed but not
  browser-driven. Substituted per the same pattern H7–H14 used for this exact gap.

## Watch out
- The assignee list must be **tenant-scoped** and only real users of this tenant (the backend
  already rejects a cross-tenant user id — don't rely on that alone, filter in the query).
- Do **not** invent a parallel `technicians` table — an assignee is a `users` row (H8 decision).
