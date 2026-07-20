# Task 05 — Data Integrity: Locking, Error Codes, Ticket Closure

**Depends on:** tasks 01, 03, 04
**Risk:** Medium
**PHASES.md tasks:** 3.5B.1 – 3.5B.5, 3.5C.4, 3.5C.5
**Branch:** `phase-3.5/stabilization`

---

## Background

Five defects, grouped because they all concern data correctness. This is the largest
task in the phase — it is fine to commit each part separately.

---

## Part A — `BusinessError` class (do this first)

`specification/coding-guidelines.md` §8 requires it and it does not exist. Because of
that, **every error in the system is a 400 or a 500** — 409 and 422 are never
returned, though §3.3 requires them.

Create `flowserv-api/src/lib/errors.ts`:

```ts
export class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 422,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}
```

Then teach `flowserv-api/src/middleware/error-handler.ts` about it — check
`err instanceof BusinessError` **before** the generic `err.status` branch, and use
its `code`, `message`, and `statusCode`.

Replace the plain `throw new Error(...)` calls in the modules touched by this task
and task 04 with `BusinessError`. Leave untouched modules alone.

---

## Part B — BUG-07: stock can be oversold

`flowserv-api/src/routes/pos/invoices.ts`, the FIFO deduction loop, reads batches:

```ts
const availableBatches = await tx.query.stockBatches.findMany({
  where: and(...batchFilters),
  orderBy: [asc(stockBatches.receivedAt)]
});
```

...then updates them. Between the read and the write, another transaction can read
the same rows. Two cashiers selling the last item at the same time will both succeed,
and stock goes negative.

**Fix:** lock the rows as they are read, inside the transaction, with `FOR UPDATE`.
Drizzle exposes this via `.for('update')` on a `select()` query. The relational
`query.findMany` API may not support it — if so, rewrite that read as `tx.select()`.

Apply the same fix to:
- `routes/purchasing/receipts.ts` (batch/level reads)
- `routes/opname.ts` (same pattern)

Also fix the negative-stock fallback in the same file. When no `stockLevels` row
exists it currently inserts one with a **negative** quantity:

```ts
await tx.insert(stockLevels).values({ ..., quantityAvailable: -item.quantity });
```

Selling stock that was never received should fail loudly, not create a negative row.
Throw `BusinessError('INSUFFICIENT_STOCK', ..., 422)`.

---

## Part C — BUG-08: POS errors are swallowed

Same file, the checkout `catch`:

```ts
} catch (error: any) {
  return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan saat memproses POS', undefined, 500);
}
```

The real error is discarded and never logged. "Not enough stock" — a **422** business
rule — reaches the cashier as an opaque 500, and there is nothing in the console to
diagnose it.

**Fix:**

```ts
} catch (error) {
  if (error instanceof BusinessError) {
    return errorResponse(c, error.code, error.message, error.details, error.statusCode);
  }
  console.error('POS checkout failed:', error);
  return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Failed to process transaction', undefined, 500);
}
```

And make the insufficient-stock throw a `BusinessError`:

```ts
if (qtyToDeduct > 0) {
  throw new BusinessError('INSUFFICIENT_STOCK', `Not enough stock for item ${item.inventoryItemId}`, 422);
}
```

> **Language:** error strings are currently a mix of Indonesian and English. Pick one
> for user-facing messages and be consistent within each file you touch. Indonesian
> is reasonable given the users — just don't mix.

---

## Part D — BUG-06: tickets never close

`routes/tickets.ts` sets `currentNodeId` on transition but never `status` or
`closedAt`. A ticket stays `open` forever, so Phase 3E can never pass.

**How to detect the end:** a terminal node has **no outgoing transitions**. In the
seeded "Standard Repair" flow, `Completion` is the only such node. Do not hardcode
the name — query `flowTransitions` for rows where `fromNodeId` is the target node; if
there are none, it is terminal.

```ts
const outgoing = await tx.select().from(flowTransitions)
  .where(eq(flowTransitions.fromNodeId, targetNodeId));

if (outgoing.length === 0) {
  await tx.update(serviceTickets)
    .set({ status: 'closed', closedAt: new Date() })
    .where(eq(serviceTickets.id, ticketId));
}
```

Confirm `closedAt` exists on `serviceTickets` in
`flowserv-api/src/db/schema/tickets.ts`. If it does not, add it and run
`npx drizzle-kit push`.

---

## Part E — BUG-10: void can over-restore stock

`DELETE /v1/pos/invoices/:id` restores quantity to batches with no upper bound. If a
batch was partly consumed by another sale after this one, restoring can push
`quantityRemaining` above `quantityReceived` — inventing stock.

**Fix:** clamp the restore, and fail loudly if it would exceed the original:

```ts
const restored = batch.quantityRemaining + Math.abs(mov.quantity);
if (restored > batch.quantityReceived) {
  throw new BusinessError('VOID_CONFLICT',
    `Cannot void: batch ${batch.id} would exceed its received quantity`, 409);
}
```

Also add the missing guard against double-voiding via `stockMovements` — the current
check only looks at `paymentStatus`.

---

## Part F — BUG-09: two goods-receipt paths

Two endpoints create stock batches with **different costing behaviour**:

- `POST /v1/inventory/:id/receive` — manual; **skips** WAC recalculation and pricing
- `POST /v1/purchasing/orders/:id/receive` — via PO; feeds into the invoice/costing step

So the same item costed differently depending on which door it came through.

**Decide and record the decision in the commit message.** Recommended: keep both, but
make the manual path recalculate WAC the same way the invoice path does — extract that
calculation into a shared helper so there is exactly one implementation. The manual
path is genuinely useful for opening stock.

If the manual path is not used in practice, delete it instead. Do not leave two
different behaviours.

---

## Part G — Tests

- **FIFO batch splitting** (3.5C.4): given batches of 5 @ 10k and 5 @ 12k, consuming 7
  takes 5 from the first and 2 from the second, in that order. Extract the batch-picking
  logic into a pure function that takes a list of batches and a quantity, and returns
  the deductions.
- **Stock arithmetic** (3.5C.5): receive 10 → sell 3 → void → back to 10.
- **`computeOrderStatus`** from task 04, if not already covered.

---

## How to verify (evidence required)

1. `npm test` passes with the new FIFO and stock tests.
2. **Insufficient stock returns 422**, not 500: attempt to sell more than available.
   Show the response — it must have code `INSUFFICIENT_STOCK`.
3. **A ticket closes**: transition one to `Completion`, then `GET /v1/tickets/:id` and
   show `status: "closed"` with a non-null `closedAt`.
4. **Row locking** cannot be unit tested. Verify manually if you can (two simultaneous
   checkouts of the last item — one should fail with 422), or record in `PHASES.md`
   that it is code-reviewed but not load-tested, and mark 3.5B.2 `[/]` rather than
   `[x]`. Being honest here is the point of the Definition of Done.

---

## Do NOT do

- **Do not** build the finance ledger. Tempting while in this file — it is Phase 4.5A.
- **Do not** add RBAC middleware — Phase 4.5B.
- **Do not** refactor unrelated modules to use `BusinessError`. Only the files this
  task touches.
- **Do not** delete the `posTransactions` / `invoiceLines` dead schema — Phase 4.5A.4.

---

## When done

Mark in `PHASES.md`: `3.5B.1`–`3.5B.5`, `3.5C.4`, `3.5C.5`. Use `[/]` for anything
without evidence.

Suggested commits:
- `feat(lib): add BusinessError and wire to error handler`
- `fix(pos): lock stock batches during checkout and return 422 on insufficient stock`
- `fix(tickets): close ticket when entering a terminal node`
- `fix(pos): guard void against over-restoring batch quantity`
- `refactor(inventory): share WAC calculation between receipt paths`
