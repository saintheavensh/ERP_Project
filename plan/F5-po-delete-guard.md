# F5 — Guard PO delete against received/completed status

> **Size:** S · **Layer:** BE · **Priority:** now
> **Goal:** Stop `DELETE /v1/purchasing/orders/:id` from deleting a PO that already moved stock.

## Problem (data-integrity risk)
`routes/purchasing/orders.ts` (around the delete handler, ~line 168) has its **status guard
commented out** and hand-rolls a `stock_levels` decrement when deleting. If this path is hit on a
`received`/`completed`/`partial` PO in real use, it can corrupt stock and leave dangling AP.
This is a dev-mode shortcut that must not survive into Phase 10 (real shop data).

## Files to touch
- `flowserv-api/src/routes/purchasing/orders.ts` — the delete handler.

## Steps
1. Re-enable the guard: only a PO in `draft` (no goods received, no batches created) may be deleted.
2. For any PO in `partial`/`received`/`completed`, return **409 `PO_NOT_DELETABLE`** with a message
   pointing the user at the returns flow instead (returns are a future task — for now, block).
3. Remove the hand-rolled stock decrement — a deletable draft PO has no stock to roll back.

## Verification (Definition of Done) — DONE 2026-07-23
- New pure `canDeletePurchaseOrder(status)` in `order-status.ts` (draft-only), alongside
  the existing `computeOrderStatus` — 5 new unit tests. The delete handler now throws
  `BusinessError('PO_NOT_DELETABLE', ..., 409)` instead of the commented-out guard, and
  the entire hand-rolled stock-rollback block (dead-code query included — it fetched
  `stockBatches.findMany({})` with an empty filter and never used the result) was deleted:
  a draft PO is, by construction, one nothing has ever been received against (`receipts.ts`
  calls `computeOrderStatus` after every receipt, so status only stays `'draft'` while every
  line's `receivedQuantity` is still 0), so there is nothing to unwind.
- FE: `OrderHeader.svelte`'s "Delete PO" button now only renders when `status === 'draft'`
  (a disabled-looking "Delete unavailable (status)" label otherwise); the page's `deleteOrder()`
  dropped the stale "dev-mode rollback" warning text (that behavior no longer exists) and now
  surfaces the server's real error message on failure instead of a generic one.
- **Live API run** (real login, curl, freshly reset DB): deleting the seeded `ordered` PO → 409
  `PO_NOT_DELETABLE` ("already been sent to the supplier..."); deleting the seeded `completed`
  PO → 409 ("goods have already been received..." — the two statuses get different wording so
  the message is never inaccurate). Created a fresh draft PO → deleted it → 200 → a follow-up
  GET → 404. `GET /v1/inventory/reconciliation` stayed `{isClean: true, drift: []}` before and
  after every step.
- `npm run test:unit`: 170/170 (+5). `npx tsc --noEmit` (API) and `npx svelte-check` (web, 698
  files) both clean.
- DB reset to clean seed state afterward; the dev server instance started for this check was
  stopped.

## Watch out
- The frontend "delete PO" button is now hidden for any non-draft status (see above) — the 409
  is a defensive fallback, not the normal path a user hits.
