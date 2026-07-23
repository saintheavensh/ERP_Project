# F7 — Wire the dead "Create Ticket" button on customer detail

> **Size:** S · **Layer:** FE · **Priority:** now
> **Goal:** The per-device "Create Ticket" button on the customer detail page should start intake
> with the customer + device pre-filled.

## Problem (broken flow)
`flowserv-web/src/routes/(app)/customers/[id]/+page.svelte` (~line 52) renders a "Create Ticket"
button per asset with **no `href` and no `onclick`** — a dead affordance. There is no path from a
customer's device to intake, even though intake (`POST /v1/tickets/intake`) exists and works.

## Files to touch
- `flowserv-web/src/routes/(app)/customers/[id]/+page.svelte` — give the button a real action.
- `flowserv-web/src/routes/(app)/tickets/intake/+page.svelte` + its state
  (`ticket.intake.svelte.ts`) — accept optional `?customerId=` and `?assetId=` query params and
  pre-select them.

## Steps
1. Make the button navigate to `/tickets/intake?customerId=<id>&assetId=<assetId>`.
2. In the intake page load/state, if those params are present, pre-fill the customer picker and
   device selection (the intake form already has a customer search — just seed its selection).
3. Confirm intake still works for the from-scratch path (no params) unchanged.

## Verification (Definition of Done)
- Click-path walked: open a customer, click "Create Ticket" on a device → intake opens with that
  customer + device already selected → submit → ticket created linked to both.
- `npx svelte-check` clean.

## Watch out
- Validate the query params server-side (the customer/asset must belong to the tenant) — don't
  trust them blindly; intake already enforces tenant scope, but the pre-fill should fail gracefully
  if the ids are stale.
