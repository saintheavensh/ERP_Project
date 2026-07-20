# H15 — End-to-End Verification

> The original task **3E**, finally possible.
> Size: M · Risk: low — but this is the task that proves everything else

## Goal

Walk one repair from intake to close, with money and stock correct at every step, and
capture it as an automated test.

## Why

3E has been blocked since Phase 3 because diagnosis, approval, reservation, ticket-linked
consumption, ledger posting, and labor billing did not exist. After H6–H14 they all do.

This is the task that converts "each piece works" into "the system works." Every prior
task verified itself in isolation; none proved they compose.

## The flow

```
Intake → Diagnosis → Quotation → Approve → Reserve → Repair (consume) → QC → Invoice → Pay → Close
```

| Step | Exercises |
|---|---|
| Intake | ticket creation, flow engine start node |
| Assign technician | [H8](./H8-technician-and-customer.md) |
| Diagnosis | flow transition, stage history |
| Add charges (2 parts + labor) | [H7](./H7-ticket-charges.md) |
| Quotation | estimated total → `approval_requests.amount` |
| Approve | charge status → approved, **stock reserved** ([H10](./H10-stock-reservation.md)) |
| Attempt POS sale of the reserved part | **must fail 422** — the key cross-check |
| Consume parts | FIFO deduction, true cost ([H9](./H9-ticket-parts-consumption.md)) |
| QC → Completion | transition to terminal node |
| Invoice | parts + labor lines ([H6](./H6-labor-billing.md)) |
| Partial payment | [H14](./H14-payments.md) |
| Final payment | status → paid |
| Close | terminal node sets `status='closed'`, `closedAt` |

## Steps

1. Write it as an **integration test** (`src/__tests__/e2e-service-flow.test.ts`) against a
   dedicated test database, not the dev one. Seed fresh, run the flow, assert at each step.
2. Assert the invariants that matter, not just HTTP 200s:
   - stock decreased by exactly the consumed quantity
   - `quantityReserved` returned to 0 after consumption
   - ledger revenue = invoice `grandTotal`
   - ledger COGS = Σ actual batch costs consumed
   - **ticket margin = revenue − COGS**, and it is positive — the question the whole app
     exists to answer
   - ticket `status='closed'` with a populated `closedAt`
3. Add the negative paths, which is where bugs actually hide:
   - transition that the flow template forbids → 409
   - consume without approval → 409
   - sell reserved stock → 422
   - overpay → 422
4. Walk the same flow manually in the UI and record the click-path in `PHASES.md`, per the
   Definition of Done.
5. Add a test-database setup script and a `test:e2e` npm script.

## Verification

- [ ] The full happy path passes as an automated test
- [ ] All four negative paths return the correct status codes
- [ ] Ledger entries balance against invoice totals
- [ ] Ticket margin calculation is correct and positive
- [ ] Stock reconciliation ([H4](./H4-constraints.md)) reports zero drift afterward
- [ ] The manual UI walk-through completes with no dead ends or console errors
- [ ] `npm test` runs unit + e2e green from a clean database

## Watch out

- **Use a separate test database.** Running this against the dev database will consume real
  stock and leave junk tickets. Add `DATABASE_URL_TEST` and fail loudly if it is unset —
  never let the e2e suite silently default to the dev database.
- Seed deterministically. A test depending on whatever happens to be in the database will
  pass today and fail next week for reasons nobody can reconstruct.
- If a step cannot be completed, **do not mark 3E `[x]`** — record what is missing, per the
  Definition of Done. Writing an honest `[/]` here is the entire lesson of the 2026-07-20
  audit.
- The manual walk-through is not redundant with the automated test. It catches UI dead ends
  the API test cannot see.
