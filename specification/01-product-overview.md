# Product Overview

## Problem Statement

Service centers (electronics, automotive, appliances, IT equipment, etc.) face universal operational problems regardless of industry:

1. **Inventory, POS, and Finance run in silos.** Stock is tracked manually or in separate systems; cashier transactions don't deduct stock in real-time; financial reports only "sync" at month-end via manual reconciliation.
2. **Rigid service workflows.** All tickets — from quick fixes to complex repairs — are forced through the same hardcoded sequence of steps.
3. **Per-job margin is invisible until month-end.** Parts cost + technician labor aren't calculated in real-time, so the owner only knows profit/loss after monthly reports.
4. **RBAC is too coarse.** Typically just "Admin" and "Staff" — no granular control over who can approve discounts, void transactions, or modify pricing.
5. **Expanding to new service lines is expensive.** Adding a new service type or a branch with different SOPs usually requires custom development from the software vendor.

## Product Vision

Build a **modular workflow engine** for service centers — where Inventory Flow and Service Flow are composed of configurable components, integrated in real-time with POS and Finance, with granular RBAC as the control layer at every step.

Not a "one-size-fits-all" application, but a **platform that shapes itself to the user's business** — not the other way around.

## Target Users

| Persona | Primary Need |
|---------|-------------|
| **Tenant Owner / Director** | Cross-branch visibility, real-time financial reports, workflow configuration control |
| **Branch Manager** | Manage branch operations, approve transactions above threshold, monitor technician performance |
| **Technician** | Clear ticket queue, quick access to service history & part stock, minimal double data entry |
| **Cashier** | Fast & accurate transactions, auto-linked to service tickets or direct retail sales |
| **Finance Staff** | Real-time reports, per-ticket job costing, automated reconciliation |
| **Inventory Staff** | Stock control, purchase orders, low-stock alerts |
| **Customer (end-user)** | Transparent service status, approve additional costs without phone calls |

## Core Differentiators

1. **Modular Workflow Engine** — Flow Template & Flow Node that are configurable, not hardcoded. See: [02-architecture.md](./02-architecture.md)
2. **Event-driven, single source of truth** — one ticket status change automatically updates Inventory, POS, and Finance simultaneously, without manual sync.
3. **Real-time job costing** — per-ticket margin is visible from the moment a part is used, not waiting for month-end closing.
4. **Granular RBAC per workflow node** — not just "can access Module X", but "can execute this specific action, at this specific point."
5. **Per-tenant & per-branch configuration** — one platform, different SOPs per SaaS customer, even per branch within one tenant.

## Business Model

Multi-tenant SaaS, subscription tiers based on number of branches/users/ticket volume.

## Non-Goals (Explicit Scope Boundaries)

To prevent scope creep, the following are explicitly NOT in scope for the initial version:

- Not a general-purpose ERP (does not replace HR, payroll, or manufacturing planning modules)
- Not a full CRM marketing/sales pipeline (focus is operational service, not lead generation)
- Not a public e-commerce storefront (focus is B2B SaaS for service center operators)
