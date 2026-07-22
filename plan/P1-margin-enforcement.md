# P1 — Margin Enforcement on Price Writes (closes 4C.2, finishes Phase 4)

> Size: M · Risk: 🟠 (changes what a price write is allowed to do — get the
> block-vs-warn decision right first). Depends on: **4C.1 done** (`lib/margin.ts`
> already exists with `recommendedPrice`, `meetsTarget`, `grossMarginPct`,
> `markupPct` — this task consumes them, writes no new margin math).

## Goal

The backend must stop being a blind sink for `sellingPrice`. Today any client can
send any price and the server stores it — the margin target is only advisory in the
frontend simulator. This task makes the server the authority: every price write is
evaluated against the item's effective margin config, and a price that misses the
target is either **warned** or **blocked** per the rules below.

Also the second half of 4C.2's original title — *"update product pricing when new
stock arrives"* — a new batch at a higher cost silently erodes margin on the
unchanged old price. Surface that, don't hide it.

## Where prices are written (audit these call sites, don't assume)

Grep before building — confirm the list is complete:
- `PATCH /v1/inventory/:id` → `sellingPrice` (added in 4C.1, `routes/inventory/items.ts`)
- item brand pricing → `itemBrandPricing.sellingPrice` (the simulator's "Apply price"
  path — find its route; likely `routes/inventory/*` or a brand-pricing handler)
- inventory item **create** (`POST /v1/inventory`) currently takes `sellingPrice` too
- goods receipt / PO receive — where a new `stock_batches.unitCost` lands

## The reference cost (decide first — this is the load-bearing choice)

Margin needs a cost to measure against. Options, pick one and write it down:
- **A. `unitCostAvg` (WAC cache on the item).** Cheap, already on the row. Recommended
  default — it's the number the rest of the app already treats as "the cost".
- B. Max remaining batch cost (most conservative — guarantees margin on every unit).
- C. Latest batch cost (matches the simulator's `setRecommendedLatestCost`).

Recommendation: **A**, with the comparison done by `meetsTarget(price, unitCostAvg, config)`
from `lib/margin.ts`. Note the edge case: `unitCostAvg = 0` (never received stock) →
`markupPct`/`grossMarginPct` already return 0 and `meetsTarget` handles it; a 0-cost
item can't have its margin judged, so skip the check (don't block) and say so in the
response.

## Behaviour — warn vs block (confirm with the developer before coding)

Spec 4C.3 says *"show a warning"*, not *"reject"*. Proposed rules:
- **Below target but at/above cost** → **soft warn.** Store the price, return
  `200/201` with a `marginWarning` object in the envelope
  (`{ actualMargin, targetMargin, strategy, recommendedPrice }`). The frontend already
  has the simulator UI to surface this.
- **Below cost (selling at a loss)** → **hard block 422 `PRICE_BELOW_COST`**, unless the
  request carries an explicit `allowBelowCost: true` (a deliberate clearance price).
- Never silently change a price the user set.

This keeps the manager in control (warn) while stopping the one truly unrecoverable
mistake (selling under cost by accident).

## The "new stock arrives" half

On goods receipt, after the new batch updates `unitCostAvg`, re-evaluate the item's
current `sellingPrice` against the target. If it now misses:
- Do **not** auto-rewrite the price (silent price changes are how you lose trust and
  audit-ability). Instead set/flag a review signal the inventory list can show — e.g.
  compute it on read in `GET /v1/inventory` (a `marginStatus: 'below_target' | 'below_cost' | 'ok'`
  field per item) so no schema column or write-path change is needed. Cheapest correct
  option; revisit only if a persisted flag is actually required by a screen.

## Reuse, don't rebuild

`lib/margin.ts` already has everything: `resolveMarginConfig(item, item.category)`,
`recommendedPrice`, `meetsTarget`, `grossMarginPct`, `markupPct`. This task is wiring +
one decision, not new math. Keep the evaluation in a small pure helper
(`evaluatePriceAgainstMargin(price, cost, config) → { status, actualMargin, recommendedPrice }`)
in `lib/margin.ts` so it's unit-tested without HTTP, matching the H-track pattern.

## Verification (Definition of Done — evidence required)

- [ ] Unit tests for `evaluatePriceAgainstMargin`: at-target, below-target-above-cost,
      below-cost, zero-cost skip, both strategies.
- [ ] Live: PATCH an item price below target → 200 + `marginWarning` in body (recorded).
- [ ] Live: PATCH an item price below cost → 422 `PRICE_BELOW_COST`; with
      `allowBelowCost:true` → 200 (recorded).
- [ ] Live: receive a higher-cost batch → `GET /v1/inventory` shows the item's
      `marginStatus: 'below_target'` while its stored price is unchanged (recorded).
- [ ] Same enforcement on the brand-pricing "Apply" path, not just the item PATCH.
- [ ] `npm test`, `tsc`, `svelte-check` all clean. FE simulator shows the server warning.

## Then

This closes **4C.2** and therefore **Phase 4**. Do 4C.5 (the phase-complete commit),
then the merge decision in [NEXT-STEPS.md](./NEXT-STEPS.md).
