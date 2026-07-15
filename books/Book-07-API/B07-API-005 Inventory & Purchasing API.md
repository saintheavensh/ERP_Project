---
document_id: B07-API-005
title: Inventory & Purchasing API
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Inventory & Purchasing API

## Purpose
API specifications for managing physical stock, executing FIFO Goods Receipts, and conducting Stock Opname.

---

# 1. Products & Suppliers

## `GET /api/products`
* **Purpose:** Search for spare parts and accessories.
* **Query Params:** `?category=lcd&branch_id=UUID` (to filter stock by branch).

## `GET /api/suppliers`
* **Purpose:** List active suppliers for creating Purchase Orders.

---

# 2. Purchase Orders (`/api/purchase-orders`)

## `POST /api/purchase-orders` (Draft / Tiket PO)
* **Purpose:** Creates a Draft PO request.
* **Validation:** `supplier_id`, `branch_id`, `items` (array of `product_id` and `quantity_ordered`).
* **Side Effect:** Does NOT affect inventory or financials.

## `PATCH /api/purchase-orders/:id/approve`
* **Purpose:** Owner/Manager approves the ticket.
* **Validation:** Requires `admin` or `owner` role JWT.

## `POST /api/purchase-orders/:id/receive` (Goods Receipt)
* **Purpose:** Logs the physical arrival of goods.
* **Validation:** Array of `po_item_id`, `quantity_received`, and `actual_unit_cost`.
* **Side Effect (CRITICAL):** 
  1. Creates a new record in `inventory_batches` locking in the exact `batch_cost` for FIFO.
  2. Writes an `in_receipt` log to `stock_movements`.

---

# 3. Stock Adjustments & Opname (`/api/inventory`)

## `POST /api/inventory/consume` (Deferred Consumption)
* **Purpose:** Technician logs the parts they physically used for a repair.
* **Validation:** `service_order_id`, `product_id`, `quantity`.
* **Side Effect (CRITICAL):** 
  1. Queries the oldest available `inventory_batches` (FIFO).
  2. Deducts stock from those batches.
  3. Writes an `out_service` log to `stock_movements`.
  4. Attaches the consumed item (and its specific FIFO cost) to the `service_order`.

## `POST /api/inventory/adjust`
* **Purpose:** Manual stock adjustment for Opname (Audit).
* **Validation:** `product_id`, `quantity_change` (can be negative), `reason` (string).
* **Side Effect:** Deducts/Adds to batches. Writes `adj_loss` or `adj_found` to `stock_movements`.
