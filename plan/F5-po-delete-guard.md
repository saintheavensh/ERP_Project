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

## Verification (Definition of Done)
- Recorded API run: create a draft PO → delete → 200. Receive a PO (→ partial/received) → delete
  → 409 `PO_NOT_DELETABLE`, stock unchanged. `GET /v1/inventory/reconciliation` clean throughout.
- Add a unit test for the guard decision if it's extracted to a pure function
  (`computeOrderStatus` / `order-status.ts` is the natural home).

## Watch out
- Check whether the frontend "delete PO" button is shown for non-draft POs; if so, hide/disable it
  so the 409 isn't a surprise.
