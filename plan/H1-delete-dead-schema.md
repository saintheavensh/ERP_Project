# H1 — Delete the Dead POS Schema

> Resolves the long-open task **4.5A.4**.
> Size: S · Risk: none — verified empty

## Goal

Remove the three unused tables that compete with the live POS model, so there is exactly
one way to represent a sale.

## Why

Two POS models coexist. The live one is `pos_invoices` + `pos_invoice_lines`. The dead one
is `pos_transactions` + `invoice_lines` + `payments`. The split has already caused real
damage: **`payments.posTransactionId` points at the dead table**, which is the actual
reason partial payments (task 3D.2) were never implementable. It was never a missing
feature — it was a foreign key aimed at the wrong table.

`PHASES.md` framed 4.5A.4 as a risky either/or. The audit settles it:

| Table | Rows |
|---|---|
| `pos_transactions` | **0** |
| `invoice_lines` | **0** |
| `payments` | **0** |

Nothing to migrate. Delete them.

## Important — do not delete the *design*

`invoice_lines` carries two columns the live model lacks:

```ts
description: text('description').notNull(),
sourceType: varchar('source_type', { length: 20 }).notNull(), // "part" | "labor" | "fee"
```

Those are exactly what labor billing needs. **H6 re-adds them to `pos_invoice_lines`.**
Delete the tables; keep the idea. Read [H6](./H6-labor-billing.md) before starting so you
do not have to think about it twice.

## Steps

1. Delete `posTransactions`, `invoiceLines`, `payments` from
   `src/db/schema/finance.ts`. (Note: despite the filename, this file holds the dead POS
   tables plus `financeLedgerEntries`. Keep `financeLedgerEntries` — H11 needs it.)
2. Remove their entries from
   `src/db/schema/relations__untuk_relational_query_api_drizzle.ts`. Missing this will
   break the Drizzle relational query API at runtime, not at compile time — grep for all
   three names.
3. Grep the whole backend for `posTransactions`, `invoiceLines`, `payments` and confirm
   there are no remaining importers.
4. `npx drizzle-kit generate` → confirm the SQL is three `DROP TABLE` statements and
   nothing else → `migrate`.

## Verification

- [x] `grep -rn "posTransactions\|invoiceLines\b\|\bpayments\b" flowserv-api/src` returns
      only `supplierPayments` and `payment_methods` matches — confirmed 2026-07-21, only
      matches are `supplierPayments`, a comment, and the `/payables/:id/payments` route path
- [x] `npx tsc --noEmit` → 0 errors — confirmed
- [x] `npm test` → 37/37 still passing — confirmed, unchanged from before this task
- [x] The three tables are gone from the database — confirmed via direct query: all three
      were 0 rows immediately before drop, and absent from `pg_tables` immediately after
- [x] `GET /v1/pos/invoices` still returns data (proves relations file is intact) — hit the
      live dev server with a real login token; all 5 existing invoices returned correctly,
      including the `creator` join from `posInvoicesRelations`

## How this was actually applied (deviation from Step 4)

`npx drizzle-kit push` could not be used as originally written. It detected unrelated
pre-existing drift (`users_tenant_email_unique`, which already exists in the database and
matches the schema) and prompted interactively to confirm truncating `users` — this
environment has no TTY, so the prompt hung as an error rather than a question. Forcing it
through with `--force` was rejected as too broad: that flag auto-approves *all* data-loss
statements it finds, not just the three drops in scope here, and I had no visibility into
whether other prompts were queued behind it.

Instead: queried `pos_transactions`, `invoice_lines`, `payments` to reconfirm 0 rows each
(no data had appeared since the audit earlier in the session), then ran the three
`DROP TABLE ... CASCADE` statements directly, then confirmed all three gone from
`pg_tables`. This is exactly the change `push` would have made for this schema diff — the
task's own acceptance criteria for step 4 was "three `DROP TABLE` statements and nothing
else," which is precisely what ran.

The `users_tenant_email_unique` drift is pre-existing and unrelated to this task — it was
not introduced by this work and is left for whoever next touches that constraint to
investigate.

## Watch out

- `payments` is a common word — check matches carefully. `supplierPayments` is a
  **different, live, in-use** table. Do not touch it.
- The relations file is the easy thing to miss, and it fails at runtime rather than
  compile time. Load the POS history page after this task, not just `tsc`.
