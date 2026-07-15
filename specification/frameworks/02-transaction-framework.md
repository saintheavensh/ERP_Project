# Transaction Framework

## Purpose
Standardize how financial and inventory transactions are recorded and audited.

## Core Rules

### 1. Append-Only Ledgers
Stock movements and finance ledger entries are **never updated or deleted**. Corrections use reversal entries.

```
// Wrong ❌ — updating existing entry
UPDATE stock_movements SET quantity = 3 WHERE id = 'sm_001';

// Correct ✅ — creating reversal entry
INSERT INTO stock_movements (type, quantity, reference) VALUES ('adjust', -2, 'correction for sm_001');
```

### 2. Reference Tracking
Every transaction entry must reference its source:

| Field | Purpose |
|-------|---------|
| `reference_type` | What triggered this entry (e.g., 'service_ticket', 'purchase_order', 'manual_adjustment') |
| `reference_id` | ID of the source entity |

### 3. Idempotency
Critical mutations must support `Idempotency-Key` to prevent double execution:
- Stock consumption
- Payment processing
- State transitions

### 4. Soft-Delete
Important transactional entities use `deleted_at` column instead of hard delete:
- Service Tickets
- POS Transactions
- Invoices
- Payments

## Double-Entry Accounting
Every financial event creates balanced journal entries (total debits = total credits):

```
Part consumed in service ticket:
  DEBIT  Cost of Goods Sold (COGS)    $10
  CREDIT Inventory Asset              $10

Payment received:
  DEBIT  Cash / Bank                  $50
  CREDIT Revenue                      $50
```
