# P5 — Finance dashboard: Simple/Accountant mode (DAS-004)

> **Size:** M · **Layer:** BE (small) + FE · **Closes:** PHASES.md 5.9

## Scope decision (confirmed with user before starting)

`specification/features/10-finance.md:21-25` (the "Two Dashboard Modes" section) says:
> Simple Mode (Owner/Branch Mgr): "Today's Income", "Estimated Profit", simple trend
> graphs. No accounting jargon. Accountant Mode (Finance Staff): Full P&L, journal
> entries, general ledger, COA. Professional accounting view. Same data source — only
> presentation differs.

But that same file's status header says real double-entry accounting (Chart of Accounts,
journal entries, debits/credits) is **deliberately not built** — the ledger is
single-sided by design (H11). No `/finance` landing page exists at all yet, and
`GET /v1/finance/ledger` only returns the latest 200 raw rows with no date filter — fine
for a "recent activity" list, not reliable for "today's income" once a branch passes 200
lifetime entries.

**Decision**: build a real `/finance` dashboard with Simple/Accountant modes using the
**existing single-sided ledger as-is** (no Chart of Accounts, no journal entries — matches
10-finance.md's own scope boundary). Add **one small backend aggregation endpoint**
(`GET /v1/finance/ledger/summary`) so period totals are computed correctly in SQL instead
of by summing a client-side-capped 200-row list, which would silently go wrong at scale.
Explicitly **not building**: Chart of Accounts, journal entries, job-costing reports,
Excel/PDF export, multi-branch consolidation, cash/bank balance tiles (there is no
cash-drawer or bank-account tracking anywhere in this app to source that number from).

## What "Accountant Mode" means here

Not a different accounting engine — the same ledger, summed and re-labeled. Per
10-finance.md: "Same data source — only presentation differs." Accountant Mode shows a
revenue/COGS/net P&L summary table for a selectable period, plus a link out to the
existing raw `/finance/ledger` page for line-by-line detail. Simple Mode shows the same
numbers as plain-language tiles with no accounting terms.

## Backend

`flowserv-api/src/routes/finance.ts` — new `GET /v1/finance/ledger/summary`:
- Query params: `branchId` (optional), `from`/`to` (ISO datetime, optional — server
  defaults to the current calendar month if omitted).
- Computes `SUM(amount) WHERE entryType='revenue'` and `SUM(amount) WHERE entryType='cogs'`
  in SQL over the date range (Drizzle `sql` aggregate, `and(gte(postedAt, from), lte(postedAt, to))`).
- **`entryType='adjustment'` is deliberately excluded from the P&L math.** Those rows
  track AP/AR cash movement (`buildApInvoiceEntry`/`buildArSettlementEntry` etc. in
  `modules/finance/ledger.ts`), not income or expense — summing them into "profit" would
  silently misstate it. Documented inline in the route, not just here.
- Response: `{ revenue, cogs, estimatedProfit, entryCount, from, to }`.

## Frontend

- New `flowserv-web/src/routes/(app)/finance/+page.server.ts` + `+page.svelte` — the
  `/finance` landing page that didn't exist before. Mode selected via `?mode=simple|
  accountant` (same validated-query-param-with-fallback idiom as the Kanban board's
  `?flowTemplateId=`), default `simple`.
  - **Simple Mode**: `StatCard` tiles (reused from P3) — Pendapatan Hari Ini (today's
    revenue), Estimasi Laba Bulan Ini (this month's revenue − COGS), Piutang (AR) /
    Hutang (AP) outstanding (reusing the existing `/finance/receivables` and `/payables`
    endpoints, same as P3's dashboard tiles).
  - **Accountant Mode**: a P&L summary table (Pendapatan / HPP (COGS) / Laba Kotor) for a
    period selector (Hari Ini / Bulan Ini), plus a "Lihat Buku Besar →" link to the
    existing `/finance/ledger` page.
  - Mode toggle (two buttons, not a dropdown — matches the tap-based simplicity of the
    Kanban board's interaction, not a new UI pattern).
- Sidebar (`(app)/+layout.svelte`, both Super Admin and Manager Finance submenus) gets a
  new first entry ("Ringkasan") linking to `/finance` — the parent "Finance" item itself
  only expands a `<details>` block today (no href), so without a submenu entry the new
  page would be reachable only by typing the URL.

## Verification (Definition of Done)

- Live curl proof: `GET /v1/finance/ledger/summary` with a known date range returns
  `revenue`/`cogs` matching a manual sum of `/finance/ledger` entries in that range;
  confirms `adjustment` entries are excluded from the totals.
- New `e2e/p5-finance-dashboard.spec.ts` (Playwright): Simple Mode tiles render with real
  numbers; toggling to Accountant Mode shows the P&L table; the link to the raw ledger
  works; mobile viewport doesn't overflow.
- `npx tsc --noEmit` (API) and `npx svelte-check` (web): 0 errors.
- Full existing e2e suite stays green.

## Watch out

- Don't include `entryType='adjustment'` (or the unused `'loss'`) in the P&L sum — see
  Backend section above. This is the one correctness trap in an otherwise simple task.
- The `/finance/ledger/summary` date range must use the same `date_trunc`-safe comparison
  style already established in `lib/pagination.ts` if precision issues ever surface here
  too — not expected at day/month granularity, but worth knowing the precedent exists.
