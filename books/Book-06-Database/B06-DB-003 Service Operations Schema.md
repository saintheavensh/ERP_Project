---
document_id: B06-DB-003
title: Service Operations Schema
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Service Operations Schema

## Purpose
Defines the tables handling the core repair workflows, from intake to completion and QC.

---

# 1. Service Orders

## Table: `service_orders`
The main transactional document for a repair.
* `id` (PK, UUID/INT)
* `branch_id` (FK -> `branches.id`)
* `customer_id` (FK -> `customers.id`)
* `device_id` (FK -> `devices.id`)
* `category` (ENUM: 'quick_service', 'regular_service')
* `status` (STRING/ENUM) - e.g., 'intake', 'in_progress', 'waiting_approval', 'completed'.
* `service_type` (STRING) - e.g., 'hardware', 'software'.
* `initial_complaint` (STRING)
* `device_condition_notes` (STRING)
* `dynamic_attributes` (JSON) - Specific intake form data (e.g., Charger Included = Yes).
* `assigned_technician_id` (FK -> `users.id`) - The primary technician responsible.
* `created_by` (FK -> `users.id`) - The cashier who did the intake.
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

## Table: `service_order_status_logs`
Tracks the time spent in each status for KPI protection rules (e.g., excluding 'waiting_approval' time).
* `id` (PK, UUID/INT)
* `service_order_id` (FK -> `service_orders.id`)
* `previous_status` (STRING)
* `new_status` (STRING)
* `changed_by` (FK -> `users.id`)
* `duration_seconds` (INTEGER) - Calculated when status changes again.
* `created_at` (TIMESTAMP)

---

# 2. Estimates & Approval

## Table: `service_estimates`
Stores price estimates proposed to the customer. A service order can have multiple estimates (if revised).
* `id` (PK, UUID/INT)
* `service_order_id` (FK -> `service_orders.id`)
* `estimated_cost` (DECIMAL)
* `status` (ENUM: 'pending', 'approved', 'rejected')
* `notes` (STRING)
* `created_by` (FK -> `users.id`)
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)

---

# 3. Quality Control (QC) & Warranty

## Table: `qc_inspections`
Records the outcome of the QC process before completion.
* `id` (PK, UUID/INT)
* `service_order_id` (FK -> `service_orders.id`)
* `inspector_id` (FK -> `users.id`) - Can be the same as technician if 'Self-QC' is enabled.
* `status` (ENUM: 'passed', 'failed')
* `notes` (STRING)
* `created_at` (TIMESTAMP)

## Table: `warranty_claims`
* `id` (PK, UUID/INT)
* `original_service_order_id` (FK -> `service_orders.id`)
* `claim_date` (TIMESTAMP)
* `status` (ENUM: 'pending', 'approved', 'rejected', 'resolved')
* `resolution_notes` (STRING)
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
