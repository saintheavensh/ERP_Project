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

## Verification (Definition of Done) — DONE 2026-07-23
- Discovered while implementing: the intake form/state had **no `assetId` field at all** —
  the device section only ever created a brand-new asset (`assetType`/`assetBrand`/
  `assetModel`/`assetSn`). The backend's `intakeSchema` already accepted an optional
  `assetId` and skips asset-creation when it's present, so this was a frontend gap, not
  a backend one — added `assetId` to `TicketIntakeState.form` and a read-only "Existing
  device selected" summary block in `IntakeForm.svelte` (mirrors the existing read-only
  customer-field pattern) instead of the editable create-new inputs.
- `routes/(app)/tickets/intake/+page.server.ts` now reads `?customerId=&assetId=` and
  resolves them server-side via `GET /v1/customers/:id` (tenant-scoped by the API) and
  `GET /v1/customers/:id/assets`, checking the asset actually belongs to that customer —
  a stale/foreign `assetId` is silently dropped (falls back to the customer-only prefill,
  which itself falls back to a fully blank form if the customer id is also stale/missing).
  No id is ever trusted directly into the submitted intake payload.
- Customer detail page's "Create Ticket" button changed from a bare `<button>` with no
  `href`/`onclick` to a real `<a href="/tickets/intake?customerId=...&assetId=...">`.
- **Real Playwright click-path** (`e2e/f7-create-ticket-from-device.spec.ts`, new — headless
  Chromium against a freshly reset dev DB, both dev servers running): logged in → opened
  seeded customer "Budi Santoso" → clicked "Create Ticket" on his Samsung Galaxy A10 →
  landed on `/tickets/intake?customerId=...&assetId=...` → confirmed both "Existing customer
  selected" and "Existing device selected" render, `#name` is pre-filled `Budi Santoso` (not
  blank) → picked a flow, submitted with the device section having nothing to fill in →
  landed on the new ticket's workspace showing "Budi Santoso". Zero uncaught page errors.
  Screenshots in `test-results/f7-create-ticket-from-device/`. Re-ran the pre-existing
  `intake-to-close.spec.ts` (the from-scratch, no-query-params path) — still passes
  unchanged, confirming F7 didn't regress it.
- `npm run test:unit`: 170/170 unchanged (this task is pure FE wiring + a validated
  server load, no new pure logic). `npx tsc --noEmit` (API) and `npx svelte-check` (web,
  698 files) both clean.
- DB reset to clean seed state afterward; both dev server instances started for this
  check were stopped.

## Watch out
- Validate the query params server-side (the customer/asset must belong to the tenant) — done:
  `resolvePrefill()` in `+page.server.ts` re-fetches both from the API rather than trusting the
  URL, and a stale/foreign id degrades gracefully (blank prefill) instead of erroring.
