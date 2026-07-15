# Validation Rules

## Purpose
Define business validation rules that must be enforced across the application.

## Global Rules

| Rule | Scope | Enforcement |
|------|-------|-------------|
| `tenant_id` filter on every query | All modules | Middleware |
| Input validation via Zod | All endpoints | Route-level |
| Soft-delete for transactional entities | Tickets, POS, Invoices | ORM-level |
| Append-only for ledger tables | Stock movements, Finance entries | DB constraint |

## Service Rules

| Rule | Description |
|------|-------------|
| Customer must exist before ticket | Cannot create ticket without valid customer_id |
| Device must be registered | Device record must exist (can be created during intake) |
| Flow Template required | Every ticket must reference a valid Flow Template |
| Transition validation | Cannot skip stages; must follow Flow Transition rules |
| QC before completion | Ticket cannot move to "completed" without QC pass |
| Cancellation releases stock | Cancelling a ticket auto-releases all reserved parts |

## Inventory Rules

| Rule | Description |
|------|-------------|
| No negative stock | `quantity_available` cannot go below 0 |
| Reservation ≤ available | Cannot reserve more than available quantity |
| FIFO mandatory | Consumption always picks oldest batch first |
| Adjustment needs reason | Every manual adjustment requires a reason field |
| Movement ledger immutable | Stock movements cannot be updated or deleted |

## Finance Rules

| Rule | Description |
|------|-------------|
| Double-entry balance | Every journal entry: total debits = total credits |
| Ledger immutable | Finance entries cannot be updated; use reversal entries |
| Payment ≤ invoice total | Cannot overpay an invoice |
| Void requires approval | Voiding any transaction requires Branch Manager approval |
| Period closing locks data | Once a period is closed, no edits allowed (Phase 2) |

## RBAC Rules

| Rule | Description |
|------|-------------|
| Permission-based, not role-based checks | Check `requirePermission('code')`, never `if (role === 'manager')` |
| Branch scoping | Permission checks must consider branch assignment |
| No cross-tenant data | A user can never access data from another tenant |
