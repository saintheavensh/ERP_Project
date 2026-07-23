# Service Billing Features

> **Implementation status (2026-07-23, refreshed from 2026-07-20 — see F8):** Partial
> **Built:** quotation (freezes estimated charges into an approved quote and reserves
> their parts, H7), service invoice generation from a ticket's billable charges —
> consumed parts + approved labor, no double-deduct (H17, closes SBL-003), and
> payment processing including partial payments against an invoice (H14, closes
> SBL-004). The POS invoice flow is no longer retail-only — it's the same
> `pos_invoices` row a service ticket invoices into.
> **Not built:** a dedicated pre-repair deposit (DP) concept distinct from a partial
> payment against an already-generated invoice (SBL-002), and refund (SBL-005 — the
> `finance.approve_refund` permission exists but nothing calls it). Both remain
> Phase 8.

## Purpose
Manage the financial lifecycle of service tickets: quotation → deposit → invoice → payment → refund.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| SBL-001 | Quotation Management | Create repair estimate with: repair category, labor cost, spare part cost, estimated time | Sent to customer for approval |
| SBL-002 | Deposit (DP) Management | Accept partial payment (down payment) before or during repair | DP deducted from final invoice |
| SBL-003 | Invoice Generation | System auto-generates invoice from consumed parts + labor charges on ticket | Linked to POS transaction |
| SBL-004 | Payment Processing | Process final payment. Support: cash, transfer, QRIS. Handle partial payments | Multiple payment methods per invoice |
| SBL-005 | Refund | Process refund with approval. Record reason. Create reversal entry in finance | Requires Finance/Branch Mgr approval |
| SBL-006 | Revenue Dashboard | Service revenue by period, category, branch, technician | Phase 2 |

## Integration
- **Service**: Quotation created during diagnosis, invoice created at completion
- **POS**: Service billing creates POS transaction records
- **Finance**: Payments post to finance ledger automatically
