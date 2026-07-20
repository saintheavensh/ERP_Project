# Task 06 — Supplier Debt Payment Endpoint

**Depends on:** task 05 (uses `BusinessError`)
**Risk:** Low — new code, nothing existing changes
**PHASES.md tasks:** 3.5B.6 (and completes 4A.3)
**Branch:** `phase-3.5/stabilization`

---

## Background

Supplier debt (*hutang*) can be created but **never paid**.

`POST /v1/purchasing/orders/:id/invoice` creates a `supplierInvoices` row when the
payment method is `tempo`, with `amountPaid: '0'` and `status: 'pending'`. The
payables page (`GET /v1/finance/payables`) lists them.

But no endpoint ever updates `amountPaid`. It stays `'0'` forever. There is no way to
record that you paid a supplier, so the payables list only ever grows — it is a
write-only ledger of debt.

This is why `PHASES.md` task 4A.3 is marked `[/]` rather than `[x]`.

---

## Goal

Record full and partial payments against a supplier invoice, and update its status
automatically.

**This is the only task in Phase 3.5 that adds a new feature.** Because it is new
code with no legacy shape to preserve, build it the way
`specification/coding-guidelines.md` §6 requires — with a real service layer. It
becomes the reference example for the incremental refactor described in
`RECOVERY-PLAN.md` decision D1.

---

## Files to change

| File | Action |
|---|---|
| `flowserv-api/src/db/schema/finance.ts` | add a `supplier_payments` table |
| `flowserv-api/src/modules/finance/service.ts` | create — business logic |
| `flowserv-api/src/modules/finance/types.ts` | create — Zod schemas |
| `flowserv-api/src/routes/finance.ts` | add the route, delegate to the service |
| `flowserv-api/src/modules/finance/__tests__/service.test.ts` | create |
| `flowserv-web/src/lib/components/finance/PayablesTable.svelte` | add a Pay button |
| `flowserv-web/src/lib/states/finance/payables.svelte.ts` | wire the call |

> Note the new `modules/` folder. Do **not** move existing modules into it — only
> this new one. See the scope guard in `IMPLEMENTATION-PLAN.md`.

---

## Step 1 — Schema

A payment is its own record, not just a number on the invoice. You need the history:
who paid, when, how much, by what method.

Add to `flowserv-api/src/db/schema/finance.ts`:

```ts
export const supplierPayments = pgTable('supplier_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  supplierInvoiceId: uuid('supplier_invoice_id').notNull().references(() => supplierInvoices.id),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // cash | transfer
  paidAt: timestamp('paid_at').notNull().defaultNow(),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
}, (table) => ({
  invoiceIdx: index('supplier_payments_invoice_idx').on(table.supplierInvoiceId),
}));
```

`supplierInvoices` lives in the inventory schema file — check where it is actually
defined and import it correctly. Add the relation for the Drizzle relational API too.

Then run `npx drizzle-kit push`.

---

## Step 2 — Service layer (the important part)

Create `flowserv-api/src/modules/finance/service.ts`. Keep the **decision** separate
from the **database**, exactly as task 01 did for the flow engine:

```ts
export type PaymentDecision =
  | { ok: true; newAmountPaid: number; newStatus: 'partial' | 'paid' }
  | { ok: false; code: string; reason: string };

/**
 * Pure — no database. Decides whether a payment is valid and what the
 * invoice's new state should be. This is what the tests exercise.
 */
export function applyPayment(
  invoice: { totalAmount: number; amountPaid: number; status: string },
  paymentAmount: number
): PaymentDecision {
  if (invoice.status === 'paid') {
    return { ok: false, code: 'ALREADY_PAID', reason: 'This invoice is already fully paid.' };
  }
  if (paymentAmount <= 0) {
    return { ok: false, code: 'INVALID_AMOUNT', reason: 'Payment must be greater than zero.' };
  }

  const newAmountPaid = invoice.amountPaid + paymentAmount;

  // Overpaying a supplier invoice is almost always a data-entry mistake.
  if (newAmountPaid > invoice.totalAmount) {
    return {
      ok: false,
      code: 'OVERPAYMENT',
      reason: `Payment exceeds outstanding balance of ${invoice.totalAmount - invoice.amountPaid}.`,
    };
  }

  return {
    ok: true,
    newAmountPaid,
    newStatus: newAmountPaid >= invoice.totalAmount ? 'paid' : 'partial',
  };
}
```

Then a `recordPayment(tenantId, invoiceId, input, userId)` function that fetches the
invoice (tenant-scoped), calls `applyPayment`, and — if OK — inside **one transaction**
inserts the payment row and updates the invoice. Throw `BusinessError` with the
returned `code` and reason when not OK.

> **Money and decimals:** `totalAmount` and `amountPaid` are Postgres `decimal`
> columns and come back as **strings**. Parse them explicitly with `parseFloat` and
> write them back with `.toString()`. Never compare the raw strings — `"100" > "99"`
> is `false` in JavaScript string comparison.

---

## Step 3 — Types

`flowserv-api/src/modules/finance/types.ts`:

```ts
export const recordPaymentInput = z.object({
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(['cash', 'transfer']),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentInput>;
```

---

## Step 4 — Route

In `flowserv-api/src/routes/finance.ts` add:

```
POST /v1/finance/payables/:id/payments
```

Keep it **thin** — validate, call the service, return. No business logic in the route.
Also add `GET /v1/finance/payables/:id` returning the invoice with its payment
history, so the UI can show what has been paid.

---

## Step 5 — Frontend

In `PayablesTable.svelte` add a **Pay** button per row opening a small modal:
amount (defaulting to the outstanding balance), method, optional notes. On success,
refresh the list.

Show the outstanding balance (`totalAmount − amountPaid`) as its own column — that is
the number the shop owner actually cares about.

---

## Step 6 — Tests

Against the pure `applyPayment`:

1. Partial payment → `partial`, correct `newAmountPaid`
2. Payment completing the balance → `paid`
3. Payment exceeding the balance → `OVERPAYMENT`
4. Payment on an already-paid invoice → `ALREADY_PAID`
5. Zero or negative amount → `INVALID_AMOUNT`
6. Two sequential partials summing to the total → `paid`

---

## How to verify (evidence required)

Needs a `tempo` supplier invoice with `totalAmount` 1,000,000 and `amountPaid` 0.

**Partial payment:**
```bash
curl -X POST http://localhost:3001/v1/finance/payables/<INVOICE_ID>/payments \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"amount":400000,"paymentMethod":"cash"}'
```
Expect **201**; invoice now `amountPaid` 400000, status `partial`.

**Final payment** of 600000 → status `paid`.

**Overpayment** — try 999999 more → **422** with code `OVERPAYMENT`.

**Evidence:** all three responses, plus `npm test` passing.

---

## Do NOT do

- **Do not** post to `financeLedgerEntries`. It is empty and unused; wiring the whole
  double-entry ledger is Phase 4.5A. Leave a `// TODO: ledger posting (Phase 4.5A)`.
- **Do not** move existing modules into `modules/`. Only this new one.
- **Do not** build accounts receivable (customer debt). Different feature, Phase 8.
- **Do not** add payment approval workflow or thresholds — Phase 8.

---

## When done

Mark in `PHASES.md`: `3.5B.6` as `[x]`, and **`4A.3` as `[x]`** — this completes it.

Commit: `feat(finance): record supplier invoice payments`
