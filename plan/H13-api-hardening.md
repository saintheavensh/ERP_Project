# H13 — Audit Log, Pagination, Idempotency

> The original tasks **4.5C** and **4.5D.1–.2**.
> Size: M · Risk: low individually, but idempotency matters more than it looks

## Goal

Know who changed what, stop truncating lists silently, and survive a retried request.

## Part 1 — Audit log (4.5C)

`auditLogs` is fully designed — tenant, actor, action, entity type/id, a `changes` JSONB
for before/after, IP, timestamp — and **written by nothing**.

```ts
// middleware/audit.ts — runs after the handler, records only successful mutations
export const auditMiddleware = async (c: Context, next: Next) => { ... };
```

Apply to every mutating endpoint. Record `action` as `<entity>.<verb>`
(`ticket.transition`, `invoice.void`, `stock.adjust`), matching the examples already in the
schema comments.

**Do not log request bodies wholesale** — they contain passwords on auth routes. Use an
explicit allowlist of fields per entity, or record only the changed columns.

Then `GET /v1/audit-logs` with filters, admin-only (depends on [H12](./H12-rbac.md)).

## Part 2 — Cursor pagination (4.5D.1)

Every list endpoint has a hardcoded `limit: 100` — `pos/invoices.ts:48`, tickets,
inventory. At 100 records this is invisible. At 101 the user silently sees a truncated list
with **no indication anything is missing**, which is worse than an error.

Build `lib/pagination.ts` per `coding-guidelines.md` §3.5 and apply to tickets, POS
invoices, inventory, stock movements, and audit logs:

```json
"meta": { "next_cursor": "eyJpZCI6MTAwfQ==", "has_more": true }
```

Cursor on `(createdAt, id)` — `createdAt` alone is not unique and will skip or repeat rows
when two records share a timestamp. This is a classic bug; encode both.

## Part 3 — Idempotency (4.5D.2)

`coding-guidelines.md` §3.4 names three endpoints that must accept `Idempotency-Key`. None
do.

This matters more here than in a typical web app: **FlowServ is a local-first LAN
application running on shop WiFi.** Unreliable networks are the normal case, not the edge
case. A retried POS checkout today double-deducts stock and double-charges the customer.

```ts
export const idempotencyKeys = pgTable('idempotency_keys', {
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  key: text('key').notNull(),
  endpoint: text('endpoint').notNull(),
  responseStatus: integer('response_status').notNull(),
  responseBody: jsonb('response_body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.tenantId, t.key] }) }));
```

Apply to:
- `POST /v1/pos/invoices` (checkout)
- `POST /v1/tickets/:id/transition`
- `POST /v1/tickets/:id/charges/:chargeId/consume` (from [H9](./H9-ticket-parts-consumption.md))
- `POST /v1/finance/payables/:id/payments`

On a repeated key, replay the stored response without re-executing. Insert the key **inside
the business transaction** so a rollback also discards the key — otherwise a failed request
poisons the key and the legitimate retry is refused.

The frontend must generate and reuse a key per user action (a `crypto.randomUUID()` created
when the checkout modal opens, not when the request fires — regenerating on retry defeats
the entire mechanism).

## Verification

- [ ] Every mutation writes exactly one audit row with correct actor and entity
- [ ] No password or token value appears anywhere in `audit_logs.changes`
- [ ] Creating 150 tickets and paging through returns all 150, no duplicates, no gaps
- [ ] Two records sharing a `createdAt` still page correctly (this is the bug to hunt)
- [ ] Same `Idempotency-Key` twice → one invoice, one stock deduction, identical response
- [ ] Different keys → two invoices
- [ ] A failed request does not burn its key; the retry succeeds
- [ ] Client generates the key once per action and reuses it across retries
- [ ] `npm test` passing with pagination and idempotency tests

## Watch out

- **The transaction boundary is the whole trick.** Key stored outside the transaction and
  the request fails → the retry is wrongly rejected as a duplicate. Test the failure path,
  not just the happy path.
- `crypto.randomUUID()` on retry is the most common client-side mistake. Generate once,
  store in component state.
- Audit middleware must run **after** the handler and only on success — logging attempted
  mutations that rolled back makes the log actively misleading.
- Add an eventual cleanup for `idempotency_keys` (24h is plenty). Not urgent, but note it
  so the table does not grow forever.
