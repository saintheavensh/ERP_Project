# H5 — Money Precision and Invoice Numbering

> Size: M · Risk: low, but the numbering bug is a live production hazard

## Goal

One money type everywhere, and invoice numbers that cannot collide.

## Part 1 — Standardise money on `decimal(14, 2)`

Three different money types are currently in use:

| Columns | Type |
|---|---|
| most money columns | `decimal(14, 2)` ✅ |
| `pos_invoice_lines.unitPrice`, `.subtotal` | `decimal(12, 2)` |
| `pos_invoices.subtotal`, `.discountAmount`, `.taxAmount`, `.grandTotal` | **`numeric`** — no precision at all |

Unbounded `numeric` accepts arbitrary scale, so a computed value like `1666666.666666`
stores in full and then disagrees with the `decimal(12,2)` lines that sum into it. The
header and its own lines can report different totals for the same sale.

Add a helper so this cannot drift again:

```ts
// src/db/schema/columns.ts
import { decimal } from 'drizzle-orm/pg-core';
/** All monetary values use one precision. IDR needs the range; scale 2 covers cents. */
export const money = (name: string) => decimal(name, { precision: 14, scale: 2 });
```

Replace every money column with `money('...')`. Then `generate` → inspect → `migrate`.
Widening `decimal(12,2)` → `decimal(14,2)` is lossless. `numeric` → `decimal(14,2)` will
round anything beyond 2 decimal places — check first:

```sql
SELECT id, subtotal, grand_total FROM pos_invoices
WHERE scale(subtotal) > 2 OR scale(grand_total) > 2;
```

Expect zero rows with only 5 invoices, but confirm.

### Money in application code

Totals are computed in JS floats (`pos/invoices.ts:89-94`) and stringified on insert. For
IDR whole-rupiah amounts this is safe well past any realistic transaction, so it is **not**
urgent. But once H6 adds percentage-based margin and tax, rounding will start to matter.

Do not introduce a decimal library in this task. Instead add `lib/money.ts` with explicit
round-to-2 helpers and use them wherever a computed value is written, so there is one place
to change later:

```ts
export const roundMoney = (n: number): number => Math.round(n * 100) / 100;
export const toMoneyString = (n: number): string => roundMoney(n).toFixed(2);
```

## Part 2 — Fix invoice numbering

```ts
// pos/invoices.ts:102-104  — current
const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;
```

Two defects:

**Collisions.** `invoiceNumber` is `.notNull().unique()`. Four random digits give 10,000
slots per day. By the birthday bound, a shop issuing ~118 invoices in a day has roughly a
**50% chance** of at least one collision — surfacing as an unhandled unique-violation and
an HTTP 500 at the till, mid-sale, with the customer waiting.

**The constraint is global, not per-tenant.** Two tenants on the same database collide with
each other, and tenant A can infer tenant B's sales volume from the gaps.

### Fix

Use a per-tenant, per-day counter allocated inside the existing checkout transaction:

```ts
// Allocate the next sequence number for this tenant and day. Runs inside the
// checkout transaction, so the row lock serialises concurrent checkouts and two
// sales can never receive the same number.
const [seq] = await tx.execute(sql`
  INSERT INTO invoice_sequences (tenant_id, date_key, last_number)
  VALUES (${tenantId}, ${dateStr}, 1)
  ON CONFLICT (tenant_id, date_key)
  DO UPDATE SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number
`);
const invoiceNumber = `INV-${dateStr}-${String(seq.last_number).padStart(4, '0')}`;
```

New table:

```ts
export const invoiceSequences = pgTable('invoice_sequences', {
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  dateKey: varchar('date_key', { length: 8 }).notNull(), // YYYYMMDD
  lastNumber: integer('last_number').notNull().default(0),
}, (t) => ({ pk: primaryKey({ columns: [t.tenantId, t.dateKey] }) }));
```

Change the unique constraint to `unique(tenantId, invoiceNumber)`.

`ON CONFLICT DO UPDATE ... RETURNING` is atomic — no read-then-write race, so this needs no
extra locking.

## Verification

- [ ] Every money column is `numeric(14,2)` in `information_schema.columns`
- [ ] No existing money value changed (compare the 5 invoice totals before and after)
- [ ] `invoice_sequences` exists; `pos_invoices` unique constraint is `(tenant_id, invoice_number)`
- [ ] Three sequential checkouts produce `INV-YYYYMMDD-0001`, `-0002`, `-0003`
- [ ] A checkout on a new day restarts at `-0001`
- [ ] **Concurrency check:** fire 10 simultaneous checkouts (`curl` in a loop with `&`);
      all 10 succeed with 10 distinct numbers and no 500s
- [ ] `npm test` passing, plus a unit test for `roundMoney`

## Watch out

- The concurrency check is the point of this task. A sequential test proves nothing — the
  bug being fixed is a race.
- Do not use a plain Postgres `SEQUENCE`: it is global, not per-tenant, and it leaks the
  same volume information the current scheme does.
- Deliberate design note: sequence gaps are fine. A rolled-back transaction burns a number,
  which is normal and preferable to reusing one.
