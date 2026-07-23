# P6 — Inventory Dashboard gaps (5.4)

> **Size:** S · **Layer:** FE only · **Closes:** PHASES.md 5.4

## Research finding — this is not a new page

Stock levels and low-stock badges already exist on `/inventory` (`InventoryTable.svelte`:
a Low Stock/In Stock badge per row, computed the same way as P3's dashboard tile). Batch
history already exists at `/inventory/[id]` (`StockBatches.svelte`) fed by an API response
that already includes supplier and received-date data — just not rendered. P3's dashboard
already has a "Stok Menipis" tile. Building a whole new "Inventory Dashboard" page would
duplicate the table and the tile. The real, narrow gaps:

1. `/inventory` has no search or low-stock-only filter — just a flat table, awkward once a
   tenant has more than a couple dozen items.
2. `StockBatches.svelte` doesn't show supplier name, received date, or branch, despite the
   API (`GET /v1/inventory/:id`) already returning `supplier` and `receivedAt` per batch —
   this is INV-004 (Batch Management) sitting about 60% done, not absent.
3. P3's "Stok Menipis" tile links to a generic `/inventory` with no pre-filter — clicking
   it doesn't actually take you to the low-stock items.

## What changed

- `InventoryState` (`lib/states/inventory/inventory.svelte.ts`) — added `searchQuery` and
  `lowStockOnly` `$state`, and a `filteredInventory` getter (search by name/SKU, optional
  low-stock-only). All client-side — the full list is already fetched via `fetchAllPages`,
  no new backend endpoint needed.
- `/inventory/+page.svelte` — search box + "Stok Menipis" toggle button in the header;
  `InventoryTable` now reads `inv.filteredInventory` instead of the raw list.
- `/inventory/+page.server.ts` + `InventoryState` constructor — reads `?lowStock=true` from
  the URL to seed `lowStockOnly`, so a link can deep-link straight into the filtered view.
- `(app)/+page.svelte` (P3's dashboard) — the "Stok Menipis" tile's `href` changed from
  `/inventory` to `/inventory?lowStock=true`, so it now actually does what it visually
  promises.
- `StockBatches.svelte` — now shows supplier name, received date, branch name (resolved
  from a `branches` list passed in as a prop — no backend relation needed, the app only
  has 2 branches in practice), and `quantityReceived` alongside the existing
  `quantityRemaining`/cost/brand.
- `/inventory/[id]/+page.server.ts` — added a `GET /v1/branches` fetch (branches list
  already used elsewhere in the app, e.g. POS) to resolve batch branch names.

## Verification (Definition of Done)

- New/extended Playwright coverage: search filters the table; the low-stock toggle shows
  only rows with `totalAvailable <= reorderPoint`; the dashboard tile's link lands on a
  pre-filtered `/inventory?lowStock=true` that actually shows only low-stock rows; the
  item detail page's batch list shows supplier + date + branch for a real seeded batch.
- `npx svelte-check`: 0 errors.
- Backend untouched — no `flowserv-api` changes, no need to re-run its test suite.
