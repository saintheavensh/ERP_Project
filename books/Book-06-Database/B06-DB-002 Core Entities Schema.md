---
document_id: B06-DB-002
title: Core Entities Schema
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Core Entities Schema

## Purpose
Defines the foundational tables for organization structure, user management, and primary actors (Customers & Devices).

---

# 1. Organization & Users

## Table: `branches`
Represents physical store locations.
* `id` (PK, UUID/INT)
* `name` (STRING)
* `address` (STRING)
* `phone` (STRING)
* `status` (ENUM: 'active', 'inactive')
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

## Table: `roles`
*Note: If using a platform like Supabase Auth, roles can be managed via JWT claims, but a relational table is provided for strict DB-level management.*
* `id` (PK, UUID/INT)
* `name` (STRING) - e.g., 'owner', 'manager', 'cashier', 'technician'
* `permissions` (JSON) - Optional granular access flags.

## Table: `users` (Employees)
* `id` (PK, UUID/INT)
* `role_id` (FK -> `roles.id`)
* `branch_id` (FK -> `branches.id`) - Primary assigned branch.
* `full_name` (STRING)
* `email` (STRING, UNIQUE)
* `phone` (STRING)
* `status` (ENUM: 'active', 'inactive')
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

---

# 2. Customers & Devices

To adhere to the `Customer / Device Independence` rule, these are separated.

## Table: `customers`
* `id` (PK, UUID/INT)
* `full_name` (STRING)
* `phone` (STRING) - Not required by business rules, but highly recommended.
* `email` (STRING)
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

## Table: `device_categories`
Defines the template for dynamic widgets (Intake Forms) based on device type.
* `id` (PK, UUID/INT)
* `name` (STRING) - e.g., 'Smartphone', 'Printer', 'Laptop', 'Console'
* `widget_schema` (JSON) - Defines what fields the frontend should render (e.g., IMEI vs Ink Level).

## Table: `devices`
* `id` (PK, UUID/INT)
* `category_id` (FK -> `device_categories.id`)
* `brand` (STRING)
* `model` (STRING)
* `serial_number` (STRING) - General identifier (IMEI/SN).
* `dynamic_attributes` (JSON) - Stores the specific values based on the widget schema.
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
* `deleted_at` (TIMESTAMP)

## Table: `customer_devices` (Association Table)
Maps which customer currently owns which device.
* `id` (PK, UUID/INT)
* `customer_id` (FK -> `customers.id`)
* `device_id` (FK -> `devices.id`)
* `is_current_owner` (BOOLEAN) - True if active. If the device is sold, this becomes False.
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)
