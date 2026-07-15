---
document_id: B10-TST-002
title: Backend Testing
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Backend Testing Strategy

## Purpose
Defines how to test the Hono API, Zod validations, and the database interactions. Recommended Framework: **Vitest** or **Jest**.

---

# 1. Unit Testing (Business Logic)

Unit tests run in milliseconds because they do not connect to a real database.

## Critical Targets
* **FIFO Batch Deduction Algorithm:** Feed the function a mock array of inventory batches and assert that it deducts from the oldest dates first and calculates the exact Cost of Goods Sold (COGS).
* **Commission Calculator:** Feed the function a mock invoice and assert it calculates the exact percentage based on the technician's rules, ignoring the spare part costs.

# 2. Integration Testing (API Endpoints)

Integration tests verify that the Hono API routes process HTTP requests correctly and save data to a **Test Database**.

## Test Requirements
* Every endpoint must test the **Zod Validation**. Send a malformed payload (e.g., missing a required field) and assert the API returns a `400 Bad Request` with the standardized error JSON.
* Every endpoint must test **Role Based Access Control (RBAC)**. Send a request with a 'Cashier' JWT to a 'Manager' endpoint and assert it returns a `403 Forbidden`.
* Every transactional endpoint must test **Database Side Effects**. For example, hitting `POST /api/service-orders` must assert that exactly 1 row is added to the `service_orders` table and 1 row to `service_order_status_logs`.

# 3. Database State Management

For Integration tests, developers must use an isolated Test Database.
* Before the test suite runs, run database migrations.
* Before each individual test, truncate the tables or wrap the test in a SQL Transaction that rolls back at the end. This ensures a clean slate.
