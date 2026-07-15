# Inventory Features

## Purpose
Manage stock with FIFO batch tracking, append-only movement ledger, and automatic reservation from service tickets.

## Core Principle
> Stock movements are append-only. Never update or delete a movement record. Corrections use reversal entries.

## FIFO Batch Architecture
Each inventory item can have multiple **batches** from different suppliers at different costs. When consuming stock, the system always picks the **oldest batch first** (First In, First Out) to ensure accurate COGS calculation.

```
Batch 1: Supplier A, qty: 5, cost: $10, received: Jan 1
Batch 2: Supplier B, qty: 3, cost: $12, received: Feb 1
Batch 3: Supplier A, qty: 10, cost: $11, received: Mar 1

Consume 7 units → Takes: 5 from Batch 1 ($10) + 2 from Batch 2 ($12)
COGS = (5 × $10) + (2 × $12) = $74
```

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| INV-001 | Foundation | Master data: SKU, name, category, unit of measure, reorder point | Per-tenant inventory |
| INV-002 | Lifecycle | States: active, discontinued, out-of-stock | System-managed |
| INV-003 | FIFO Batch | Each goods receipt creates a new batch with supplier, qty, unit cost, date | Oldest consumed first |
| INV-004 | Batch Management | View batches per item, their remaining qty, supplier origin | Inv Staff access |
| INV-005 | Movement Ledger | Append-only log: in, out, reserve, release, adjust. Each entry has reference (ticket/PO/manual) | Never update/delete |
| INV-006 | Service Consumption | When tech marks part as "used", system auto-deducts from oldest FIFO batch | Hard deduction + COGS posted |
| INV-007 | Warranty Consumption | Parts used for warranty repair tracked separately for cost analysis | Phase 2 |
| INV-008 | Supplier Return | Return defective parts to supplier. Reverse stock entry | Needs Branch Mgr approval |
| INV-009 | Customer Return | Restocking returned items. New stock-in entry created | Condition check required |
| INV-010 | Stock Adjustment | Manual adjustment with reason and approval for discrepancies | Above threshold needs approval |
| INV-011 | Stock Opname | Scheduled physical count reconciled against system records | Phase 2 |
| INV-012 | Reorder Management | Auto-generate PO when stock hits reorder point. Manual PO also supported | Configurable reorder point |
| INV-013 | Reporting | Stock valuation, movement history, slow-moving items, reorder alerts | Phase 2 |
| INV-014 | Business Rules | No negative stock, reservation cannot exceed available, FIFO mandatory | System-enforced |

## Stock States
- **Available**: Can be sold or reserved
- **Reserved**: Soft-locked for a ticket/transaction, not yet consumed
- **Consumed**: Hard-deducted, part has been used

## Integration
- **Service**: Parts reserved when ticket enters repair, consumed when tech marks "used"
- **Purchasing**: Goods receipt creates new FIFO batches
- **Finance**: Consumption triggers COGS journal entry
- **POS**: Direct retail sales also consume stock via FIFO
