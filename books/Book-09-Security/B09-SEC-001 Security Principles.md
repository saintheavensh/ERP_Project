---
document_id: B09-SEC-001
title: Security Principles
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Security Principles

## Purpose
This document establishes the overarching security philosophy for the Universal Service ERP. Given the sensitivity of financial and customer data, security is prioritized alongside operational speed.

---

# 1. Zero Trust Architecture

**"Never Trust, Always Verify."**
The Backend API (`Book-07`) must assume that every incoming request is potentially malicious.
* The Frontend UI might disable a button, but the Backend MUST still validate the request independently.
* Every single `POST`, `PUT`, or `PATCH` request must pass through a strict Zod schema validation before any business logic is executed. Unvalidated data must never touch the database.

# 2. Principle of Least Privilege

Users should only have the minimum level of access necessary to perform their job functions.
* A Cashier needs to create intakes and process payments, but they do NOT need to see the exact FIFO cost of a spare part or the total branch profit.
* The system enforces this by mapping specific API endpoints to specific Roles (See `B09-SEC-003`).

# 3. Defense in Depth

Security must be implemented in multiple layers:
1. **Frontend Layer:** Disabling UI elements based on roles (for UX, not security).
2. **API Layer:** JWT validation, RBAC Middleware, Zod schema validation.
3. **Database Layer:** Row-Level Security (RLS) policies (if using Supabase/PostgreSQL) and Foreign Key constraints to prevent cascading deletions.
