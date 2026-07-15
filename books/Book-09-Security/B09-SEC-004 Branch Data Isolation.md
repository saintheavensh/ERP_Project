---
document_id: B09-SEC-004
title: Branch Data Isolation
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Branch Data Isolation

## Purpose
Defines the Multi-Branch security model. Preventing cross-branch data leakage is critical for preventing fraud and protecting customer privacy.

---

# 1. The Isolation Rule

A user assigned to Branch A must never be able to query, edit, or view records belonging to Branch B. 
* This applies to Service Orders, Inventory Batches, Invoices, and Customers (unless the customer is explicitly shared globally).

# 2. Implementation via API Filtering

The JWT payload contains the user's `branch_id` (See `B09-SEC-002`).

Every single API database query that fetches operational data MUST automatically append a `WHERE branch_id = ?` clause using the ID from the JWT.
* **Never** rely on the Frontend to send the `branch_id` in the request body for filtering. A malicious user could simply change the JSON payload to `branch_id: "branch-B-uuid"` and steal data. The filter must be hardcoded based on the trusted JWT.

# 3. Implementation via Database (RLS)

If the final technology choice is Supabase (PostgreSQL), the absolute safest way to enforce this is via Row-Level Security (RLS) directly on the database tables.

```sql
-- Conceptual Example of RLS
CREATE POLICY "Users can only view their own branch data"
ON service_orders
FOR SELECT
USING (branch_id = auth.jwt()->>'branch_id');
```
By enforcing this at the database level, even if an API developer forgets to add the `WHERE` clause, the database itself will block the data leakage.

# 4. The Exception: The Owner

The `Owner` role is exempt from Branch Isolation. If a user's JWT has `role: "owner"`, the API (or RLS policy) should bypass the `branch_id` filter, allowing them to aggregate reports across all branches.
