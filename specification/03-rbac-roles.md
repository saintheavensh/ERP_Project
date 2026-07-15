# RBAC & Role Management

## Philosophy

RBAC in FlowServ operates at **two levels**:

1. **Module Level** — role can access which modules (Inventory, POS, Finance, etc.) — "classic" RBAC.
2. **Flow Node Level** — role can execute *specific actions* at specific points in the workflow (see [02-architecture.md](./02-architecture.md)).

The second level makes this RBAC more granular than most similar applications: not just "can access Inventory", but "can approve stock adjustment above $500", for example.

## Role Hierarchy (Default — Customizable per Tenant)

| Role | Scope | Description |
|------|-------|-------------|
| **Platform Super Admin** | Entire platform | Tenant provisioning, billing, monitoring — outside tenant structure |
| **Tenant Owner/Admin** | 1 tenant (all branches) | Full access, configure Flow Templates & Roles in their tenant |
| **Branch Manager** | 1 or more branches | Approve transactions above threshold, view branch reports, manage branch staff |
| **Senior Technician** | 1 branch | Execute & approve technical nodes (QC, complex diagnosis) |
| **Technician (Junior)** | 1 branch | Execute basic nodes (initial diagnosis, update repair progress) |
| **Cashier** | 1 branch | POS transactions, receive payments |
| **Inventory Staff** | 1 branch (or central warehouse) | Manage stock, purchase orders, stock opname |
| **Finance Staff** | 1 tenant (cross-branch) | View & manage financial reports, approve refunds |
| **Customer Service (CS)** | 1 branch | Ticket intake, customer communication |
| **Auditor/Viewer** | 1 tenant (read-only) | Read-only access for external audit needs |

> These roles are a **starting point**, not a rigid final list — Tenant Owner can create custom roles with any permission combination via the RBAC Management UI.

## Permission Matrix

Notation: ✅ full access · ➕ with approval/threshold · ❌ no access

| Action | Junior Tech | Senior Tech | Branch Mgr | Cashier | Inv Staff | Finance |
|--------|------------|------------|-----------|---------|-----------|---------|
| Create service ticket | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update diagnosis | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve quote to customer | ❌ | ➕ (< threshold) | ✅ | ❌ | ❌ | ❌ |
| Reserve/consume part | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manual stock adjustment | ❌ | ❌ | ➕ | ❌ | ✅ | ❌ |
| Process POS payment | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Void POS transaction | ❌ | ❌ | ✅ | ➕ (needs approval) | ❌ | ❌ |
| Approve refund | ❌ | ❌ | ➕ | ❌ | ❌ | ✅ |
| View branch finance reports | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Configure Flow Template | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(Tenant Owner only)* |

*Threshold values and which actions require approval are configured per tenant — not hardcoded. Defaults (changeable by tenant admin): approve quote above $200 requires Senior Technician, above $1,000 requires Branch Manager; manual stock adjustment above $500 requires Branch Manager approval; POS void always requires Branch Manager approval.*

## Scoping: Tenant vs Branch vs Global

- Every User is bound to 1 Tenant.
- Every User can have 1+ Roles, and each Role assignment can be scoped to a specific Branch (e.g., Branch Manager of Branch A, not automatically Branch Manager of all branches).
- Permission checks must always consider 3 things: **Role**, **Tenant**, **Branch** — never check Role alone.

## Implementation Rules (for AI Agents & Developers)

- Store permissions as data (not hardcoded if/else per role) — use `role_permissions` table with FK to `permissions` and `flow_nodes`.
- Every Flow Node must define a `required_permission` that is checked before the action executes.
- When building a new feature that needs access control, **do NOT** create a hardcoded role check (`if role == "manager"`) — add a new permission to the table and let the tenant admin assign it to whatever role they want.
