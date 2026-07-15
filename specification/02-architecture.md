# Core Architecture: Modular Workflow Engine

## Core Principle

> **Workflows = configuration (data), not hardcoded application logic.**

Consequences:
- Adding a new service type = creating/modifying a Flow Template, not writing new code.
- Each tenant (and even each branch) can have different SOPs on the same engine.
- Developers & AI agents build the *engine* that runs flows, not the flows themselves one by one.

## Building Blocks: Flow Template & Flow Node

| Concept | Description | Examples |
|---------|-------------|----------|
| **Flow Template** | Definition of the stage sequence for one process type (service or inventory) | "Standard Repair Flow", "Express Service Flow", "Warranty Claim Flow" |
| **Flow Node (Stage)** | One step in a Flow Template — has input/output, authorized roles, and events emitted | "Diagnosis", "Customer Approval", "Parts Reservation" |
| **Transition Rule** | Condition to move from one node to the next | "Cannot enter 'Repair In Progress' before 'Customer Approval' = approved" |
| **Trigger/Event** | Automatic action when a node changes status | Node "Parts Consumed" → trigger stock deduction + finance journal entry |

Each node is RBAC-gated: it defines a `required_permission` checked before the action can be executed.

## Why This Is Different

Typical service center applications hardcode the process sequence (Intake → Diagnosis → Quote → Repair → QC → Invoice). Changing it requires a feature request to the vendor.

In FlowServ, that sequence is simply **one default Flow Template** that can be:
- Cloned and modified per tenant
- Have variants per service type (express vs complex vs warranty claim)
- Have nodes added/removed via the UI configuration (Flow Template Builder), not via developer requests

## Event-Driven Core: Single Source of Truth

Instead of Inventory, POS, and Finance as 3 separate modules that "sync" periodically, all three are **subscribers** to events emitted by Service Ticket and Inventory Flow.

```
[Service Ticket State Change] ──emit──> [Event Bus]
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     ▼                       ▼                       ▼
             [Inventory Engine]       [Finance Ledger]           [POS/Invoice]
             (reserve/consume          (job costing real-time,   (generate invoice,
              stock)                    COGS, revenue)            record payment)
```

Concrete example: technician marks part "LCD Screen" as *used* on a ticket →
1. **Inventory**: LCD Screen stock decreases by 1, reservation status becomes "consumed"
2. **Finance**: recorded as COGS in that ticket's ledger, ticket margin auto-updates
3. **POS**: part price automatically added to the ticket's draft invoice

No "nightly sync" or monthly manual reconciliation needed.

## Multi-Tenancy

- **Tenant** = 1 SaaS customer company. **Final decision:** shared database (one DB for all tenants), every domain table has a `tenant_id` column, reinforced by PostgreSQL Row-Level Security (RLS) as a second isolation layer.
- **Branch** = outlet within 1 tenant. Flow Templates can be overridden per branch (e.g., flagship branch uses a more detailed flow, small branch uses a simpler flow).
- **Platform Super Admin** (outside any tenant) manages tenant provisioning, billing, and platform monitoring — not part of tenant RBAC.

## Extensibility Rules (for AI Agents & Developers)

When adding new capabilities, ask yourself:
- **"Is this a new node in an existing flow?"** → Add as a new reusable Flow Node; don't hardcode tenant-specific logic.
- **"Does this need a new event?"** → Define the event & its subscribers explicitly, consistent with the existing event-driven pattern.
- **"Is this truly unique to 1 tenant, or should it be a general configuration option?"** Default: make it a configuration option, not tenant-specific code.
