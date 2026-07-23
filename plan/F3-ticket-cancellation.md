# F3 — Ticket cancellation (make the dead `cancelled` status real)

> **Size:** M · **Layer:** BE+FE · **Priority:** now
> **Goal:** A ticket can be cancelled with a reason, and its reserved parts are released.

## Problem (the dishonest flow)
`service_tickets.status` has a valid `'cancelled'` value and the workspace UI even has a
"cancelled" branch, but **nothing can transition a ticket into it**. Worse, a ticket that was
quoted holds reserved stock (H10) — abandoning it would **leak the reservation forever**, and
POS would keep refusing to sell those parts. This is SVC-013 (MVP) and a real stock-integrity
hole.

## Files to touch
- `flowserv-api/src/modules/tickets/service.ts` — add `cancelTicket(tenantId, ticketId, reason, actor)`.
- `flowserv-api/src/routes/tickets.ts` — add `POST /:id/cancel` (Zod body `{ reason }`),
  gated by an appropriate RBAC permission + `auditMiddleware` (`ticket.cancel`).
- `flowserv-web/src/lib/states/tickets/ticket.detail.svelte.ts` + `TicketWorkspace.svelte` —
  a "Batalkan Tiket" action with a reason prompt.

## Steps (backend)
1. In one `db.transaction()`:
   - Load the ticket `FOR UPDATE`; reject if already `closed` or `cancelled` (409 `TICKET_NOT_CANCELLABLE`).
   - For every charge on the ticket in a **reserved** state (`approved`), call `releaseReservation`
     (reuse the H10 function — the same one `cancelCharge` uses) so `quantityReserved` drops.
     Consumed charges are **not** auto-returned here (that's a physical return decision) — but
     document that a cancelled ticket with consumed parts leaves them consumed; surface a warning.
   - Set `status='cancelled'`, record the reason, write a `ticket_stage_history` note
     ("Dibatalkan: <reason>").
2. Emit nothing to the ledger (no money moved). Verify `GET /v1/inventory/reconciliation` stays clean.

## Verification (Definition of Done)
- Recorded API run: quote a ticket (reserves a part) → cancel it → the reserved qty returns to 0,
  reconciliation clean, status `cancelled`, history note present. Cancelling a `closed` ticket → 409.
- New unit test for the reserved-release path if the logic is non-trivial.
- `npx tsc --noEmit` + `npx svelte-check` clean.

## Watch out
- **Lock order:** follow the existing convention (batches → stock_levels, or the order used by
  `releaseReservation`) to avoid a deadlock with concurrent consume/return.
- Decide and document the "consumed parts on a cancelled ticket" policy — don't silently ignore it.
