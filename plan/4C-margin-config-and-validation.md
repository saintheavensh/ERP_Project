# 4C — Dynamic margin pricing: config endpoint + server-side validation

> **Size:** M · **Layer:** BE+FE · **Priority:** now (this is the officially-current phase)
> **Closes:** PHASES.md 4C.1 `[/]`, 4C.2 `[ ]`, 4C.5 `[ ]`
> **Goal:** Make margin a real, server-enforced setting instead of a frontend illusion.

## Problem (the dishonest flow)
The columns `marginStrategy` / `targetMargin` exist on **both** `inventory_categories` and
`inventory_items`, but **no endpoint ever writes them**, so they're always null. The frontend
simulator (`flowserv-web/src/lib/states/inventory/simulator.svelte.ts:69`) reads
`item.targetMargin || item.category?.targetMargin || '30'` — silently defaulting every item to a
hardcoded **30%**. And every price-setting endpoint accepts an arbitrary `sellingPrice` with **zero
server-side validation** — a cashier/manager can set any price below cost via the brand-price PUT,
the PO costing step, or opname, and the server posts it without objection. The only guardrails
("RUGI TOTAL" banner) are client-side and advisory. This contradicts CAT-001 / INV-014 / PUR-010.

## 4C.1 — Margin config endpoints
Files: `flowserv-api/src/routes/categories.ts` (currently only `GET` + `POST` — no `PUT`),
`flowserv-api/src/routes/inventory/items.ts` (coordinate with **F4**'s `PUT /:id`).

1. Add `PUT /v1/categories/:id` accepting `marginStrategy` (`'markup' | 'gross_margin'`) and
   `targetMargin` (percentage, `decimal(5,2)` — not money). Tenant-scoped, RBAC + audit.
2. Allow the same two fields on the item edit endpoint (F4's `PUT /v1/inventory/:id`), so an item
   can override its category's default.
3. FE: surface both fields in the category edit form and the item edit form.

## 4C.2 — Server-side selling-price validation
Put the margin math in a **pure, tested** helper (e.g. `lib/margin.ts`:
`resolveTargetMargin(item, category)` and `validateSellingPrice(cost, price, strategy, target)`),
then call it from every write site that sets a price:
- `PUT /v1/inventory/:id/brands/:brandId` (brand pricing)
- `POST /v1/purchasing/orders/:id/invoice` (PO costing sets `sellingPrice`)
- `POST /v1/opname` (initial stock can set price)

Decide the enforcement mode and document it:
- **Hard reject** below cost → `422 BELOW_COST`.
- **Soft warn** when below `targetMargin` but above cost → allow, but return a warning flag the UI
  shows (mirrors the existing "RUGI" banner, now backed by the server). Recommended: hard-reject
  below cost, soft-warn below target.

## Verification (Definition of Done)
- Unit tests for `lib/margin.ts` (markup vs gross-margin math; below-cost, below-target, ok).
- Recorded API run: set a category `targetMargin`; create an item that inherits it; attempt a
  brand price below cost → 422; a price below target but above cost → allowed with a warning flag;
  confirm the simulator now reads a **real** target, not the 30% fallback.
- `npx tsc --noEmit` + `npx svelte-check` clean.

## 4C.5 — Commit
`feat: phase 4 complete — purchasing & margins`. Mark 4C.1/4C.2/4C.5 `[x]` in PHASES.md.

## Watch out
- `targetMargin` is a **percentage**, keep it `decimal(5,2)` — do not route it through the
  `money()` helper (H5 already made this distinction).
- Markup% and gross-margin% are **different formulas** — the strategy column decides which. Test both.
