# Sales & POS Features

> **Implementation status (2026-07-20):** Partial
> **Built:** POS checkout with FIFO stock deduction and row locking, insufficient-stock
> rejection (422), invoice history, invoice detail, void with stock restoration and
> guards against over-restoring or double-voiding, held/draft carts, flat discount
> amount, cash/transfer/qris/split/tempo payment methods.
> **Not built:** sales returns, discount approval thresholds, sales dashboard, and
> POS-to-service-ticket linkage for billing (the `serviceTicketId` field is accepted
> but nothing consumes it yet).
> **Note:** two POS data models exist in the schema — `pos_invoices`/`pos_invoice_lines`
> (used) and `pos_transactions`/`invoice_lines`/`payments` (dead, never written to).
> Consolidating them is scheduled for Phase 4.5A.

## Purpose
Process point-of-sale transactions — both linked to service tickets and standalone retail sales.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| SAL-001 | Foundation | POS supports two modes: linked (from service ticket) and standalone (walk-in retail) | Same POS engine for both |
| SAL-002 | Walk-In Sales | Direct retail sale of parts/accessories without a service ticket | Stock consumed via FIFO |
| SAL-003 | Linked to Ticket | Service ticket completion auto-creates POS transaction with parts + labor | Items pre-filled from ticket |
| SAL-004 | Payment Processing | Support: cash, bank transfer, QRIS, partial/DP payments. Multiple methods per transaction | Track each payment entry |
| SAL-005 | Returns | Process sales return with reason. Restock if applicable. Reversal entry in finance | Needs Branch Mgr approval |
| SAL-006 | Discounts | Apply discount with threshold rules. Above threshold needs Branch Mgr approval | Configurable thresholds |
| SAL-007 | Dashboard | Sales volume, revenue by period/branch/category, top products | Phase 2 |
| SAL-008 | Business Rules | Cannot void without approval, discount limits per role, stock must be available | System-enforced |

## Integration
- **Service**: Ticket completion triggers POS transaction creation
- **Inventory**: Sales consume stock via FIFO batches
- **Finance**: Payments post to finance ledger (revenue, COGS)
- **Printer**: Receipt printed via thermal printer agent
