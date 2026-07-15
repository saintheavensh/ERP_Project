# Service Billing Features

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
