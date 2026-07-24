# Tahap A — Service Flow Templates + Print Triggers (plan)

> **Status: in progress, started 2026-07-24.** Branch: `golive/a-service-flow-templates`
> (branched from `phase-6/printer` HEAD, so the printer agent/scan/test-print work is
> available). Parent doc: [`plan/go-live-plan.md`](go-live-plan.md) Tahap A.
> **Convention:** this file lives only while Tahap A is active; on completion its
> evidence moves to `go-live-plan.md`'s progress log, same as every `H*`/`F*`/`6*` file.

## 1. What was found during investigation (2026-07-24)

- **No "keluhan/kerusakan" (reported complaint) field exists anywhere** — not on
  `service_tickets`, not on `customer_assets`, not in the intake Zod schema, not in
  `IntakeForm.svelte`. This is more basic than the printer plan's known gap ("no
  complaint/diagnosis columns") — it means the label/tanda-terima print requirement
  (`nama, kerusakan, tanggal masuk`) has no data source today. **Must be added first.**
- `IntakeForm.svelte` already has a **"Service Flow" dropdown** driven by
  `GET /v1/flows` — adding a second flow template (for "Disimpan") requires **no FE
  change** to appear as a choice; it just shows up.
- `generateQuotation()` (`modules/tickets/service.ts`) — flips `estimated` charges to
  `approved`, reserves stock, writes an `approval_requests` row with the quoted amount
  — **is** the "diagnosa selesai, harga diberikan" moment in both owner-described
  flows. This is the natural hook for the label + tanda-terima print trigger.
  Repeatable: nothing stops a second `addCharge` + `generateQuotation` cycle after the
  first, on the same ticket. Needs a live check but this may already BE "change order"
  wired at the data layer, just missing UI framing.
- `PrintButton.svelte` (built in 6B) is wired **only into POS** (`InvoiceDetailModal`).
  It is **not present anywhere in the ticket detail/workspace UI** — so even the
  already-existing service invoice (H17, `POST /tickets/:id/invoice`) has no "print"
  affordance today. Real gap, not just new-feature scope.
- Printer document types (`modules/printer/types.ts` `DOCUMENT_TYPES`): only
  `'receipt' | 'invoice_a4' | 'label'`. `label` has a seeded template (Q2 in
  `phase-6-printer.md`) but `SUPPORTED_DOCUMENT_TYPES` in `modules/printer/document.ts`
  only wires `'receipt'` and `'invoice_a4'` to a real data source (`pos_invoices`).
  `label` printing needs a **new data source: the ticket itself**, not an invoice.
- Existing flow template ("Standard Repair"): `Intake → Diagnosis → {Waiting Approval
  OR direct → Repair} → Repair → Completion`. Owner confirmed approval is **always**
  required in both paths — so "Diagnosis → Repair direct" (skipping approval) may no
  longer reflect real business rule; needs a decision (see §3).

## 2. Scope decisions (resolved before coding)

- **Q1 — One flow template or two?** → **One.** The owner's two paths (ditunggu/
  disimpan) share the same graph shape up through "diagnosis + price given"; the real
  difference is *how long the customer takes to approve* and *whether the unit
  physically leaves*, not a different node sequence. Modeling this as two entirely
  separate flow templates would duplicate Intake/Diagnosis/Repair/Completion and
  double the transition-permission config for no real gain. Instead: add a
  `serviceMode` field (`'ditunggu' | 'disimpan'`) on `service_tickets`, settable at
  intake and **changeable** mid-flow (the owner's own example: a ditunggu job can
  convert to disimpan after diagnosis reveals it needs more time). This field drives
  print-trigger and UI behavior; the flow graph itself stays one template.
- **Q2 — Does "Diagnosis → Repair direct" transition still make sense?** → **Keep it
  for now, don't remove.** Removing a transition is a real behavior change against
  existing e2e tests (21 integration tests walk this exact path) and real seeded data.
  "Approval always required" is satisfied because `generateQuotation` (which writes
  the `approval_requests` row) is what triggers printing — direct-to-Repair without a
  quotation simply won't have printed anything, which is a training/process concern,
  not a system gate to add right now. Revisit only if real pilot usage shows technicians
  skipping the quote step in practice.
- **Q3 — Sandi/pola (unlock code) placement** → new nullable `unlock_code` text column
  on `service_tickets`, captured at intake (optional field) and shown on the ticket
  workspace + printed on the label/tanda-terima.
- **Q4 — Label + tanda_terima render data source** → new `modules/printer/document.ts`
  function `renderServiceTicketDocument()` parallel to `renderPosInvoiceDocument()`,
  reading `serviceTickets` + `customers` + `customerAssets` (+ `approval_requests` for
  the quoted amount) instead of `posInvoices`. `GET /v1/print/documents/:documentType/:id`
  branches: `receipt`/`invoice_a4` → `id` is an invoice id (existing); `label`/
  `tanda_terima` → `id` is a **ticket** id (new).
- **Q5 — New document type `tanda_terima`** → add to `DOCUMENT_TYPES`, seed a template
  (mirrors `label`'s existing seed pattern), A4 or thermal per branch config (owner
  didn't specify a fixed size — leave configurable like every other document type).

## 3. Task breakdown

### A.1 — Schema: reported complaint + service mode + unlock code
- Add `service_tickets.reported_complaint` (text, nullable — old tickets have none),
  `service_tickets.service_mode` (varchar, default `'ditunggu'`), `service_tickets.unlock_code`
  (text, nullable).
- Intake Zod schema + route: accept `reportedComplaint` (required, it's the reason for
  the visit), `serviceMode` (default `'ditunggu'`), `unlockCode` (optional).
- `IntakeForm.svelte`: add "Keluhan / Kerusakan" (required textarea), "Sandi/Pola HP
  (opsional)" input, and a "Ditunggu / Ditinggal" toggle (default Ditunggu).
- New endpoint `PATCH /v1/tickets/:id/service-mode` (or fold into a general ticket
  PATCH) to flip `ditunggu → disimpan` mid-flow — owner's real scenario.
- *DoD: unit test on the mode-flip business rule (e.g. cannot flip a closed ticket);
  live intake with keluhan+sandi, confirmed on GET /tickets/:id.*

### A.2 — Verify "change order" is already supported
- Live-verify: after `generateQuotation`, add another charge, call `generateQuotation`
  again — confirm a second `approval_requests` row is created with the new amount and
  nothing about the first quote is corrupted.
- If confirmed working: no new backend code, just UI framing (a "Ada Temuan Baru?"
  action on the ticket workspace that's really just addCharge + re-quote, labeled for
  the technician's mental model).
- *DoD: recorded API sequence proving a second quotation cycle works cleanly.*

### A.3 — New print document types: `label` + `tanda_terima`
- `modules/printer/types.ts`: add `'tanda_terima'` to `DOCUMENT_TYPES`.
- `db/seed/08-printer.ts`: seed a `tanda_terima` template (mirrors `label`'s pattern).
- `modules/printer/document.ts`: `renderServiceTicketDocument()` — ticket + customer +
  asset + quoted amount → `DocumentData`. Label content: nama, kerusakan, tanggal
  masuk (per owner spec — no price on the label, that's what tanda terima is for).
  Tanda terima content: label content + kerusakan detail + harga disepakati + sandi/pola.
- Render endpoint branches on `documentType` for which id-space `:id` is in.
- *DoD: unit tests for the new render function (mirrors render.ts's existing test
  shape); curl proof against a real ticket.*

### A.4 — Wire print triggers into the ticket workspace
- On the ticket workspace, after `generateQuotation` succeeds: prompt "Cetak Label"
  (always) and "Cetak Tanda Terima" (only if `serviceMode === 'disimpan'`) using
  `PrintButton.svelte` (already built in 6B — needs a ticket-flavored variant or a
  `sourceType: 'ticket'` prop since it currently only knows `documentType` + `invoiceId`
  meaning a `pos_invoices` id).
- After `generateInvoice()` succeeds: surface "Cetak Invoice A4" (`PrintButton` already
  supports this shape since a ticket invoice IS a `pos_invoices` row) — this closes the
  real gap that ticket detail never had a print button at all.
- *DoD: Playwright — quotation → label prompt appears; disimpan ticket also shows tanda
  terima; invoice → print button appears and renders real content.*

## 4. Explicitly NOT in this tahap (per go-live-plan Tier 2/3)
- Discount caps per role, returns/exchange, tempo-per-customer eligibility (Tahap D).
- Branch data isolation, multi-role (Tahap C).
- Technician commission/salary, QC checklist, photo attachments, waiting-parts/talangan,
  WA automation (Tahap E / Phase 8).

## 5. Progress log

- [x] A.1 Schema: reported complaint + service mode + unlock code — 2026-07-24.
      `service_tickets.reported_complaint` (text, nullable), `.service_mode`
      (new `serviceModeEnum` — `'ditunggu'|'disimpan'`, default `'ditunggu'`),
      `.unlock_code` (text, nullable). Intake schema requires `reportedComplaint`
      (400 without it — live-verified), defaults `serviceMode` to `'ditunggu'`.
      New `PATCH /v1/tickets/:id/service-mode` (gated by `ticket.diagnose` — the
      closest coarse permission, per H12's philosophy; a dedicated permission for
      one field isn't warranted) flips the mode, records a `ticket_stage_history`
      note, blocked on a closed/cancelled ticket (`canChangeServiceMode`, 3 unit
      tests). `IntakeForm.svelte`: required keluhan textarea, Ditunggu/Disimpan
      toggle (default Ditunggu), optional sandi/pola input — the existing "Service
      Flow" dropdown needed no change since it already lists whatever flow
      templates exist. `TicketWorkspace.svelte`: new box showing keluhan, sandi/
      pola, and a mode toggle (only while ticket is open). Live-verified end to
      end: real intake with keluhan+disimpan+sandi → confirmed on GET; PATCH
      disimpan→ditunggu → confirmed + stage-history note appeared; intake without
      `reportedComplaint` → 400. `npx tsc --noEmit` + `npx svelte-check`: 0 errors.
- [x] A.2 Verify change-order primitive — 2026-07-24. **No new backend code
      needed.** `addCharge()` + `generateQuotation()` are already repeatable: a
      second cycle after the first approval creates a SECOND `approval_requests`
      row scoped to just the new charges (not cumulative), while
      `service_tickets.approvedTotal` correctly accumulates across both cycles.
      Live-verified on a real ticket: quote #1 (labor 150.000) → `approvedTotal`
      150.000; added a second labor charge ("temuan tambahan") → quote #2 → new
      `approval_requests` row for exactly 75.000, `approvedTotal` correctly
      225.000, both charges' status `approved`, nothing corrupted. Remaining work
      for this item is UI framing only (label the "add charge + re-quote" action
      as "Ada Temuan Baru?" on the workspace) — folded into A.4.
- [ ] A.3 Print document types: label + tanda_terima
- [ ] A.4 Wire print triggers into ticket workspace
