# F8 — Refresh the stale spec status headers

> **Size:** S · **Layer:** docs · **Priority:** now
> **Goal:** Stop the `specification/features/*.md` status headers from lying, the same way the
> 2026-07-20 audit stopped `PHASES.md` from lying.

## Problem
The "Implementation status" headers are all dated **2026-07-20 — before the Hardening Track**.
Six now understate reality; leaving them is exactly the drift that caused the Phase 3.5 recovery.

## Headers to correct (with what's now true)
- `02-service.md` — estimation (H7 charges/margin) and **parts reservation (H10)** are BUILT; a
  Diagnosis node exists. Remove them from "Not built".
- `03-service-billing.md` — quotation (H7), **service invoice from ticket (H17)**, and payment
  (H14) are BUILT. Header currently says "Not started" — badly stale.
- `05-technician.md` — **technician assignment backend (H8)** + `assignedTechnicianId`/`assignedAt`
  exist and a Technician user is seeded; only skills/scheduling/commission remain unbuilt.
- `06-inventory.md` — **parts reservation / soft-lock is BUILT (H10)**; `quantity_reserved` is now
  genuinely written. Remove the "only ever written as 0" claim.
- `08-sales-pos.md` — **POS↔ticket billing is BUILT via H17** (on the ticket module). Remove the
  "nothing consumes serviceTicketId" claim; also the "two competing POS models" note is stale
  (dead schema deleted in H1).
- `10-finance.md` — **finance ledger is BUILT (H11)**: event-driven revenue + COGS, void reversals,
  ticket-consumption COGS, and **AR (H14)**. Remove "never written to by any route / largest gap".
  What genuinely remains: double-entry / COA / journal / P&L.

## Still-accurate (leave alone, or add one clarifying line)
- `01-customer-device.md`, `09-supplier.md`, `11-warranty.md` headers are still accurate
  (H-track didn't touch them). For `11-warranty.md`, coordinate with **F6** (note the orphaned
  table is being removed/adopted).

## Verification (Definition of Done)
- Each edited header states what is actually built vs not, cross-checked against the real endpoint
  inventory (see `plan/README.md`). No code change; docs only.

## Watch out
- Keep the "this catalog is the vision, not current scope" framing — don't turn a status header into
  a to-do list. State reality, briefly.
