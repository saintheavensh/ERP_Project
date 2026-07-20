# H8 — Technician Assignment and Customer Links

> Two small columns that unblock a surprising amount of Phase 5.
> Size: S · Risk: low

## Goal

Know who is working on a ticket, and who owes you money.

## Why

### No technician exists anywhere in the schema

```bash
grep -ri "technician\|assigned" flowserv-api/src/db/schema   # → 0 matches
```

There is no `assignedTechnicianId`, no skills table, no workload data. Meanwhile the
feature catalog marks TECH-001…TECH-015 as mostly MVP ✅, and **Phase 5.8 is "Technician
Dashboard: My Jobs."**

There is currently no way to know whose jobs they are. Phase 5 hits this wall on day one.
One column now avoids a schema migration in the middle of UI work.

### Customer money is recorded against a free-text string

```ts
// pos.ts:30
customerName: text('customer_name'), // Opsional untuk walk-in tunai, wajib untuk tempo
```

`pos_invoices` has **no `customerId`**, even though `customers` exists and tickets
reference it properly. Consequences:

- FIN-003 Accounts Receivable (MVP ✅) is impossible — "what does this customer owe us?"
  has no answer
- A `tempo` (credit) sale records the debt against a **string**
- Two sales to "Budi" may or may not be the same Budi

The asymmetry is stark: supplier debt is fully modelled (`supplier_invoices` +
`supplier_payments` + aging), customer debt has nothing.

**Fix before Phase 10.** Once real sales are recorded against free-text names, they cannot
be reliably reconciled back to customer records — you are left guessing which "Budi" is
which.

## Steps

### 1. Technician on tickets

```ts
// service_tickets
assignedTechnicianId: uuid('assigned_technician_id').references(() => users.id),
assignedAt: timestamp('assigned_at', { withTimezone: true }),
```

Nullable — a ticket at intake has no technician yet.

- `POST /v1/tickets/:id/assign` — body `{ technicianId }`, writes both columns and an audit
  trail entry
- `GET /v1/tickets?assignedTo=me` — the query behind "My Jobs"
- Record reassignment in `ticket_stage_history` notes (TECH-015 wants a reason; a note is
  enough for now)

Do **not** build skills, auto-assignment, or workload heatmaps here. Those are Phase 8.
This task is only the column and manual assignment.

### 2. Customer on invoices

```ts
// pos_invoices
customerId: uuid('customer_id').references(() => customers.id),
// keep customerName as a snapshot — it must survive a customer being renamed or deleted
```

Keep **both**. `customerId` is the link; `customerName` is what the invoice said at the
time. An invoice is a historical document and must not change when a customer record does.

Rules:
- `paymentMethod = 'tempo'` **requires** `customerId` — you cannot extend credit to a
  string. Enforce in Zod and with a CHECK constraint.
- Walk-in cash sales may leave it null.

Backfill: 5 existing invoices, all `cash`, all `customerName='Pelanggan Umum'` — leave
`customerId` null. Nothing to reconcile.

### 3. POS UI

Add optional customer selection to the POS screen, reusing `CustomerListModal.svelte`.
Make it **required** when `tempo` is chosen.

## Verification

- [ ] Assign a technician to a ticket; `GET /v1/tickets/:id` shows their name
- [ ] `GET /v1/tickets?assignedTo=<userId>` returns only that technician's tickets
- [ ] Reassignment records a history entry
- [ ] A `tempo` checkout without `customerId` is rejected (400) by both Zod and the CHECK
- [ ] A cash checkout without `customerId` still succeeds
- [ ] Renaming a customer does not change the name on their past invoices
- [ ] Click-path: assign a ticket, then filter the ticket list to that technician
- [ ] `npm test` passing

## Watch out

- `assignedTechnicianId` references `users`, not a separate technicians table. That is
  correct for now — a technician is a user with a role. Do not build a parallel identity.
- Do not make `customerId` `NOT NULL`. Walk-in cash sales are the common case and must
  stay frictionless; forcing customer creation at the till will make staff enter garbage.
- The CHECK for tempo needs both columns present:
  `CHECK (payment_method <> 'tempo' OR customer_id IS NOT NULL)`
