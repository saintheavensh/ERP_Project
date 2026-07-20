# H9 — Parts Consumption From a Ticket

> Completes the long-open task **3C.4**.
> Size: M · Risk: medium — touches stock, needs the same locking discipline as POS
> **Depends on:** [H7](./H7-ticket-charges.md)

## Goal

When a technician uses a part on a repair, stock actually decreases and the true cost is
recorded against the ticket.

## Why

FIFO deduction currently exists **only in POS checkout**. Nothing consumes parts from a
service ticket. So a repair that uses two capacitors either never leaves inventory, or gets
faked through a POS sale that misattributes the revenue.

This is INV-006 (MVP ✅) and the missing half of the service flow. It is also the last
structural blocker on 3E (end-to-end verification).

## Design

`pickFifoBatches` in `lib/fifo.ts` is already pure, already tested (6 tests), and already
used by POS. **Reuse it — do not write a second FIFO implementation.** The duplication that
`calculateWac` suffered from (three copies, one of them wrong) is exactly what to avoid.

Extract the shared consumption routine so POS and tickets share one code path:

```ts
// modules/inventory/service.ts
/**
 * Deducts `quantity` of an item from FIFO batches inside an existing transaction.
 * Locks the batch rows FOR UPDATE — without it two concurrent consumers can both
 * read the same quantityRemaining and oversell the last unit.
 * Returns the per-batch deductions so the caller can record true cost.
 */
export async function consumeStock(tx, params: {
  tenantId: string; branchId: string; inventoryItemId: string;
  partBrandId?: string | null; quantity: number;
  referenceType: 'pos_sale' | 'ticket_consumption';
  referenceId: string; serviceTicketId?: string;
}): Promise<{ deductions: BatchDeduction[]; totalCost: number; movementIds: string[] }>
```

Then **refactor POS checkout to call it**, so there is one implementation with one set of
tests. That refactor is the real deliverable here; the ticket endpoint is the easy part.

## Steps

1. Extract `consumeStock` from `pos/invoices.ts` into `modules/inventory/service.ts`.
2. Change POS checkout to use it. `npm test` must still pass unchanged — that is the proof
   the extraction was faithful.
3. Add `POST /v1/tickets/:id/charges/:chargeId/consume`:
   - load the charge, assert `status = 'approved'` (409 otherwise — you cannot consume an
     unapproved part)
   - call `consumeStock` with `referenceType: 'ticket_consumption'` and `serviceTicketId`
   - write back `unitCost` (weighted average of the consumed batches) and
     `stockMovementId`, set `status = 'consumed'`
   - all inside one `db.transaction`
4. Add `POST /v1/tickets/:id/charges/:chargeId/return` for a part removed after being
   fitted — restores the batch, records an `in` movement, sets status back to `approved`.
   Mirror the POS void guard: restored quantity may never exceed `quantityReceived`.
5. Frontend: a "Use part" button per approved part charge on the ticket detail page.

`stock_movements.serviceTicketId` already exists and is currently never written. This task
is what it was designed for.

## Verification

- [ ] `npm test` passes **unchanged** after the POS refactor (proves faithful extraction)
- [ ] Consuming a part from a ticket decrements `stock_batches.quantityRemaining` oldest-first
- [ ] It decrements `stock_levels.quantityAvailable` by the same amount
- [ ] A `stock_movements` row is created with `referenceType='ticket_consumption'` **and a
      populated `serviceTicketId`**
- [ ] `ticket_charges.unitCost` matches the actual consumed batch cost, including the case
      where consumption spans two batches at different prices
- [ ] Consuming more than available returns **422 `INSUFFICIENT_STOCK`** (not a 500)
- [ ] Consuming an `estimated` (unapproved) charge returns **409**
- [ ] Consuming the same charge twice returns **409** — not a double deduction
- [ ] Return restores the exact batch it came from
- [ ] Click-path: intake → add part charge → approve → consume → inventory count dropped

## Watch out

- **Idempotency.** A technician double-tapping "Use part" on shop WiFi must not deduct
  twice. The `status = 'consumed'` check inside the locked transaction is the guard —
  test it with two concurrent requests, not two sequential ones.
- Use `.for('update')` on the batch select, exactly as POS does. This is the same
  lost-update shape as 3.5B.2.
- The split-batch case is the one that finds bugs: consume 8 units where batch A has 5 and
  batch B has 5. Expect two movement rows and a blended `unitCost`.
- Do **not** post to the finance ledger here. That is [H11](./H11-finance-ledger.md),
  driven by events.
