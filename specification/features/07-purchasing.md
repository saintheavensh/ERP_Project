# Purchasing Features

> **Implementation status (2026-07-20):** Partial
> **Built:** purchase order CRUD, status transitions, goods receiving including
> correct **partial** receipts (accumulating quantities, `partial` order status, and
> over-receipt rejection), brand-split batches on receipt, costing/invoice step that
> sets actual unit cost, selling price, and recalculates WAC, auto due-date from the
> supplier's payment terms.
> **Not built:** purchase requests, purchase returns, reorder recommendations,
> external/technician procurement, purchasing dashboard.

## Purpose
Manage procurement from suppliers: purchase requests, purchase orders, goods receiving, and returns.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| PUR-001 | Foundation | Purchase workflow: request → order → receive → stock-in | Standard procurement flow |
| PUR-002 | Purchase Request | Inv Staff or Technician creates request for needed parts | Can originate from low-stock alert or ticket |
| PUR-003 | PO Management | Create, send, track purchase orders to suppliers | PO number auto-generated |
| PUR-004 | Goods Receiving | Receive delivery, match qty to PO. Creates FIFO batch entries | Qty mismatch flagged |
| PUR-005 | Reservation from PO | Incoming stock can be pre-reserved for waiting tickets | System-managed |
| PUR-005A | Waiting Parts Procurement | Auto-link waiting-parts tickets to incoming PO | Notify tech when part arrives |
| PUR-005B | External Tech Procurement | Technician emergency purchase outside normal PO flow | Phase 2. Needs approval |
| PUR-006 | Supplier Credit | Purchase on credit terms with payment schedule | Phase 2 |
| PUR-007 | Purchase Returns | Return defective/wrong items to supplier. Reverse stock entry | Linked to supplier |
| PUR-008 | Auto Recommendations | System suggests PO based on reorder points and historical demand | Phase 2 |
| PUR-009 | Dashboard | Pending requests, open POs, backorders, delivery status | Phase 2 |
| PUR-010 | Business Rules | PO requires supplier selection, qty > 0, valid pricing | System-enforced |

## Integration
- **Inventory**: Goods receipt creates FIFO batches
- **Supplier**: PO linked to supplier records
- **Finance**: PO creates accounts payable entries
- **Service**: Waiting-parts tickets linked to incoming POs
