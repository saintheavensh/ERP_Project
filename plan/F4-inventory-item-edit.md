# F4 — Edit an inventory item after creation

> **Size:** S · **Layer:** BE+FE · **Priority:** now
> **Goal:** Add `PUT /v1/inventory/:id` so core item fields can be corrected without a DB edit.

## Problem
`routes/inventory/items.ts` has create + delete + `/:id/compatibility` + `/:id/brands/:brandId`,
but **no way to edit** an item's `name`, `categoryId`, `reorderPoint`, `unitOfMeasure`, or base
`sellingPrice`. Fixing a typo'd SKU/name or tuning a reorder point currently requires editing the
database or delete-and-recreate.

## Files to touch
- `flowserv-api/src/routes/inventory/items.ts` — add `PUT /:id` (Zod partial-update schema),
  tenant-scoped, gated by the same permission as create (`inventory.manage_items` or equivalent)
  + `auditMiddleware` (`inventory.update_item`).
- `flowserv-web/src/lib/states/inventory/inventory.svelte.ts` + the inventory item detail/edit
  component — an edit form.

## Steps
1. Zod schema: allow updating `name`, `categoryId`, `reorderPoint`, `unitOfMeasure`,
   `sellingPrice`, `universalCode`. Do **not** allow editing SKU if it's used as a stable key
   elsewhere (decide; if allowed, it must respect the `(tenant_id, sku)` unique constraint).
2. Update the row `WHERE id = :id AND tenant_id = :tenantId`; 404 if no row.
3. If `sellingPrice` is edited, this is the natural hook for **4C.2** margin validation later —
   leave a clear TODO or wire it if 4C is already done.

## Verification (Definition of Done)
- Recorded API run: create an item, PUT a new name + reorderPoint, GET → reflects the change;
  duplicate-SKU edit → rejected by the unique constraint; cross-tenant PUT → 404.
- `npx svelte-check` clean.

## Watch out
- Editing `sellingPrice` here must not desync anything — base `sellingPrice` is a catalog default;
  per-brand pricing lives separately. Don't touch batches or WAC.
