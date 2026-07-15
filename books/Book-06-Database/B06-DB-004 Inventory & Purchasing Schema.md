---
document_id: B06-DB-004
title: Inventory & Purchasing Schema
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Inventory & Purchasing Schema

## Purpose
Defines the tables for managing physical stock, tracking FIFO batches, handling suppliers, and auditing stock movements.

---

# 1. Master Data

## Table: `suppliers`
* `id` (PK, UUID/INT)
* `name` (STRING)
* `contact_person` (STRING)
* `phone` (STRING)
* `address` (STRING)
* `status` (ENUM: 'active', 'inactive')
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

## Table: `products`
* `id` (PK, UUID/INT)
* `sku` (STRING, UNIQUE)
* `name` (STRING)
* `category` (STRING) - e.g., 'lcd', 'battery', 'accessory'.
* `minimum_stock` (INTEGER) - Threshold for low stock alerts.
* `selling_price` (DECIMAL) - Retail selling price.
* `is_returnable` (BOOLEAN) - Whether it can be returned by customers.
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

---

# 2. Purchasing

## Table: `purchase_orders`
* `id` (PK, UUID/INT)
* `branch_id` (FK -> `branches.id`)
* `supplier_id` (FK -> `suppliers.id`)
* `status` (ENUM: 'draft', 'waiting_approval', 'ordered', 'receiving', 'completed')
* `created_by` (FK -> `users.id`) - E.g., Cashier creating the draft ticket.
* `approved_by` (FK -> `users.id`) - E.g., Owner approving the order.
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

## Table: `po_items`
* `id` (PK, UUID/INT)
* `purchase_order_id` (FK -> `purchase_orders.id`)
* `product_id` (FK -> `products.id`)
* `quantity_ordered` (INTEGER)
* `quantity_received` (INTEGER)
* `unit_cost` (DECIMAL) - The expected or agreed price.

---

# 3. Stock & FIFO Batches

## Table: `inventory_batches`
Crucial table for FIFO and accurate profit calculation. Each time goods are received, a new batch is created.
* `id` (PK, UUID/INT)
* `branch_id` (FK -> `branches.id`)
* `product_id` (FK -> `products.id`)
* `purchase_order_id` (FK -> `purchase_orders.id`, NULLABLE)
* `supplier_id` (FK -> `suppliers.id`, NULLABLE)
* `batch_cost` (DECIMAL) - The exact cost paid for this specific intake.
* `initial_quantity` (INTEGER)
* `remaining_quantity` (INTEGER)
* `received_at` (TIMESTAMP) - Used to determine the oldest batch for FIFO.
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)

## Table: `stock_movements` (Audit Ledger)
Records EVERY single change to inventory. Never update quantities without inserting a record here.
* `id` (PK, UUID/INT)
* `branch_id` (FK -> `branches.id`)
* `product_id` (FK -> `products.id`)
* `batch_id` (FK -> `inventory_batches.id`, NULLABLE)
* `movement_type` (ENUM: 'in_receipt', 'out_service', 'out_retail', 'adj_loss', 'adj_found', 'return_supplier', 'return_customer')
* `quantity_change` (INTEGER) - Positive or negative.
* `reference_id` (UUID/INT) - E.g., Service Order ID or Invoice ID.
* `performed_by` (FK -> `users.id`)
* `reason` (STRING)
* `created_at` (TIMESTAMP)
