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

## Verification (Definition of Done) — DONE 2026-07-23
- New permission `ticket.cancel` (H12-style, `db/seed/ids.ts` + `01-core.ts`), granted to
  Manager only (SVC-013 lists CS/Branch Mgr; Manager is this codebase's stand-in — see the
  existing H12 note). `POST /v1/tickets/:id/cancel` gated by `requirePermission('ticket.cancel')`
  + `zValidator` (`reason` required) + `auditMiddleware`.
- `cancelTicket()` (`modules/tickets/service.ts`): locks the ticket `FOR UPDATE`, rejects
  non-`open` tickets with 409 `TICKET_NOT_CANCELLABLE` (pure `canCancelTicket()` decision,
  3 new unit tests), releases the H10 reservation on every `approved` part charge via the
  same `releaseReservation` `cancelCharge` uses, flips every `estimated`/`approved` charge to
  `cancelled`, sets the ticket `status='cancelled'` + `closedAt`, and writes a
  `ticket_stage_history` note (`"Dibatalkan: <reason>"`). Consumed parts are left alone —
  the response returns `consumedPartsLeftBehind` so the caller can surface a warning instead
  of silently ignoring it.
- **Live API run** (real login, curl, against a freshly reset DB): quoted a ticket for 1× LCD
  Samsung A10 → `stock_levels.quantityReserved` went 0→1 → cancelled the ticket →
  `releasedPartsCount: 1`, `quantityReserved` back to 0, `GET /v1/inventory/reconciliation`
  stayed `{isClean: true, drift: []}` both before and after, the charge's status flipped to
  `cancelled`, and the history entry `"Dibatalkan: Customer tidak jadi servis"` appeared.
  Cancelling the same ticket again → 409 `TICKET_NOT_CANCELLABLE`.
- **RBAC, verified under `RBAC_MODE=enforce`** (not just report mode, which would have hidden
  a wrong grant): Cashier and Technician → 403 `PERMISSION_DENIED` naming `ticket.cancel`;
  Manager → 200.
- FE: `TicketDetailState` (`canCancel`, `openCancelModal`, `confirmCancelTicket`) + a new
  `TicketCancelModal.svelte` (reason textarea, required) + a "Batalkan Tiket" button in
  `TicketWorkspace.svelte`'s header, shown only while `status === 'open'`. A
  `consumedPartsLeftBehind > 0` response surfaces as a warning via the existing
  `state.successMsg` banner (already rendered in `TicketCharges.svelte`).
- `npm run test:unit`: 140/140 (was 137, +3 for `canCancelTicket`). `npx tsc --noEmit` (API)
  and `npx svelte-check` (web, 697 files) both clean.
- DB reset to clean seed state afterward (`npm run db:reset`); the dev server instances
  started for this check were stopped.

## Watch out
- **Lock order:** follows the existing convention — the ticket row is locked first, then
  `releaseReservation` locks `stock_levels` per item inside the loop, same order
  `generateQuotation` already uses.
- **Consumed-parts policy (decided):** a cancelled ticket does NOT auto-return consumed parts
  to stock — that's a physical parts-return decision, not implied by abandoning the job. The
  API reports the count (`consumedPartsLeftBehind`) and the FE turns it into a visible warning
  rather than staying silent about it.
