---
document_id: B06-DB-005
title: Financial Transactions Schema
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Financial Transactions Schema

## Purpose
Defines the tables for tracking revenue, managing payments (including Down Payments), and calculating technician commissions.

---

# 1. Invoicing

## Table: `invoices`
Immutable document requesting payment from a customer.
* `id` (PK, UUID/INT)
* `branch_id` (FK -> `branches.id`)
* `customer_id` (FK -> `customers.id`, NULLABLE) - Nullable for anonymous retail walk-ins.
* `reference_type` (ENUM: 'service_order', 'retail_sale', 'return')
* `reference_id` (UUID/INT) - The ID of the specific Service Order or Retail Sale.
* `subtotal` (DECIMAL)
* `tax_amount` (DECIMAL)
* `discount_amount` (DECIMAL)
* `total_amount` (DECIMAL)
* `status` (ENUM: 'unpaid', 'partial', 'paid', 'void')
* `created_by` (FK -> `users.id`)
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

## Table: `invoice_items`
* `id` (PK, UUID/INT)
* `invoice_id` (FK -> `invoices.id`)
* `product_id` (FK -> `products.id`, NULLABLE) - Nullable if it's purely a service fee.
* `item_type` (ENUM: 'product', 'service_fee')
* `quantity` (INTEGER)
* `unit_price` (DECIMAL) - Selling price.
* `unit_cost` (DECIMAL) - The exact FIFO batch cost at the time of sale. Crucial for profit calculation.
* `batch_id` (FK -> `inventory_batches.id`, NULLABLE) - Links back to the specific batch consumed.

---

# 2. Payments

## Table: `payments`
Tracks actual money moving into or out of the cash drawer/bank.
* `id` (PK, UUID/INT)
* `invoice_id` (FK -> `invoices.id`)
* `amount` (DECIMAL)
* `payment_method` (ENUM: 'cash', 'transfer', 'card', 'ewallet')
* `payment_type` (ENUM: 'dp', 'final_payment', 'refund')
* `received_by` (FK -> `users.id`)
* `created_at` (TIMESTAMP)

---

# 3. Technician Commissions

## Table: `technician_commissions`
Calculated automatically based on the invoice's Service Fee, but only awarded when the invoice status is 'paid'.
* `id` (PK, UUID/INT)
* `technician_id` (FK -> `users.id`)
* `service_order_id` (FK -> `service_orders.id`)
* `invoice_id` (FK -> `invoices.id`)
* `base_service_fee` (DECIMAL) - The amount the calculation was based on.
* `commission_rate` (DECIMAL) - The % configured for this tech at the time of calculation.
* `commission_amount` (DECIMAL)
* `status` (ENUM: 'pending', 'payable', 'paid_out', 'void')
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
