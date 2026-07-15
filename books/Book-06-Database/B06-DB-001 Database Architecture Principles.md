---
document_id: B06-DB-001
title: Database Architecture Principles
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Database Architecture Principles

## Purpose
This document defines the overarching rules, naming conventions, and technical constraints for the physical data model. This architecture is designed to be **Vendor-Neutral** (Agnostic), meaning it can be implemented on PostgreSQL, MySQL, SQL Server, or SQLite.

---

# Data Types Mapping

The documentation uses logical data types. Developers must map these to the appropriate physical types of their chosen database engine.

| Logical Type | Description | PostgreSQL Eq. | MySQL Eq. |
| :--- | :--- | :--- | :--- |
| `STRING` | Text data, identifiers | `VARCHAR` / `TEXT` | `VARCHAR` |
| `INTEGER` | Whole numbers | `INTEGER` | `INT` |
| `DECIMAL` | Financial / Exact numbers | `DECIMAL(12,2)` | `DECIMAL(12,2)`|
| `BOOLEAN` | True/False flags | `BOOLEAN` | `TINYINT(1)` |
| `TIMESTAMP` | Date and time with timezone | `TIMESTAMPTZ` | `DATETIME` |
| `ENUM` | Restricted set of strings | `ENUM` / `VARCHAR` | `ENUM` |
| `JSON` | Semi-structured data | `JSONB` | `JSON` |

---

# Global Database Rules

## Rule 1: Naming Convention
All tables and columns **MUST** use `snake_case`.
* Correct: `service_orders`, `customer_id`
* Incorrect: `ServiceOrders`, `customerId`

## Rule 2: Primary Keys
Every table must have a Primary Key (PK) named `id`.
* Recommendation: Use `UUID` (Universally Unique Identifier) for `id` to ensure secure, guess-proof URLs and easier data merging. However, `Auto-Incrementing Integer` is also acceptable if preferred by the team.

## Rule 3: Audit Columns (The "Immutability Triad")
Every operational table MUST include these three columns:
* `created_at` (`TIMESTAMP`): Automatically set on row creation.
* `updated_at` (`TIMESTAMP`): Automatically updated on row modification.
* `deleted_at` (`TIMESTAMP`): Set when a row is logically deleted.

## Rule 4: Soft Delete Implementation
In adherence to the `Historical Data Must Survive` business rule, physical `DELETE` statements are strictly prohibited for transactional data.
* To "delete" a record, the application must update the `deleted_at` column with the current timestamp.
* All `SELECT` queries must include a filter: `WHERE deleted_at IS NULL`.

## Rule 5: Foreign Key Protection
Foreign Keys (FK) maintain relational integrity.
* Deleting a parent record must **NOT** cascade to transactional child records.
* Use `ON DELETE RESTRICT` or `ON DELETE NO ACTION`. For example, deleting a `Customer` should be blocked if they have `Service Orders`. Instead, the `Customer` is soft-deleted.
