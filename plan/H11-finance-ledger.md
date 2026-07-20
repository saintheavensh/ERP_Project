# H11 — Finance Ledger and Historical Backfill

> The original tasks **3D.3 / 4.5A.1–.3**, now unblocked.
> Size: L · Risk: 🟡 R6 · **Depends on:** [H6](./H6-labor-billing.md), [H7](./H7-ticket-charges.md)

## Goal

Every transaction that moves money posts a ledger entry, and historical sales are
backfilled so reports start from real data.

## Why

`financeLedgerEntries` has **0 rows** and is written by **zero** routes. The FIFO code
already computes exact COGS on every sale and discards it. Every report, dashboard, and
P&L in Phases 5, 8, and 12 depends on this table.

### Correction to the earlier review

The 2026-07-20 review claimed unposted COGS was **permanently unrecoverable**. That was
wrong, and the audit disproved it:

```
pos_sale movements: 5    with a batch reference: 5    with resolvable cost: 5
```

Every `pos_sale` movement carries a `stock_batch_id` resolving to `stock_batches.unit_cost`,
and `unit_cost` is never mutated after creation — only `quantity_remaining` changes. So
historical COGS is fully reconstructible, and this task includes the backfill that proves
it.

The ledger remains high priority because everything downstream needs it. But the "losing
history every day" urgency was overstated, and that should not be the reason you do it.

## Design

Post via the **existing event bus** (`services/event-bus.ts`), not by calling the ledger
from inside route handlers. `FlowEngine.executeTransition` already emits
`TICKET_STAGE_CHANGED` with no subscribers — the pattern is in place and waiting.

This keeps `coding-guidelines.md` §7 satisfied (no circular module imports) and means POS
does not import finance.

```ts
// modules/finance/ledger.ts
export function subscribeLedger() {
  onEvent(AppEvent.POS_SALE_COMPLETED,  postSaleEntries);
  onEvent(AppEvent.POS_SALE_VOIDED,     postVoidReversal);
  onEvent(AppEvent.TICKET_PART_CONSUMED, postTicketCogs);
  onEvent(AppEvent.SUPPLIER_INVOICE_CREATED, postAccountsPayable);
  onEvent(AppEvent.SUPPLIER_PAYMENT_RECORDED, postApSettlement);
}
```

Each sale posts a **matched pair**, which is what makes the ledger checkable:

| Entry | Amount |
|---|---|
| `revenue` | invoice `grandTotal` |
| `cogs` | Σ (`unitCost` × `quantity`) over **part** lines only |

Labor lines contribute revenue with zero COGS — that is the whole point of tracking them
separately, and it is where the shop's margin actually shows up.

## Steps

1. Add the event types to `services/event-bus.ts` and emit them from POS checkout, POS
   void, H9 consumption, and the two supplier-invoice paths.
2. Build `modules/finance/ledger.ts` with **pure** posting functions:
   `buildSaleEntries(invoice, lines) → LedgerEntry[]` — no database, fully testable.
3. Subscribe at startup in `index.ts`.
4. **Transaction boundary — decide deliberately.** Emit events *after* the business
   transaction commits (as `executeTransition` already does). A ledger failure must not
   roll back a completed sale. The trade-off is that a crash between commit and post
   leaves a gap — which is exactly why step 5 exists.
5. Backfill script `src/db/backfill-ledger.ts`:
   - for each non-voided `pos_invoice`, post revenue from `grandTotal`
   - post COGS by joining `stock_movements` → `stock_batches.unit_cost`
   - post reversals for the 3 voided invoices
   - **idempotent** — safe to re-run, keyed on `referenceType` + `referenceId`
6. Reconciliation endpoint `GET /v1/finance/ledger/reconcile` — compares posted revenue
   against invoice totals and flags any gap. This is also your recovery tool for step 4.
7. `GET /v1/finance/ledger` + a simple FE view (DAS-004 Simple Mode).

## Verification

- [ ] `buildSaleEntries` unit-tested with no database: part-only, labor-only, and mixed
- [ ] A labor-only sale posts **revenue with zero COGS**
- [ ] A mixed sale posts COGS covering the part lines only
- [ ] COGS for a split-batch sale equals the true blended cost, not an average
- [ ] Voiding an invoice posts reversal entries that net the original to zero
- [ ] Backfill run against the 5 existing invoices produces entries matching their totals
- [ ] Backfill run **twice** produces no duplicates (idempotency)
- [ ] `/reconcile` reports zero discrepancy after backfill
- [ ] `npm test` passing with ledger accuracy tests (this is 3D.6 / 4.5A.5)

## Watch out

- **Do not start before [H6](./H6-labor-billing.md) lands.** Building against the
  part-only invoice model means reposting everything afterward.
- Read `unitCost` from the invoice line (captured at sale time by H6), **not** by looking
  up batches at posting time. The batch may since have been consumed or restored.
- Do not build a full double-entry chart of accounts here. `financeLedgerEntries` is a
  simple typed ledger; FIN-008 (Chart of Accounts) is Phase 8. Resist the scope creep —
  double-entry without a COA is worse than a clean single-entry ledger.
- The 3 voided invoices in the current data make a good backfill test case: they should net
  to zero, not be skipped.
