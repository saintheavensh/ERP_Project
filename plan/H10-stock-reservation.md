# H10 — Stock Reservation

> Completes the long-open task **3C.3**.
> Size: M · Risk: 🟠 R4 · **Depends on:** [H4](./H4-constraints.md), [H7](./H7-ticket-charges.md), [H9](./H9-ticket-parts-consumption.md)

## Goal

A part promised to a repair cannot be sold to someone else.

## Why

`stock_levels.quantityReserved` exists and is **only ever written as the literal `0`**.
Every availability check reads `quantityAvailable` alone.

The real-world failure this permits: a technician reserves the last LCD for ticket A; ten
minutes later the POS sells that same LCD to a walk-in customer, because nothing ever
decremented an available count. The customer for ticket A is now waiting on a part that
left the building.

This is the most common operational failure in a combined service + retail shop, and it is
precisely what SVC-008 and PUR-005 exist to prevent.

## Design

Define the two quantities unambiguously and write the definition down, because "available"
is where these systems usually go wrong:

```
quantityAvailable  = physically present in the branch  (= SUM of batch remainders)
quantityReserved   = physically present but promised to a ticket
sellable           = quantityAvailable - quantityReserved   ← what POS must check
```

Reservation **does not** move stock. It does not touch batches and creates no `out`
movement. It is a claim on stock that is still physically there. That distinction is the
whole design — get it wrong and reservations start double-counting against consumption.

Lifecycle, mapped onto `ticket_charges.status` from H7:

```
charge approved   → reserve    (quantityReserved += qty)
charge consumed   → release + deduct  (reserved -= qty, available -= qty, batch deducted)
charge cancelled  → release    (quantityReserved -= qty)
```

The release-on-consume is the subtle part: consumption must decrement **both** counters, or
the reservation leaks and the item looks permanently short.

## Steps

1. `modules/inventory/service.ts`:
   - `reserveStock(tx, { tenantId, branchId, itemId, quantity })` — fails **422
     `INSUFFICIENT_SELLABLE`** if `available - reserved < quantity`
   - `releaseReservation(tx, ...)` — never lets `quantityReserved` go below zero
2. Record both as `stock_movements` rows using the existing `reserve` / `release` movement
   types — they are already declared in the enum and never used. The ledger stays
   append-only and auditable.
3. Wire into the H7 charge lifecycle: reserve on approve, release on cancel, release +
   deduct on consume (inside H9's single transaction).
4. **Make POS respect it.** In `pos/invoices.ts`, the sellable check becomes
   `quantityAvailable - quantityReserved`. This is the line that actually prevents the
   double-sale, and it is easy to forget.
5. Frontend: show "5 available (2 reserved)" on inventory and POS product tiles. Staff need
   to see *why* something is not sellable, or they will assume the system is broken.

## Verification

- [ ] Approving a part charge increments `quantityReserved`; `quantityAvailable` is unchanged
- [ ] **The core test:** item has 1 unit; reserve it for a ticket; POS checkout for that
      item returns **422**, not a successful sale
- [ ] Consuming the charge decrements **both** `quantityReserved` and `quantityAvailable`
- [ ] Cancelling a charge releases the reservation and POS can sell again
- [ ] `quantityReserved` can never go negative (guard + test)
- [ ] Reserving more than sellable returns 422 with a clear message
- [ ] Reconciliation from [H4](./H4-constraints.md) still reports zero drift after a full
      reserve → consume cycle
- [ ] Click-path: reserve the last unit on a ticket, try to sell it in POS, see it blocked
- [ ] `npm test` passing with new reservation tests

## Watch out

- **The leak.** If consume releases the reservation but forgets to deduct available (or the
  reverse), stock drifts silently and the reconciliation check from H4 is what catches it.
  Run reconciliation as part of the test, not just manually.
- Reservations need an eventual expiry — a ticket abandoned for six months should not hold
  a part forever. Do **not** build expiry now; note it as a follow-up and make sure
  cancelling a ticket releases its reservations (which H-track cancellation work will need).
- Do not add reservation to purchase orders in this task. PUR-005 ("reservation from PO")
  is about incoming stock and is a different mechanism.
- All arithmetic goes inside the same locked transaction as the status change. A
  reservation written outside the charge's transaction can be orphaned by a rollback.
