# H17 — Service Invoice from a Ticket (SBL-003) — closes H15 gap (a)

> Created 2026-07-22. Follows directly from the composition gap **H15 discovered**.
> Size: M · Risk: 🟡 — it changes how a repair turns into money, and it must not
> double-post COGS.

## Goal

Give a completed repair a single, correct way to become a customer invoice:
`POST /v1/tickets/:id/invoice` bills the ticket's **consumed parts + approved
labor/fee** as a `pos_invoices` row **without re-running FIFO** (the stock is
already gone), posting **revenue only** to the ledger (COGS was already posted at
consumption). This is feature **SBL-003** and it is the fix for the bug H15 found.

## Why (the H15 gap)

H15 proved there is no endpoint that bills an already-consumed ticket charge.
POS checkout's only `part`-line mechanism is `consumeStock()` (FIFO deduction),
so billing a ticket's already-consumed part through checkout **re-deducts stock**
— H15 showed it succeeding and silently removing 7 units nobody used. The real
fix is not a guard bolted onto checkout; it is providing the correct path so
there is never a reason to use the wrong one.

This also unblocks H15's `[/]` box "ledger revenue = invoice grandTotal for the
full repair" — today only the labor portion of a ticket can be invoiced.

## The ledger correctness point (read before coding)

COGS for a ticket's parts is **already posted at consumption time** —
`consumeCharge` (H9) emits `TICKET_PART_CONSUMED` → `buildTicketCogsEntry`
(`referenceType='ticket_consumption'`, `referenceId=chargeId`). Therefore the
invoice must post **revenue only**. Reusing `buildSaleEntries` (which posts a
matched revenue+COGS pair) would **double-count COGS**. This is the single most
important correctness constraint in the task.

Accrual timing is intentionally: COGS at consumption, revenue at invoicing. Between
those two moments a ticket's margin reads negative in the ledger — correct (cost
incurred before revenue recognized), and it completes when the invoice is issued.

## Design

**Endpoint:** `POST /v1/tickets/:id/invoice` (in `routes/tickets.ts`, delegating to
`modules/tickets/service.ts` — the module already extracted in H7, extended per H16).
Body: `{ paymentMethod: 'cash'|'transfer'|'qris'|'tempo', discountAmount?, customerId? }`
(mirrors checkout; `tempo` requires `customerId`, same rule as H8).

**Billable charges** (selected inside one transaction, ticket-and-tenant scoped):
- `sourceType='part'` **and** `status='consumed'` → line at the charge's `unitPrice`
  (revenue) carrying its already-known `unitCost` (record only). **No `consumeStock`.**
- `sourceType IN ('labor','fee')` **and** `status='approved'` → line, no stock.
- Everything else (estimated, approved-but-unconsumed parts, cancelled) is **not
  billed** — an unconsumed part was not physically delivered.
- Empty billable set → 422 `NOTHING_TO_INVOICE`.

**One invoice per ticket:** reject with 409 `TICKET_ALREADY_INVOICED` if a
non-voided `pos_invoices` row already references this `serviceTicketId`. No schema
change and no new `invoiced` charge status for this MVP — incremental/partial
invoicing is future work (see Decisions).

**Invoice creation:** a normal `pos_invoices` row (`serviceTicketId` set,
`invoiceNumber` from the shared allocator, `subtotal/discount/grandTotal`,
`amountPaid`/`paymentStatus` set exactly as checkout does — full for immediate
methods, 0 for tempo) + `pos_invoice_lines` (part lines carry `unitCost`; labor/fee
`unitCost=null`, `inventoryItemId=null`).

**Ledger (revenue only):** new event `TICKET_INVOICE_CREATED` + a new pure builder
`buildTicketInvoiceRevenueEntry` (revenue entry, `referenceType='pos_sale'`,
`referenceId=invoiceId`) so `/ledger/reconcile`'s revenue-vs-grandTotal check
validates it exactly like a POS sale — while COGS stays on the consumption entries.
Emitted **after commit**, best-effort, like every other ledger event.

**Invoice numbering:** extract the checkout's inline per-tenant-per-day
`INSERT ... ON CONFLICT DO UPDATE ... RETURNING` block into
`lib/invoice-number.ts` (`allocateInvoiceNumber(tx, tenantId)`) and call it from
**both** checkout and the new path — two callers now justify removing the
duplication (the codebase already fought this exact drift for WAC in 3.5B.4).
Checkout's behavior is unchanged (mechanical swap; covered by H5's concurrency
test + the e2e suite).

## Decisions (and rejected alternatives)

- **Revenue-only via a dedicated event/builder**, not by passing `unitCost:null`
  through `POS_SALE_COMPLETED`. The codebase has one explicit builder per scenario
  (sale, void, ticket-COGS, AP invoice/settlement, AR settlement); a dedicated
  `buildTicketInvoiceRevenueEntry` matches that and states intent, rather than
  relying on a subtle null to suppress COGS.
- **One invoice per ticket (no schema change)**, not an `invoiced` charge status
  with incremental invoicing. Conservative scope per the H-track rule; the enum
  change + partial-billing lifecycle is a real feature deferred to Phase 8.
- **No blanket checkout guard.** Blocking every POS `part` line that carries a
  `serviceTicketId` would break the legitimate "sell an extra accessory at pickup"
  flow. The precise guard (reject a checkout part line whose item the ticket has
  already consumed) has genuine edge cases (sell 2, consume 1). The substantive fix
  is the correct path existing; the wrong path's boundary is documented, and the
  e2e test is updated to exercise the **correct** path instead of the bug.

## Steps

1. `lib/invoice-number.ts` — extract `allocateInvoiceNumber(tx, tenantId)`; switch
   checkout to it (behavior identical). Unit test the format.
2. `modules/finance/ledger.ts` — add `buildTicketInvoiceRevenueEntry` (pure) +
   `TICKET_INVOICE_CREATED` event + subscription (`postTicketInvoiceRevenue`).
3. `services/event-bus.ts` — add `TICKET_INVOICE_CREATED`.
4. `modules/tickets/service.ts` — add `generateTicketInvoice(tenantId, ticketId,
   input)`: one transaction (select billable charges, allocate number, insert
   invoice + lines, guard double-invoice), emit `TICKET_INVOICE_CREATED` after commit.
5. `modules/tickets/types.ts` — `generateTicketInvoiceInput` Zod schema.
6. `routes/tickets.ts` — wire the route (auth + `ticket.manage_charges` + audit +
   idempotency, matching the sibling charge routes).
7. Tests + live run + e2e extension (below).

## Verification

- [ ] Unit: `buildTicketInvoiceRevenueEntry` posts a single revenue entry, no COGS;
      `allocateInvoiceNumber` format test.
- [ ] Unit: billable-charge selection (pure helper) — includes consumed parts +
      approved labor/fee, excludes estimated/approved-part/cancelled.
- [ ] `npm test` green (unit + e2e), `npx tsc --noEmit` clean, `svelte-check` clean.
- [ ] **Live API run** (recorded, DB reset after): a ticket with a consumed part +
      labor → `POST /invoice` creates one invoice; **stock unchanged** (no second
      deduction — `GET /inventory/reconciliation` clean); ledger shows revenue =
      grandTotal for the invoice **and** the pre-existing consumption COGS, with no
      duplicate COGS; a second `POST /invoice` → 409 `TICKET_ALREADY_INVOICED`; a
      ticket with nothing billable → 422 `NOTHING_TO_INVOICE`.
- [ ] **e2e** (`e2e-service-flow.test.ts`): replace the "DISCOVERED GAP" double-
      deduct test with the correct path — invoice the ticket's parts+labor via
      `POST /invoice`, assert **ledger revenue = full-repair invoice grandTotal**,
      no stock re-deduction, `/reconcile` (stock) and `/ledger/reconcile` both clean.
      This is what flips H15 gap (a) from `[/]` to proven.

## Watch out

- **Do not reuse `buildSaleEntries` for the ticket invoice** — it posts COGS, which
  is already on the consumption entries. Double COGS is the one bug this task must
  not ship.
- Emit `TICKET_INVOICE_CREATED` **after** the transaction commits, like every other
  ledger event — a ledger failure must never roll back an issued invoice.
- Keep the checkout numbering swap purely mechanical; if `npm test` moves at all
  after step 1, the extraction was not faithful — stop and diff.
- DB-reset hygiene: any live run leaves no invoices behind (`npm run db:reset`).
