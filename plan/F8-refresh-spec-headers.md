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

## Verification (Definition of Done) — DONE 2026-07-23
- Rewrote all 6 headers (`02-service.md`, `03-service-billing.md`, `05-technician.md`,
  `06-inventory.md`, `08-sales-pos.md`, `10-finance.md`) per the list above, and also folded
  in what F1–F7 (done the same day, after this task file was written) additionally made true —
  technician assignment UI + My Jobs filter (F1/F2), ticket cancellation (F3), item edit (F4),
  dynamic margin config (4C.1) — so the headers reflect the actual end-of-day state, not just
  the H-track snapshot this file was drafted from.
- `01-customer-device.md` got one clarifying line (F7's device→intake link, since it's directly
  in this doc's scope) rather than a full rewrite, per "still-accurate, add one line if relevant."
  `09-supplier.md` was left untouched — nothing in Track F or 4C.1 touched the supplier module
  itself, so its 2026-07-20 header is still accurate as written.
- `11-warranty.md` was updated by **F6**, not here (coordinated per this file's own note).
- No code changed — docs only. `npx tsc --noEmit` / `npx svelte-check` not applicable; confirmed
  no other file changed in this commit.

## Watch out
- Keep the "this catalog is the vision, not current scope" framing — don't turn a status header into
  a to-do list. State reality, briefly. (Followed: every header still separates **Built** from
  **Not built** in 1–2 sentences each, not a checklist.)
