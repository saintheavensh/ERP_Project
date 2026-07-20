# H6 — Invoice Lines That Can Bill Labor

> The single most valuable task in this track.
> Size: M · Risk: 🟡 R6 — changes what an invoice means; do before H11

## Goal

An invoice line can represent labor or a fee, not only a physical inventory item.

## Why

```ts
// pos.ts:48
inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
```

**Every invoice line must point at a physical inventory item.** There is no way to add
"Jasa servis — Rp 150.000" to a sale. The application cannot charge for labor.

For a repair shop, labor is typically the **larger margin line**. A service ERP that can
only bill parts is not doing the job it exists to do. This blocks SBL-001 through SBL-005
(quotation, deposit, invoice, payment, refund — all marked MVP ✅) and makes ticket
profitability unanswerable.

The irony worth noting: the schema deleted in [H1](./H1-delete-dead-schema.md) already had
the right shape.

```ts
// the dead invoice_lines table
description: text('description').notNull(),
sourceType: varchar('source_type', { length: 20 }).notNull(), // "part" | "labor" | "fee"
```

The model that solves this was the one marked for deletion; the model in production is the
one that cannot. H1 deletes the tables — **this task keeps the idea.**

## Steps

### 1. Restructure `pos_invoice_lines`

```ts
export const lineSourceEnum = pgEnum('line_source', ['part', 'labor', 'fee', 'discount']);

export const posInvoiceLines = pgTable('pos_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  posInvoiceId: uuid('pos_invoice_id').notNull().references(() => posInvoices.id),

  sourceType: lineSourceEnum('source_type').notNull(),
  description: text('description').notNull(), // always set — survives item renames

  // Only populated when sourceType = 'part'. A labor line has no inventory item.
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').references(() => partBrands.id),

  quantity: integer('quantity').notNull(),
  unitPrice: money('unit_price').notNull(),
  subtotal: money('subtotal').notNull(),

  // Captured at sale time from the consumed FIFO batches. H11 posts COGS from this
  // instead of recomputing it — the batches may be gone or changed by then.
  unitCost: money('unit_cost'),
});
```

Three things worth being deliberate about:

- **`description` is always required**, including for parts. Renaming an inventory item
  must not retroactively rewrite what a past invoice says was sold.
- **`inventoryItemId` becomes nullable**, which is the actual unlock.
- **`unitCost` is captured at sale time.** COGS is a historical fact about the moment of
  sale. Do not plan to recompute it later from batches.

Backfill the 5 existing lines: `sourceType='part'`, `description` from the item name,
`unitCost` from the batch consumed via `stock_movements`.

### 2. Add a database-level integrity check

The invariant "parts have an item, labor does not" should be enforced by Postgres, not by
remembering:

```sql
ALTER TABLE pos_invoice_lines ADD CONSTRAINT part_lines_have_an_item CHECK (
  (source_type = 'part'  AND inventory_item_id IS NOT NULL) OR
  (source_type <> 'part' AND inventory_item_id IS NULL)
);
```

### 3. Update the checkout endpoint

`posCheckoutSchema` in `pos/invoices.ts` currently accepts only item lines. Accept a
discriminated union so Zod enforces the same rule at the edge:

```ts
const lineSchema = z.discriminatedUnion('sourceType', [
  z.object({
    sourceType: z.literal('part'),
    inventoryItemId: z.string().uuid(),
    partBrandId: z.string().uuid().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.coerce.number().positive(),
  }),
  z.object({
    sourceType: z.enum(['labor', 'fee']),
    description: z.string().min(1),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.coerce.number().positive(),
  }),
]);
```

Then in the checkout loop: **only `part` lines touch stock.** Labor and fee lines skip FIFO
deduction entirely. This is the core behavioural change — get it right, and guard it with a
test that a labor-only invoice performs zero stock movements.

### 4. Frontend

`CartSidebar.svelte` and `CheckoutModal.svelte` need an "add service / labor" affordance
alongside product selection. Keep it simple: a description field and an amount.

## Verification

- [ ] An invoice can be created containing **only** a labor line, no inventory item
- [ ] That invoice produces **zero** rows in `stock_movements` (test this explicitly)
- [ ] A mixed invoice (1 part + 1 labor) deducts stock for the part only
- [ ] The CHECK constraint rejects a `part` line with a null `inventoryItemId`
- [ ] The 5 existing invoice lines still render correctly with backfilled descriptions
- [ ] `unitCost` is populated on new part lines and matches the consumed batch cost
- [ ] Click-path: add a service charge in POS, check out, see it on the printed/detail view
- [ ] `npm test` passing, with new tests for the labor-only and mixed cases

## Watch out

- **Do this before [H11](./H11-finance-ledger.md).** Building the ledger against the
  part-only model means reposting every entry after this lands.
- Voiding a mixed invoice must restore stock for part lines and simply mark labor lines
  void — do not let the void loop assume every line has a batch. The existing void code
  iterates `stock_movements`, so it is naturally safe, but add a test.
- Discount is currently a header-level field (`discountAmount`). The `'discount'` source
  type is included for later per-line discounts (SAL-006) — do not implement it now, just
  reserve the value.
