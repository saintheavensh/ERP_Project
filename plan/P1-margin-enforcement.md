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

## Verification (Definition of Done — evidence required) — DONE 2026-07-23

**Decision confirmed with the developer before coding** (per the risk note above): the
proposed warn-vs-block rule as written — below target but at/above cost = soft warn;
below cost = hard block (422) unless `allowBelowCost: true`. No changes to the proposal.

**Reference cost:** Option A (`unitCostAvg`/WAC), as recommended. `cost <= 0` (never
received stock) → `'unknown_cost'`, never blocks, per the zero-cost edge case.

**Call sites audited and wired** (all four from the "grep before building" list):
- `PATCH /v1/inventory/:id` (`routes/inventory/items.ts`) — also fixed a latent bug
  found while wiring this: the pre-existing `targetMargin` validation resolved the
  item's effective strategy as `data.marginStrategy ?? existing.marginStrategy ??
  DEFAULT_MARGIN_STRATEGY`, **skipping the category fallback entirely** — a category's
  configured strategy was silently never consulted. The new margin-price check uses
  the correct item→category→default resolution (`resolveItemMarginConfig`); left the
  older, narrower `targetMargin`-format-validation as-is (out of scope for this task).
- `PUT /v1/inventory/:id/brands/:brandId` (`routes/inventory/pricing.ts`, the
  simulator's "Apply price" path) — same item-level config and WAC.
- `POST /v1/purchasing/orders/:id/invoice` (`routes/purchasing/invoices.ts`, PO
  costing) — reordered the existing code so WAC is recalculated **before** the price
  write (previously price was written first, WAC second), so the check judges the
  price against the freshly-updated cost, not the stale pre-receipt one.
  `allowBelowCost` applies to the whole invoice submission (one clearance decision
  per invoice, not per batch line). A block aborts the whole transaction — no partial
  invoice, no orphaned batch.
- `POST /v1/opname` (initial stock upload) — same pattern, cost = the WAC just
  recalculated for that item.
- `POST /v1/inventory` (create) — audited, deliberately **not** wired: a brand-new
  item's `unitCostAvg` is always 0 (no stock yet), which `evaluatePriceAgainstMargin`
  always treats as `'unknown_cost'` — the check would be a structural no-op. Documented
  inline instead of adding dead code.

**Shared helpers** (`modules/inventory/service.ts`, DB-touching; `lib/margin.ts` stays
pure per its own module doc): `resolveItemMarginConfig()` (item→category fetch +
`resolveMarginConfig`) and `assertPriceAllowed()` (resolves config, evaluates, throws
`BusinessError('PRICE_BELOW_COST', ..., 422)` when blocked). `evaluatePriceAgainstMargin`
itself lives in `lib/margin.ts` — pure, 9 new unit tests (at-target, below-target,
break-even-is-below-target-not-below-cost, below-cost, zero/negative-cost skip, both
strategies, recommendedPrice cross-check).

- [x] Unit tests for `evaluatePriceAgainstMargin`: at-target, below-target-above-cost,
      below-cost, zero-cost skip, both strategies. (9 tests, `lib/__tests__/margin.test.ts`)
- [x] Live: PATCH an item price below target → 200 + `marginWarning` in body. Recorded:
      cost 162500, target set to 50% markup, price 220000 → `{"status":"below_target",
      "actualMargin":35.38...,"targetMargin":50,"recommendedPrice":243750}`.
- [x] Live: PATCH an item price below cost → 422 `PRICE_BELOW_COST` ("Selling price
      100000 is below cost 162500..."); retried with `allowBelowCost:true` → 200 +
      `marginWarning.status: "below_cost"`.
- [x] Live: opname-received a second unit of a 1-unit/200000-cost item at 400000 (no
      `sellingPrice` in the request) → `GET /v1/inventory` on that item shows
      `unitCostAvg: "300000.00"`, `sellingPrice` **unchanged** at `"300000.00"`,
      `marginStatus: "below_target"` — the "new stock arrives" half, computed on read,
      no schema/write-path change.
- [x] Same enforcement on the brand-pricing "Apply" path: below cost → 422; below
      target (170000 vs cost 162500, default 30% target) → 200 +
      `marginWarning.status: "below_target"`.
- [x] Additionally verified PO costing end-to-end: received a PO, invoiced a batch at
      actualUnitCost 250000 with sellingPrice 200000 (now below the recalculated WAC
      258333.33) → 422, PO stayed `'received'` (not `'completed'`), reconciliation
      clean; re-invoiced with sellingPrice 300000 → 200, PO → `'completed'`,
      `marginWarnings: [{ status: "below_target", actualMargin: 16.1%, ... }]`.
- [x] `npm run test:unit`: 179/179 (was 170, +9). `npm run test:e2e`: 21/21 unchanged.
      `npx tsc --noEmit` (API) and `npx svelte-check` (web, 698 files) both clean.
      FE: `EditItemModal.svelte` and `[id]/+page.svelte`'s brand-price apply handler
      both surface `marginWarning` (an `alert()` with actual/target/recommended) and
      retry with `allowBelowCost: true` on a confirmed 422 `PRICE_BELOW_COST` — wired
      directly against the verified API contract above, matching this codebase's
      existing lightweight `confirm()`/`alert()` UX pattern rather than a new modal.
- DB reset to clean seed state afterward (`npm run db:reset`); the dev server instance
  started for this check was stopped.

## Then

This closes **4C.2** and therefore **Phase 4** — `PHASES.md` updated (4C.2/4C.5 now
`[x]`). The merge decision in [NEXT-STEPS.md](./NEXT-STEPS.md) Stage B is now stale —
this branch (`track-f/honesty-fixes`) already merged `phase-4/purchasing-completion`
in before F4, so there is no separate phase-4 branch left to merge; the next real step
is deciding where Phase 5 starts from.
