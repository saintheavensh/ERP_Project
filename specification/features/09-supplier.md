# Supplier Features

> **Implementation status (2026-07-20):** Partial
> **Built:** supplier CRUD, supplier-to-brand mapping (link/unlink), payment terms
> (`paymentTermDays`) feeding the purchasing due-date calculation, return and warranty
> policy fields.
> **Not built:** supplier performance tracking, pricing history, product catalog with
> price comparison, supplier dashboard.

## Purpose
Manage supplier profiles, product catalogs, pricing history, and performance tracking.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| SUP-001 | Registration & Profile | Name, contact, address, payment terms | Per-tenant supplier data |
| SUP-002 | Categories | Categorize suppliers (e.g., LCD supplier, battery supplier, general) | Multiple categories per supplier |
| SUP-003 | Products Mapping | Map which products each supplier provides | Used for PO creation |
| SUP-004 | Pricing History | Track price changes per product per supplier over time | Used for price comparison |
| SUP-005 | Performance Tracking | Delivery time, defect rate, fulfillment accuracy | Phase 2 |
| SUP-006 | Credit Terms | Define payment terms (net 30, COD, etc.) per supplier | Phase 2 |
| SUP-007 | Dashboard | Order volume, outstanding payments, delivery status per supplier | Phase 2 |
| SUP-008 | Business Rules | Supplier must exist before PO creation, pricing validation | System-enforced |
| SUP-009 | Product Catalog | Browse all products with price comparison across suppliers. Show: supplier name, last price, primary supplier flag | For purchase decisions |

## Integration
- **Purchasing**: Suppliers receive purchase orders
- **Inventory**: Supplier identified per FIFO batch
- **Finance**: Supplier linked to accounts payable
