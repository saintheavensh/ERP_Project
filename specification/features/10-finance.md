# Finance Features

> **Implementation status (2026-07-20):** Partial — accounts payable only
> **Built:** accounts payable — outstanding payables list, invoice detail with full
> payment history, and recording full/partial supplier payments with overpayment and
> already-paid guards. Supplier invoices are created automatically by the purchasing
> costing step.
> **Not built — and this is the largest gap in the system:** the double-entry
> accounting engine. `finance_ledger_entries` exists in the schema and is **never
> written to by any route**, so there is no COGS posting, no revenue posting, no
> general ledger, no P&L, and no accounts receivable — even though the FIFO code
> already computes exact batch costs and discards them. Scheduled for Phase 4.5A.

## Purpose
Manage the complete financial lifecycle: cash management, accounts receivable/payable, double-entry accounting, and financial reporting.

## Two Dashboard Modes
- **Simple Mode** (Owner/Branch Mgr): "Today's Income", "Estimated Profit", simple trend graphs. No accounting jargon.
- **Accountant Mode** (Finance Staff): Full P&L, journal entries, general ledger, COA. Professional accounting view.

Same data source — only presentation differs.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| FIN-001 | Foundation | Event-driven finance: service/POS events auto-post to ledger | No manual posting for standard flows |
| FIN-002 | Cash Management | Track cash in/out per branch per day. Cash register opening/closing | Daily reconciliation |
| FIN-003 | Accounts Receivable | Track unpaid customer invoices | Auto-created from POS |
| FIN-004 | Accounts Payable | Track unpaid supplier invoices | Auto-created from PO |
| FIN-005 | Expense Management | Record operational expenses (rent, utilities, supplies) | Branch Mgr approval for large amounts |
| FIN-006 | Reimbursement | Process technician external purchase reimbursements | Phase 2. Finance approval |
| FIN-007 | Accounting Engine | Double-entry bookkeeping. Every debit has a credit | System-enforced |
| FIN-008 | Chart of Accounts | Configurable COA per tenant. Default template provided | Admin/Finance setup |
| FIN-009 | Journal Management | Create/view journal entries. Auto-generated from events, manual for adjustments | Manual journals need approval |
| FIN-010 | General Ledger | Complete ledger view with filtering by account, period, branch | Finance Staff access |
| FIN-011 | Profit & Loss | P&L report per branch, period, or consolidated. Real-time job costing per ticket | MVP: basic P&L |
| FIN-012 | Balance Sheet | Standard balance sheet report | Phase 2 |
| FIN-013 | Cash Flow Report | Cash flow statement | Phase 2 |
| FIN-014 | Export | Export reports to Excel/PDF | Phase 2 |
| FIN-015 | Business Rules | Ledger entries append-only, corrections via reversal, no negative balance on cash | System-enforced |
| FIN-016 | Opening Balance | Set initial account balances when starting the system | Phase 2. One-time setup |
| FIN-017 | Capital & Equity | Track owner capital and equity | Phase 2 |
| FIN-018 | Period Closing | Close monthly/yearly periods. Prevent edits to closed periods | Phase 2 |
| FIN-019 | Tax Management | Calculate and track tax obligations | Phase 2 |
| FIN-020 | Multi-Branch Consolidation | Consolidated financial reports across all branches | Phase 2 |

## Integration
- **Service**: Ticket completion posts COGS + revenue to ledger
- **POS**: Payments post to cash management + AR
- **Purchasing**: PO creates AP entries
- **Inventory**: Stock consumption posts COGS via FIFO cost basis
