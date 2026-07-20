# Task 04 — Fix Goods Receiving (Partial Receipts)

**Depends on:** task 01 (for the test setup)
**Risk:** Medium — touches stock quantities
**PHASES.md tasks:** 3.5A.3, 3.5A.4, 3.5A.5
**Branch:** `phase-3.5/stabilization`

---

## Background

Three separate bugs live in one function:
`flowserv-api/src/routes/purchasing/receipts.ts`, the
`POST /v1/purchasing/orders/:id/receive` handler.

Fix them together — they overlap, and fixing one at a time means rewriting the same
loop three times.

### BUG-03 — partial receipts are recorded as complete

The loop carefully tracks whether everything arrived:

```ts
let allReceived = true;
...
if (line.receivedQuantity < line.quantity) allReceived = false;
```

...and then **never uses the variable**. At the end it unconditionally does:

```ts
.set({ status: 'received' })
```

So ordering 10 units and receiving 3 marks the PO fully received. The remaining 7
are invisible — nobody knows they are still owed.

### BUG-04 — received quantity overwrites instead of accumulating

```ts
.set({ receivedQuantity: lineTotalReceived })
```

This **replaces** the value. Receive 3 today and 7 tomorrow, and the line reads 7,
not 10. Combined with BUG-03 the stock record silently disagrees with the batches.

### BUG-05 — no ownership check on the line

`lineInput.lineId` comes from the request body and the line is updated by that id
alone. Nothing verifies the line belongs to this purchase order, this tenant, or
even this branch. A crafted request could modify another tenant's order line.

---

## Goal

Partial receiving works correctly and repeatedly, and line updates are scoped to the
order and tenant.

---

## Files to change

| File | Action |
|---|---|
| `flowserv-api/src/routes/purchasing/receipts.ts` | fix all three bugs |
| `flowserv-api/src/routes/purchasing/__tests__/receive.test.ts` | create (pure quantity logic) |

---

## Step 1 — Scope the line lookup (BUG-05)

Before updating a line, fetch it and confirm it belongs to this order:

```ts
const [line] = await tx.select()
  .from(purchaseOrderLines)
  .where(and(
    eq(purchaseOrderLines.id, lineInput.lineId),
    eq(purchaseOrderLines.purchaseOrderId, orderId)   // <-- the ownership check
  ));

if (!line) {
  throw new Error(`Line ${lineInput.lineId} does not belong to order ${orderId}`);
}
```

The order itself is already tenant-scoped at the top of the handler, so tying the
line to the order is sufficient.

---

## Step 2 — Accumulate, don't overwrite (BUG-04)

```ts
const newReceivedTotal = line.receivedQuantity + lineTotalReceived;

await tx.update(purchaseOrderLines)
  .set({ receivedQuantity: newReceivedTotal })
  .where(eq(purchaseOrderLines.id, line.id));
```

Also reject over-receiving — receiving more than was ordered is a business-rule
violation, not a server error:

```ts
if (newReceivedTotal > line.quantity) {
  throw new BusinessError(
    'OVER_RECEIPT',
    `Cannot receive ${newReceivedTotal} of ${line.quantity} ordered`,
    422
  );
}
```

> `BusinessError` does not exist yet — it is created in task 05. Until then throw a
> plain `Error` with a clear message and leave a `// TODO: BusinessError (task 05)`
> comment. Do not build the class here.

---

## Step 3 — Use the status flag (BUG-03)

Compute completeness from the **accumulated** totals, not from this request alone:

```ts
// Re-read all lines after the updates so the status reflects the true total,
// not just what arrived in this delivery.
const allLines = await tx.select()
  .from(purchaseOrderLines)
  .where(eq(purchaseOrderLines.purchaseOrderId, orderId));

const fullyReceived = allLines.every(l => l.receivedQuantity >= l.quantity);
const anyReceived  = allLines.some(l => l.receivedQuantity > 0);

const newStatus = fullyReceived ? 'received' : anyReceived ? 'partial' : order.status;

await tx.update(purchaseOrders)
  .set({ status: newStatus })
  .where(eq(purchaseOrders.id, orderId));
```

**Check first** whether `'partial'` is an accepted value for `purchaseOrders.status`.
Look at the column definition in `flowserv-api/src/db/schema/inventory.ts` and at how
the frontend renders status (`flowserv-web/src/lib/components/purchasing/`). If the
UI has a hardcoded list of statuses, add `partial` to it and give it a badge colour.

Also remove the guard that currently blocks re-receiving:

```ts
if (order.status === 'received' || order.status === 'completed') throw new Error('Order is already received');
```

This must still block `received` and `completed`, but must **allow** `partial` —
otherwise a second delivery can never be recorded, which is the whole point of the fix.

---

## Step 4 — Test the quantity logic

The database work is hard to unit test, but the **decision** is easy. Extract it:

```ts
export function computeOrderStatus(
  lines: { quantity: number; receivedQuantity: number }[]
): 'pending' | 'partial' | 'received' {
  if (lines.every(l => l.receivedQuantity >= l.quantity)) return 'received';
  if (lines.some(l => l.receivedQuantity > 0)) return 'partial';
  return 'pending';
}
```

Test: nothing received → `pending`; some received → `partial`; all received →
`received`; over-received → `received`.

---

## How to verify (evidence required)

Needs a purchase order with a line for **10 units**.

**Step 1 — receive 3:**
```bash
curl -X POST http://localhost:3001/v1/purchasing/orders/<ORDER_ID>/receive \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"lines":[{"lineId":"<LINE_ID>","receivedQuantity":3}]}'
```
Expect: order status `partial`, line `receivedQuantity` = **3**.

**Step 2 — receive 7 more:**
```bash
curl -X POST http://localhost:3001/v1/purchasing/orders/<ORDER_ID>/receive \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"lines":[{"lineId":"<LINE_ID>","receivedQuantity":7}]}'
```
Expect: order status `received`, line `receivedQuantity` = **10**.

**Today this sequence produces `received` after step 1, and `receivedQuantity` = 7
after step 2. Both wrong.**

**Evidence:** both responses, plus a query showing the final line state. Confirm two
separate stock batches exist (3 and 7) — FIFO correctness depends on that.

---

## Do NOT do

- **Do not** rewrite the FIFO or batch-splitting logic. It is correct.
- **Do not** merge the two goods-receipt paths here — that is task 05 (BUG-09).
- **Do not** build the `BusinessError` class — task 05.
- **Do not** change the `purchasing/invoices.ts` costing flow.

---

## When done

Mark in `PHASES.md`: `3.5A.3`, `3.5A.4`, `3.5A.5` as `[x]`.

Commit: `fix(purchasing): support partial goods receipt and scope line updates`
