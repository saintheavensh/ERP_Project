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

## Verification (Definition of Done) — DONE 2026-07-23

> **Note:** by the time this task was picked up, `PATCH /v1/inventory/:id` already existed —
> it landed as part of **4C.1** (`phase-4/purchasing-completion`, commit `1b3ddbd`), which
> this branch (`track-f/honesty-fixes`) had diverged from. 4C.1's endpoint covered `name`,
> `categoryId`, `sellingPrice`, `reorderPoint`, and the margin-config fields, but not
> `unitOfMeasure`/`universalCode`, and shipped with **no FE edit form for items** (only
> categories got one). Merged `phase-4/purchasing-completion` into this branch first
> (merge commit `d46180e`, one conflict in `PHASES.md`, resolved by keeping the `[x]` 4C.1
> block since the merge brings its code in), then did the remaining F4 scope on top.
- `updateItemSchema` (`routes/inventory/items.ts`) extended with `universalCode` and
  `unitOfMeasure`. `sku` deliberately stays non-editable (decided per the task's own
  "decide" prompt — it's the human-facing stable identifier printed on receipts/labels).
- FE: new `EditItemModal.svelte` (name, category, universal code, unit, base price, reorder
  point, margin strategy/target — mirrors the categories page's edit-modal pattern) +
  an "Edit Produk" button on `/inventory/[id]`. `InventoryHeader.svelte` now also shows the
  item's resolved margin strategy/target so an edit's effect is visible without opening
  the modal again. `+page.server.ts` now also loads `/v1/categories` for the dropdown.
- **Live API run** (real login, curl, freshly reset DB): PATCHed `name` + `reorderPoint` +
  `unitOfMeasure` + `universalCode` on a seeded item → 200, all four reflected on a
  follow-up GET. Second tenant's admin PATCHing the same item id → 404 `NOT_FOUND` (not
  403 — tenant isolation, matching the existing convention elsewhere in the codebase).
  Non-existent item id → 404. Regression-checked the pre-existing 4C.1 guard:
  `gross_margin` target ≥ 100 → still 400 `VALIDATION_ERROR`.
- `npm run test:unit`: 165/165 (unchanged — this task added no new pure logic to unit-test,
  the margin validation it reuses is already covered by 4C.1's 25 tests). `npx tsc --noEmit`
  (API) and `npx svelte-check` (web, 698 files) both clean.
- DB reset to clean seed state afterward (`npm run db:reset`); the dev server instance
  started for this check was stopped.

## Watch out
- Editing `sellingPrice` here must not desync anything — base `sellingPrice` is a catalog default;
  per-brand pricing lives separately. Don't touch batches or WAC. (Confirmed: the PATCH handler
  never touches `stockBatches`/`itemBrandPricing`.)
- `sku` is not editable through this endpoint (see above) — if that's ever needed, it must
  respect the `(tenant_id, sku)` unique constraint the same way `POST /` already handles the
  `23505` conflict.
