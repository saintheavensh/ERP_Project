# H14 — Payments: Partial, Deposit, Settlement

> The original tasks **3D.2 / 3D.5**, unblocked by [H1](./H1-delete-dead-schema.md).
> Size: M · Risk: low — the hard part was the schema, already fixed

## Goal

A customer can pay in instalments, leave a deposit, and settle a credit sale later.

## Why

`pos_invoices.paymentStatus` is a flat value set once at checkout, so partial payment is
impossible. This was never a missing feature — the `payments` table existed but its foreign
key pointed at `pos_transactions`, the **dead** POS model. It could not record a payment
against a real invoice.

H1 deleted that table. This task rebuilds it against the live model.

Real cases this enables, all currently impossible:
- **DP (deposit)** on a repair before work starts — SBL-002, standard practice in Indonesian
  service shops
- **Tempo settlement** — a credit sale paid days later
- **Split payment** — part cash, part transfer

`pos_invoices.paymentMethod` already accepts `'split'` with nothing behind it.

## Design

Mirror `supplier_payments`, which already works well and was verified end-to-end in Phase
3.5. Same shape, same guards — customer-side symmetry with supplier-side.

```ts
export const customerPayments = pgTable('customer_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  posInvoiceId: uuid('pos_invoice_id').notNull().references(() => posInvoices.id),
  amount: money('amount').notNull(),
  method: paymentMethodEnum('method').notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (t) => ({ invoiceIdx: index('customer_payments_invoice_idx').on(t.posInvoiceId) }));
```

Add `amountPaid` to `pos_invoices`, matching `supplier_invoices`.

**Reuse the decision logic.** `applyPayment` in `modules/finance/service.ts` is already
pure, already tested (6 tests), and already handles overpayment, already-paid, and the
partial/paid transition. Generalise it to serve both sides rather than writing a second
copy — this is exactly the duplication that made `calculateWac` go wrong three times.

## Steps

1. `customerPayments` table + `pos_invoices.amountPaid`; backfill existing paid invoices so
   `amountPaid = grandTotal`
2. Generalise `applyPayment` to a shared payable/receivable shape; keep supplier tests green
3. `POST /v1/pos/invoices/:id/payments` — record a payment, update status, `FOR UPDATE`
   locked exactly as the supplier path is
4. `GET /v1/pos/invoices/:id` includes payment history
5. `GET /v1/finance/receivables` — outstanding customer debt, mirroring the payables
   endpoint. **This is FIN-003 (AR), and it only works because [H8](./H8-technician-and-customer.md)
   added `customerId`** — debt against a free-text name cannot be aggregated per customer.
6. Deposit at intake: allow a payment against a ticket before an invoice exists, or create a
   draft invoice at quotation approval. **Prefer the second** — it keeps one money path
   rather than two.
7. Frontend: payment modal on invoice detail (reuse the payables modal from 3.5B.6), plus a
   receivables page mirroring `PayablesTable.svelte`

## Verification

- [ ] Partial payment (400k of 1M) → status `partial`, `amountPaid` 400k
- [ ] Completing payment (600k) → status `paid`
- [ ] Overpayment → **422 `OVERPAYMENT`**, balance untouched
- [ ] Payment against an already-paid invoice → **409 `ALREADY_PAID`**
- [ ] Payment history returns newest-first
- [ ] A paid invoice drops off the receivables list
- [ ] Existing supplier payment tests still pass after generalising `applyPayment`
- [ ] Voiding a partially-paid invoice is handled explicitly — decide and test whether it is
      blocked or triggers a refund; do not leave it undefined
- [ ] Click-path: tempo sale → receivables list → record partial → record rest → gone
- [ ] `npm test` passing

## Watch out

- **Void vs. paid.** What happens when you void an invoice a customer has already partly
  paid? Blocking it (409) is the safe default; refunds are SBL-005 and out of scope here.
  Whatever you choose, make it explicit and tested rather than accidental.
- Payments must post to the ledger via [H11](./H11-finance-ledger.md)'s event bus. Cash
  received is not revenue — revenue was recognised at sale. Getting this wrong double-counts
  income, which is the single most common accounting bug in POS systems.
- Do not reuse `paymentStatus` for a refund state. That conflation was just fixed in
  [H2](./H2-status-enums.md); do not reintroduce it.
