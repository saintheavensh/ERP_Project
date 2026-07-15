---
document_id: B09-SEC-003
title: Role Based Access Control
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Role Based Access Control (RBAC)

## Purpose
Defines how the API enforces permission boundaries based on the user's assigned role.

---

# 1. The RBAC Matrix

The system enforces permissions at the endpoint level.

| Role | Operational Scope | Financial Scope | Settings Scope |
| :--- | :--- | :--- | :--- |
| **Owner** | All Branches | Full Access (Profit, HPP) | Full Access |
| **Manager** | Single Branch | Partial (Revenue, Invoices) | Promos & Assignment |
| **Cashier** | Single Branch | Create Invoices, Accept Payments | None |
| **Technician** | Single Branch | View own commissions only | None |
| **Warehouse** | Single Branch | View Inventory, Receipt | None |

# 2. Implementation in Hono (Middleware)

To ensure developers do not forget to protect endpoints, RBAC must be implemented as Reusable Middleware.

## Example Concept:
```typescript
// Only users with 'owner' or 'manager' role can access this route
app.post('/api/purchase-orders/:id/approve', requireRole(['owner', 'manager']), (c) => {
  // Business logic here
});
```

By explicitly wrapping protected routes in a `requireRole` middleware, we guarantee that a malicious user cannot bypass the UI to execute unauthorized actions.

# 3. Manager Approval PINs

As defined in `B05-SAL-002`, certain quick actions (like POS discounts) require an instant Manager PIN rather than a full login session.
* The API must provide a specialized endpoint (e.g., `POST /api/auth/verify-pin`) that accepts a Manager's PIN, validates it against the `users` table, and returns a short-lived authorization token or simply a boolean success specifically for that one transaction.
