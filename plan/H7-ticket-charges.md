# H7 — `ticket_charges`: Tickets That Hold Money

> The structural gap behind most of the unbuilt Phase 3 tasks.
> Size: L — split it if it stalls · Risk: 🟡 R6

## Goal

A service ticket can accumulate parts and labor, produce a quotation, and answer
"did we make money on this repair?"

## Why

`service_tickets` holds: tenant, branch, customer, asset, flow template, current node,
status, timestamps. **That is all.** No estimated cost, no approved quote, no parts, no
labor, no total. The ticket is a status token that moves between nodes.

This one absence explains a cluster of unbuilt tasks:

| Blocked | Because |
|---|---|
| 3C.4 parts consumption from a ticket | nowhere to record what was used |
| 3C.3 parts reservation | nothing to reserve *against* |
| SVC-006 diagnosis & estimation | no estimate field |
| SVC-007 customer approval | `approval_requests.amount` exists but nothing computes it |
| SBL-001 quotation | no line items to quote |
| ticket profitability | no cost, no revenue |

`approval_requests` already has an `amount` column waiting for a number that nothing
produces. That column is the tell — the design anticipated this and the schema was never
finished.

## Design

One table, holding both estimates and actuals, so a quotation is simply the charges in
`estimated` state:

```ts
export const chargeStatusEnum = pgEnum('charge_status', ['estimated', 'approved', 'consumed', 'cancelled']);

export const ticketCharges = pgTable('ticket_charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),

  sourceType: lineSourceEnum('source_type').notNull(), // reuse H6's enum: part | labor | fee
  description: text('description').notNull(),

  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').references(() => partBrands.id),

  quantity: integer('quantity').notNull(),
  unitPrice: money('unit_price').notNull(),   // what the customer pays
  unitCost: money('unit_cost'),               // filled at consumption from FIFO batches

  status: chargeStatusEnum('status').notNull().default('estimated'),

  // Set when the charge is actually consumed, linking to the real stock movement.
  stockMovementId: uuid('stock_movement_id').references(() => stockMovements.id),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (t) => ({
  ticketIdx: index('ticket_charges_ticket_idx').on(t.ticketId),
}));
```

The lifecycle mirrors the real shop workflow:

```
estimated  → technician diagnoses, adds expected parts + labor
approved   → customer accepts the quote (approval_requests.amount = SUM of estimated)
consumed   → part physically taken from stock (H9 sets unitCost + stockMovementId)
cancelled  → job abandoned or part not needed
```

Add to `service_tickets` (denormalized totals, for list views that must not aggregate):

```ts
estimatedTotal: money('estimated_total').notNull().default('0'),
approvedTotal:  money('approved_total'),
```

## Steps

1. Create the table and the two ticket columns.
2. `modules/tickets/service.ts` — this task is the natural point to migrate tickets out of
   `routes/tickets.ts` into a proper module (see [H16](./H16-module-migration.md)). Do the
   move as part of this work, not separately.
3. Endpoints:
   - `POST   /v1/tickets/:id/charges` — add an estimated charge
   - `PATCH  /v1/tickets/:id/charges/:chargeId` — edit while still `estimated`
   - `DELETE /v1/tickets/:id/charges/:chargeId` — only while `estimated`
   - `GET    /v1/tickets/:id/charges` — list with totals
   - `POST   /v1/tickets/:id/quotation` — freeze estimates, write `approval_requests.amount`
4. Pure functions in `service.ts`, tested without a database:
   - `calculateTicketTotals(charges)` → estimated / approved / consumed totals
   - `canModifyCharge(charge)` → only `estimated` charges are editable
   - `calculateTicketMargin(charges)` → revenue − cost, the question the app exists to answer
5. Frontend: a charges section on the ticket detail page — add part, add labor, show running
   total, "Request Approval" button.

## Verification

- [ ] Add 2 parts + 1 labor charge to a ticket; `GET` returns all three with a correct total
- [ ] `estimatedTotal` on the ticket matches the sum of its estimated charges
- [ ] `POST /quotation` writes the correct `amount` into `approval_requests`
- [ ] An `approved` charge cannot be edited or deleted (409)
- [ ] `calculateTicketMargin` returns revenue − cost correctly, including a zero-cost labor
      line — unit tested with no database
- [ ] Click-path: open a ticket, add a part and a labor charge, request approval, see the
      quoted total
- [ ] `npm test` passing with new tests for all three pure functions

## Watch out

- **Scope.** This is the largest task in the track. If it stalls, split it: (a) table +
  CRUD + totals, (b) quotation and approval wiring. Ship (a) first.
- Charges are **estimates until consumed**. Do not touch stock here — that is
  [H9](./H9-ticket-parts-consumption.md). Keeping the two separate is what makes
  reservation possible in H10.
- `unitPrice` on a part charge should default from the item's selling price but stay
  editable — technicians negotiate. Do not hard-wire it.
- Do not add a `total` column to `ticket_charges`. It is `quantity × unitPrice`; storing it
  invites the two disagreeing.
