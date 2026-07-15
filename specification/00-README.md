# FlowServ — Unified Specification

> **This is the single source of truth** for understanding what FlowServ is, why it's built this way, and how it works — for AI agents, developers, and any future team member.

## What is FlowServ?

A **multi-tenant SaaS platform** that unifies Inventory Management, Service/Ticket Management, POS & Finance — governed by granular RBAC. It serves **any type of service center** (electronics, automotive, appliances, IT equipment, etc.) through a configurable Flow Engine.

## What Makes This Different?

> **Workflows are data/configuration, not hardcoded logic.**

Service and Inventory flows are composed of modular blocks ("Flow Nodes") that can be rearranged per tenant/branch/service type without deploying new code.

## Document Map

### Core Architecture
| # | Document | Purpose |
|---|----------|---------|
| 01 | [product-overview.md](./01-product-overview.md) | Vision, problems solved, target users, non-goals |
| 02 | [architecture.md](./02-architecture.md) | Flow Engine, modular workflow, event-driven core |
| 03 | [rbac-roles.md](./03-rbac-roles.md) | Roles, permissions, matrix, default thresholds |
| 04 | [tech-stack.md](./04-tech-stack.md) | Final tech stack: Hono, SvelteKit, Drizzle, Python printer |
| 05 | [data-model.md](./05-data-model.md) | ERD, entities, key fields |
| 06 | [api-design.md](./06-api-design.md) | API principles, endpoints, response envelope |
| 07 | [non-functional.md](./07-non-functional.md) | Security, multi-tenancy, scalability, compliance |
| 08 | [ui-ux.md](./08-ui-ux.md) | Design principles, key screens |
| 09 | [printer-integration.md](./09-printer-integration.md) | Python local agent for thermal printing |
| 10 | [ai-agent-build-guide.md](./10-ai-agent-build-guide.md) | Phase-by-phase build instructions |
| 11 | [glossary.md](./11-glossary.md) | Key terminology |

### Feature Catalog (`features/`)
| # | Document | Domain |
|---|----------|--------|
| 00 | [feature-catalog.md](./features/00-feature-catalog.md) | **Master list: ~170 features, per domain + per role** |
| 01 | [customer-device.md](./features/01-customer-device.md) | Customer & Device management |
| 02 | [service.md](./features/02-service.md) | Service lifecycle (intake to completion) |
| 03 | [service-billing.md](./features/03-service-billing.md) | Quotation, deposit, invoice, refund |
| 04 | [service-category.md](./features/04-service-category.md) | Service categories & pricing |
| 05 | [technician.md](./features/05-technician.md) | Assignment, calendar, performance, commission |
| 06 | [inventory.md](./features/06-inventory.md) | FIFO batch, stock movement, reservation |
| 07 | [purchasing.md](./features/07-purchasing.md) | PO, goods receiving, returns |
| 08 | [sales-pos.md](./features/08-sales-pos.md) | POS transactions, walk-in & linked |
| 09 | [supplier.md](./features/09-supplier.md) | Supplier management |
| 10 | [finance.md](./features/10-finance.md) | Accounting, ledger, reporting |
| 11 | [warranty.md](./features/11-warranty.md) | Warranty lifecycle |
| 12 | [dashboard-reporting.md](./features/12-dashboard-reporting.md) | Dashboard, widgets, alerts |
| 13 | [settings.md](./features/13-settings.md) | System configuration |

### Business Frameworks (`frameworks/`)
| # | Document | Purpose |
|---|----------|---------|
| 01 | [lifecycle-framework.md](./frameworks/01-lifecycle-framework.md) | Status management patterns |
| 02 | [transaction-framework.md](./frameworks/02-transaction-framework.md) | Transaction & audit trail rules |
| 03 | [approval-framework.md](./frameworks/03-approval-framework.md) | Approval & threshold patterns |
| 04 | [event-framework.md](./frameworks/04-event-framework.md) | Business events & notifications |
| 05 | [validation-rules.md](./frameworks/05-validation-rules.md) | Business rules & validation patterns |

### Coding Standards
| Document | Purpose |
|----------|---------|
| [coding-guidelines.md](./coding-guidelines.md) | **MANDATORY** naming, architecture, API format, testing |

## Related Files (Outside specification/)
- **`db/schema.ts`** — Drizzle database schema (living implementation of data model)
- **`drizzle.config.ts`** — Drizzle Kit configuration
- **`PHASES.md`** — Implementation progress checklist
- **`CLAUDE.md`** — AI agent entry point & project memory

## How to Use This Documentation

1. Read **01** and **02** to understand the "why" and the big picture.
2. Read **03** to understand who can do what.
3. Read **coding-guidelines.md** before writing ANY code.
4. Check **features/00-feature-catalog.md** for the full feature matrix.
5. Read the specific feature document before implementing a module.
6. Check **PHASES.md** to know the current phase and task status.
7. If a decision is not answered here, **do not assume** — mark it as an open question and confirm first.
