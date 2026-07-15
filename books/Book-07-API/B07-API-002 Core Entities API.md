---
document_id: B07-API-002
title: Core Entities API
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Core Entities API

## Purpose
API specifications for managing the organizational structure (Branches, Users) and foundational actors (Customers).

---

# 1. Branches (`/api/branches`)

## `GET /api/branches`
* **Purpose:** List all active branches.
* **Response:** Array of Branch objects.

## `POST /api/branches`
* **Purpose:** Create a new branch.
* **Validation (Zod):** `name` (required), `address`, `phone`.

---

# 2. Users (`/api/users`)

## `GET /api/users`
* **Purpose:** List users, filterable by `branch_id` or `role`.

## `POST /api/users`
* **Purpose:** Register a new employee.
* **Validation (Zod):** `full_name`, `email` (email format), `role_id`, `branch_id`.

---

# 3. Customers (`/api/customers`)

## `GET /api/customers`
* **Purpose:** Search for existing customers by name, phone, or email to speed up the Intake process.
* **Query Params:** `?q=search_term`

## `POST /api/customers`
* **Purpose:** Register a new customer.
* **Validation (Zod):** `full_name` (string, min 2 chars), `phone` (optional), `email` (optional).

---

# 4. Initial Setup (`/api/setup`)

## `POST /api/setup`
* **Purpose:** One-time endpoint executed via the Setup Wizard. Populates the foundational database tables (Zero State).
* **Validation (Zod):**
```typescript
const InitialSetupSchema = z.object({
  company_name: z.string(),
  branch_name: z.string(),
  branch_address: z.string(),
  owner_full_name: z.string(),
  owner_email: z.string().email(),
  owner_password: z.string().min(8),
  selected_device_categories: z.array(z.string()) // e.g., ['Smartphone', 'Laptop']
});
```
* **Side Effect (CRITICAL):** 
  1. Creates the `Owner` Role (if not exists).
  2. Creates the first `Branch`.
  3. Creates the first `User` and links to the Owner role and the Branch.
  4. Seeds the `device_categories` table based on the user's selection to enable Dynamic Widgets.
  5. Permanently locks this endpoint from ever being called again (e.g., by checking if an Owner user already exists).
