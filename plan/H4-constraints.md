# H4 — Constraints, Tenant Scoping, and the `stock_levels` Decision

> Size: M · Risk: 🟠 R4 — contains an architectural decision, not just mechanical work

## Goal

Re-enable the disabled uniqueness guarantees, give every table a `tenant_id`, and resolve
the dual-source-of-truth in stock.

## Why now

The audit found **zero duplicates** blocking any of the three commented-out constraints:

| Constraint | Location | Duplicates found |
|---|---|---|
| `roles` (tenant + name) | [core.ts:60](../flowserv-api/src/db/schema/core.ts#L60) | 0 |
| `inventory_items` (tenant + sku) | [inventory.ts:53](../flowserv-api/src/db/schema/inventory.ts#L53) | 0 |
| `stock_levels` (item + branch) | [inventory.ts:76](../flowserv-api/src/db/schema/inventory.ts#L76) | 0 |

So this is a five-minute job today. Once Phase 10 loads real shop data it becomes a
data-repair project where you must decide which of two conflicting rows is correct.

## Part 1 — Re-enable the three unique constraints

Uncomment all three, `generate`, inspect, `migrate`.

The `stock_levels` one is the important one. Every read of that table uses `findFirst`
(e.g. [`pos/invoices.ts:194`](../flowserv-api/src/routes/pos/invoices.ts#L194)). With no
unique constraint, a duplicate row means `findFirst` returns an arbitrary one of the two,
stock silently reports wrong, and the FIFO batches — which are correct — disagree with it
permanently.

**The row locking added in 3.5B.2 does not prevent this.** `SELECT ... FOR UPDATE` cannot
lock a row that does not exist yet, so two concurrent requests can both find nothing and
both insert. Only the unique constraint closes it.

## Part 2 — Add `tenant_id` to `stock_levels` and `purchase_order_lines`

`coding-guidelines.md` §5 requires every query to filter by `tenantId`. These two tables
make that impossible — the column does not exist. Isolation is currently inferred through
a join, so one forgotten join is a silent cross-tenant leak with nothing to catch it.

```ts
tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
```

Backfill before making it `NOT NULL`:

```sql
ALTER TABLE stock_levels ADD COLUMN tenant_id uuid REFERENCES tenants(id);
UPDATE stock_levels sl SET tenant_id = i.tenant_id
  FROM inventory_items i WHERE i.id = sl.inventory_item_id;
ALTER TABLE stock_levels ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE purchase_order_lines ADD COLUMN tenant_id uuid REFERENCES tenants(id);
UPDATE purchase_order_lines pol SET tenant_id = po.tenant_id
  FROM purchase_orders po WHERE po.id = pol.purchase_order_id;
ALTER TABLE purchase_order_lines ALTER COLUMN tenant_id SET NOT NULL;
```

Then add the filter to every query touching them. Grep for `stockLevels` and
`purchaseOrderLines` and add `eq(table.tenantId, tenantId)` to each `where`.

Note the unique constraint on `stock_levels` should become **(tenant_id, inventory_item_id,
branch_id)** once the column exists.

## Part 3 — Decision: is `stock_levels` a cache or the truth?

**This needs a real decision, not a patch.**

`stock_levels.quantityAvailable` is a denormalized copy of
`SUM(stock_batches.quantity_remaining)`. Two writers, no constraint tying them together.
The audit found they agree today (72 = 72, 20 = 20) — but also that **one inventory item
has no `stock_levels` row at all**, so selling it hits the `STOCK_LEVEL_MISSING` 422 path
in POS with a confusing error, despite stock existing.

### Option A — Keep the cache (recommended)

Keep `stock_levels` as a fast-read cache, and make it honest:

- Add the unique constraint (Part 1) so duplicates are impossible
- Auto-create the row when an inventory item is created, so it always exists
- Add a reconciliation query comparing levels to batch sums, run in tests and exposed as an
  admin endpoint

Cheapest change, keeps reads fast, keeps `quantityReserved` (which H10 needs and which
cannot be derived from batches).

### Option B — Drop the cache, derive from batches

Replace with a view over `stock_batches`. One source of truth, an entire bug class gone.
But: reserved quantity has nowhere to live, every stock read becomes an aggregate, and it
is a larger change touching most inventory code.

**Recommendation: Option A.** `quantityReserved` is the deciding factor — H10 needs
somewhere to put it that is not derivable from batches. Revisit only if reconciliation
keeps finding drift.

Whichever you pick, **write the decision down** in the Architecture Debt section of
`PHASES.md`. The next person needs to know `stock_levels` is deliberately a cache.

## Verification

- [ ] All three unique constraints exist; inserting a duplicate is rejected by the database
- [ ] `stock_levels` and `purchase_order_lines` have `tenant_id NOT NULL`, fully backfilled
- [ ] Every query touching those tables filters on `tenantId` (grep to confirm)
- [ ] The reconciliation query reports zero drift across all items
- [ ] The item with no `stock_levels` row now has one
- [ ] Creating a new inventory item auto-creates its stock level row
- [ ] `npm test` passing, plus a new test for the reconciliation helper

## Watch out

- Add the unique constraint **before** the auto-create logic, or a race during backfill can
  create the very duplicate you are trying to prevent.
- `purchase_order_lines` has no `tenant_id` today, so any existing query joining through
  `purchase_orders` still works — do not remove those joins, just add the direct filter.
