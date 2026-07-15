# Glossary

| Term | Definition |
|------|-----------|
| **Tenant** | One SaaS customer company (1 tenant = 1 organization with isolated data) |
| **Branch** | Outlet/location within one tenant |
| **Flow Template** | Definition of stage/node sequence for one process type (service or inventory), configurable per tenant |
| **Flow Node** | One step/stage in a Flow Template |
| **Transition Rule** | Condition that must be met to move from one Flow Node to the next |
| **Service Ticket** | Entity representing one service job, from intake to closed |
| **Change Order** | Sub-flow when technician discovers a new issue mid-repair, requiring additional approval |
| **RBAC** | Role-Based Access Control — access control based on user roles |
| **Reservation (soft-lock)** | Stock marked as "will be used" but not yet physically deducted from system |
| **Consumption (hard deduction)** | Stock actually deducted because it has been used/sold |
| **Reorder Point** | Minimum stock threshold that triggers automatic Purchase Order creation |
| **Stock Opname** | Periodic physical stock count reconciled against system records |
| **COGS** | Cost of Goods Sold — cost of parts/items used in a ticket/transaction |
| **Job Costing** | Per-job/ticket cost and margin calculation |
| **Event-Driven Core** | Architecture where state changes trigger events that automatically update other modules (Inventory, POS, Finance) |
| **Event Bus** | Mechanism that distributes events from one source (Service Ticket/Inventory) to many subscribers (Finance, POS, etc.) |
| **Idempotency Key** | Unique identifier in API request to prevent the same action from executing twice due to network retry |
| **Magic Link** | One-time-use URL token sent via WA/SMS for passwordless customer portal access |
| **FIFO** | First In, First Out — inventory costing method where oldest stock batches are consumed first |
| **Batch** | A group of the same inventory item received at the same time from the same supplier at the same unit cost |
| **Append-Only Ledger** | Data structure where entries are only added, never modified or deleted — used for stock movements and finance entries |
| **Tenant Scoping** | Automatic filtering of all queries by `tenant_id` to ensure data isolation between tenants |
| **RLS** | Row-Level Security — PostgreSQL feature providing database-level tenant isolation as a second defense layer |
